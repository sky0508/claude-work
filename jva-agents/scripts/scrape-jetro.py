#!/usr/bin/env python3
"""
scrape-jetro.py — JETRO Startup Portfolio をスクレイピングして Leads シートに追加

Usage: python3 scrape-jetro.py <spreadsheet_id>

- https://www.jetro.go.jp/en/startup/portfolio.html から全社を取得
- Leads タブと Target list タブの両方で重複チェック
- 新規分のみ Leads タブに追記
"""

import sys
import re
import os
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

CREDENTIALS_FILE = Path.home() / ".config" / "gsheets-mcp" / "credentials.json"
TOKEN_FILE = Path.home() / ".config" / "gsheets-mcp" / "token.json"
LEADS_TAB = "Leads"
TARGET_TAB = "Target List"
JETRO_URL = "https://www.jetro.go.jp/en/startup/portfolio.html"

HEADERS = [
    "run_date", "company_name", "company_name_en", "url",
    "industry", "stage", "location", "why_target",
    "contact_name", "contact_title", "contact_linkedin", "contact_email",
    "source", "confidence", "Status ", "contact_status", "outreach_status"
]


# ──────────────── ユーティリティ ────────────────

def _normalize(s):
    return re.sub(r'[\s\W]', '', s).lower()


def _domain(url):
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


# ──────────────── スクレイピング ────────────────

def fetch_html():
    """Playwright でJETROポートフォリオページを取得する"""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
            viewport={'width': 1280, 'height': 720}
        )
        page = context.new_page()
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)
        print(f"Fetching {JETRO_URL} ...")
        page.goto(JETRO_URL, wait_until='domcontentloaded', timeout=60000)
        page.wait_for_timeout(8000)
        html = page.content()
        browser.close()

    return html


def parse_companies(html):
    """HTMLから会社データを抽出する"""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, 'html.parser')
    container = soup.select_one('.elem_list_pic_text_flex.var_col3')
    if not container:
        raise RuntimeError("ポートフォリオコンテナが見つかりません。ページ構造が変わった可能性があります。")

    items = container.select('li')
    print(f"取得: {len(items)} 社")

    companies = []
    for li in items:
        # 会社名
        title_el = li.select_one('p.title')
        if not title_el:
            continue
        company_name = title_el.get_text(separator=' ').strip()
        # 外部リンクアイコンのテキストを除去
        company_name = re.sub(r'\s*External site.*$', '', company_name).strip()

        # URL
        link_el = li.select_one('a.inner')
        url = link_el['href'].strip() if link_el and link_el.get('href') else ''

        # ステージ (tag_blue)
        stage_el = li.select_one('span.cate.tag_blue')
        stage = stage_el.get_text(strip=True) if stage_el else ''

        # 業種 (tag_grey 複数 → カンマ結合)
        industry_els = li.select('span.cate.tag_grey')
        industry = ', '.join(el.get_text(strip=True) for el in industry_els)

        # dl/dt/dd から HQ Location と Contact を取得
        location = ''
        contact_raw = ''
        dt_els = li.select('dl dt')
        for dt in dt_els:
            label = dt.get_text(strip=True).rstrip(':').strip()
            dd = dt.find_next_sibling('dd')
            value = dd.get_text(strip=True) if dd else ''
            if 'HQ Location' in label:
                location = value
            elif 'Contact' in label:
                contact_raw = value

        # Contact を名前とタイトルに分割 (例: "Masafumi Asakura, Co-Founder&CEO")
        if contact_raw and ',' in contact_raw:
            parts = contact_raw.split(',', 1)
            contact_name = parts[0].strip()
            contact_title = parts[1].strip()
        else:
            contact_name = contact_raw
            contact_title = ''

        # LinkedIn
        linkedin_el = li.select_one('a[href*="linkedin.com"]')
        contact_linkedin = linkedin_el['href'].strip() if linkedin_el else ''

        companies.append({
            'company_name': company_name,
            'company_name_en': company_name,
            'url': url,
            'industry': industry,
            'stage': stage,
            'location': location,
            'contact_name': contact_name,
            'contact_title': contact_title,
            'contact_linkedin': contact_linkedin,
        })

    return companies


# ──────────────── Google Sheets 認証 ────────────────

def authenticate():
    import json
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request

    with open(CREDENTIALS_FILE) as f:
        creds_data = json.load(f)["installed"]

    with open(TOKEN_FILE) as f:
        token_data = json.load(f)

    creds = Credentials(
        token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=creds_data["client_id"],
        client_secret=creds_data["client_secret"],
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )

    if creds.expired and creds.refresh_token:
        import json
        creds.refresh(Request())
        token_data["access_token"] = creds.token
        token_data["expiry_date"] = int(creds.expiry.timestamp() * 1000) if creds.expiry else None
        with open(TOKEN_FILE, "w") as f:
            json.dump(token_data, f)

    return creds


# ──────────────── 重複チェック ────────────────

def get_leads_keys(worksheet):
    """Leads タブから既存の社名・ドメインを取得する"""
    all_values = worksheet.get_all_values()
    if len(all_values) <= 1:
        return set(), set()

    header = all_values[0]
    try:
        idx_ja  = header.index("company_name")
        idx_en  = header.index("company_name_en")
        idx_url = header.index("url")
    except ValueError:
        return set(), set()

    names, domains = set(), set()
    for row in all_values[1:]:
        def cell(i): return row[i] if len(row) > i else ""
        ja  = _normalize(cell(idx_ja))
        en  = _normalize(cell(idx_en))
        dom = _domain(cell(idx_url))
        if ja:  names.add(ja)
        if en:  names.add(en)
        if dom: domains.add(dom)

    return names, domains


def get_target_list_keys(spreadsheet):
    """Target list タブから既存の社名を取得する"""
    import gspread

    names = set()
    try:
        ws = spreadsheet.worksheet(TARGET_TAB)
    except gspread.WorksheetNotFound:
        print(f"注意: '{TARGET_TAB}' タブが見つかりません。スキップします。")
        return names

    all_values = ws.get_all_values()
    if len(all_values) <= 1:
        return names

    header = all_values[0]
    # "Company" 列を探す
    company_col = None
    for i, h in enumerate(header):
        if h.strip().lower() in ('company', 'company_name', 'company name'):
            company_col = i
            break

    if company_col is None:
        print(f"注意: '{TARGET_TAB}' タブにCompany列が見つかりません。")
        return names

    for row in all_values[1:]:
        val = row[company_col] if len(row) > company_col else ""
        if val:
            names.add(_normalize(val))

    print(f"Target list: {len(names)} 社の既存エントリを読み込み")
    return names


def get_or_create_leads_sheet(gc, spreadsheet_id):
    import gspread

    spreadsheet = gc.open_by_key(spreadsheet_id)
    try:
        worksheet = spreadsheet.worksheet(LEADS_TAB)
    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title=LEADS_TAB, rows=1000, cols=len(HEADERS))

    existing = worksheet.get_all_values()
    if not existing:
        worksheet.append_row(HEADERS, value_input_option="RAW")
    elif existing[0] != HEADERS:
        worksheet.insert_row(HEADERS, index=1, value_input_option="RAW")

    return spreadsheet, worksheet


def company_to_row(company, run_date):
    contact_linkedin = company['contact_linkedin']
    contact_status = "found" if contact_linkedin and "/in/" in contact_linkedin else "pending"
    return [
        run_date,
        company['company_name'],
        company['company_name_en'],
        company['url'],
        company['industry'],
        company['stage'],
        company['location'],
        "JETROポートフォリオ企業（政府認定スタートアップ）",
        company['contact_name'],
        company['contact_title'],
        contact_linkedin,
        "",                 # contact_email
        "JETRO Portfolio",  # source
        "high",             # confidence
        "",                 # Status (手動管理)
        contact_status,
        "未完了",           # outreach_status
    ]


# ──────────────── メイン ────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scrape-jetro.py <spreadsheet_id>", file=sys.stderr)
        sys.exit(1)

    spreadsheet_id = sys.argv[1]

    # 1. スクレイピング
    html = fetch_html()
    companies = parse_companies(html)

    if not companies:
        print("ERROR: 会社データが取得できませんでした")
        sys.exit(1)

    # 2. Google Sheets 接続
    import gspread
    creds = authenticate()
    gc = gspread.authorize(creds)
    spreadsheet, worksheet = get_or_create_leads_sheet(gc, spreadsheet_id)

    # 3. 重複チェック: Leads + Target list
    leads_names, leads_domains = get_leads_keys(worksheet)
    target_names = get_target_list_keys(spreadsheet)

    all_known_names = leads_names | target_names
    all_known_domains = leads_domains

    print(f"既存: Leadsタブ {len(leads_names)} 社名, Target listタブ {len(target_names)} 社名")

    # 4. 書き込み
    run_date = date.today().isoformat()
    skipped = 0
    new_rows = []

    for company in companies:
        name = _normalize(company['company_name'])
        dom  = _domain(company['url'])

        if (name and name in all_known_names) or (dom and dom in all_known_domains):
            skipped += 1
            continue

        new_rows.append(company_to_row(company, run_date))
        if name: all_known_names.add(name)
        if dom:  all_known_domains.add(dom)

    if new_rows:
        worksheet.append_rows(new_rows, value_input_option="USER_ENTERED")

    rows_written = len(new_rows)

    msg = f"JETRO: {rows_written} 行追記"
    if skipped:
        msg += f"（{skipped} 件重複スキップ）"
    print(msg)


if __name__ == "__main__":
    main()
