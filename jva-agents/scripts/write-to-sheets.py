#!/usr/bin/env python3
"""
write-to-sheets.py — Google Sheets へリードデータを書き込む

Usage: python3 write-to-sheets.py <output_file> <spreadsheet_id>

- run-agent.sh が生成した JSON ファイルを読み込む
- leads 配列を抽出して Google Sheets の "Leads" タブに追記
- 既存の company_name と重複する行はスキップ
- ヘッダー行がなければ自動作成
"""

import sys
import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

CREDENTIALS_FILE = Path.home() / ".config" / "gsheets-mcp" / "credentials.json"
TOKEN_FILE = Path.home() / ".config" / "gsheets-mcp" / "token.json"
SHEET_TAB = "Leads"

HEADERS = [
    "run_date", "company_name", "company_name_en", "url",
    "industry", "stage", "location", "why_target",
    "contact_name", "contact_title", "contact_linkedin", "contact_email",
    "source", "confidence", "Status ", "contact_status", "outreach_status"
]


def authenticate():
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
        creds.refresh(Request())
        # 更新されたトークンを保存
        token_data["access_token"] = creds.token
        token_data["expiry_date"] = int(creds.expiry.timestamp() * 1000) if creds.expiry else None
        with open(TOKEN_FILE, "w") as f:
            json.dump(token_data, f)

    return creds


def extract_leads(output_file):
    """claude -p の JSON 出力からリードデータを抽出する"""
    with open(output_file) as f:
        raw = f.read()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []

    # claude -p --output-format json の結果構造を処理
    result_text = ""
    if isinstance(data, dict) and "result" in data:
        result_text = data["result"]
    elif isinstance(data, list):
        texts = [b.get("text", "") for b in data if b.get("type") == "text"]
        result_text = "\n".join(texts)
    else:
        result_text = raw

    # JSON ブロックを検索
    json_match = re.search(r'\{[\s\S]*\}', result_text)
    if not json_match:
        return []

    try:
        leads_data = json.loads(json_match.group())
        return leads_data.get("leads", [])
    except (json.JSONDecodeError, AttributeError):
        return []


def get_or_create_sheet(gc, spreadsheet_id):
    """スプレッドシートを開き、Leads タブを取得または作成する"""
    import gspread

    spreadsheet = gc.open_by_key(spreadsheet_id)

    try:
        worksheet = spreadsheet.worksheet(SHEET_TAB)
    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title=SHEET_TAB, rows=1000, cols=len(HEADERS))

    # ヘッダーがなければ1行目に挿入
    existing = worksheet.get_all_values()
    if not existing:
        worksheet.append_row(HEADERS, value_input_option="RAW")
    elif existing[0] != HEADERS:
        worksheet.insert_row(HEADERS, index=1, value_input_option="RAW")

    return worksheet


def _normalize(s):
    """名寄せ用の正規化（記号・スペース除去・小文字化）"""
    return re.sub(r'[\s\W]', '', s).lower()


def _domain(url):
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def get_existing_keys(worksheet):
    """既存行から重複検知用キーセットを返す（社名JA/EN正規化 + URLドメイン）"""
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
        def cell(i):
            return row[i] if len(row) > i else ""
        ja  = _normalize(cell(idx_ja))
        en  = _normalize(cell(idx_en))
        dom = _domain(cell(idx_url))
        if ja:  names.add(ja)
        if en:  names.add(en)
        if dom: domains.add(dom)
    return names, domains


def lead_to_row(lead, run_date):
    contact = lead.get("contact", {}) or {}
    contact_linkedin = contact.get("linkedin", "")
    contact_status = "found" if contact_linkedin and "/in/" in contact_linkedin else "pending"
    return [
        run_date,
        lead.get("company_name", ""),
        lead.get("company_name_en", ""),
        lead.get("url", ""),
        lead.get("industry", ""),
        lead.get("stage", ""),
        lead.get("location", ""),
        lead.get("why_target", ""),
        contact.get("name", ""),
        contact.get("title", ""),
        contact_linkedin,
        contact.get("email", ""),
        lead.get("source", ""),
        lead.get("confidence", ""),
        "",           # Status (手動管理列)
        contact_status,
        "未完了",     # outreach_status
    ]


def main():
    if len(sys.argv) < 3:
        print("Usage: write-to-sheets.py <output_file> <spreadsheet_id>", file=sys.stderr)
        sys.exit(1)

    output_file = sys.argv[1]
    spreadsheet_id = sys.argv[2]

    if not os.path.exists(output_file):
        print(f"ERROR: File not found: {output_file}", file=sys.stderr)
        sys.exit(1)

    leads = extract_leads(output_file)
    if not leads:
        print("SHEETS: No leads found in output")
        return

    import gspread

    creds = authenticate()
    gc = gspread.authorize(creds)
    worksheet = get_or_create_sheet(gc, spreadsheet_id)
    existing_names, existing_domains = get_existing_keys(worksheet)

    # run_date を出力ファイル名から推定
    fname = os.path.basename(output_file)
    date_match = re.search(r'(\d{8})', fname)
    run_date = date_match.group(1)[:4] + "-" + date_match.group(1)[4:6] + "-" + date_match.group(1)[6:] if date_match else ""

    rows_written = 0
    skipped = 0
    for lead in leads:
        name_ja  = _normalize(lead.get("company_name", ""))
        name_en  = _normalize(lead.get("company_name_en", ""))
        dom      = _domain(lead.get("url", ""))

        if (name_ja and name_ja in existing_names) or \
           (name_en and name_en in existing_names) or \
           (dom and dom in existing_domains):
            skipped += 1
            continue

        worksheet.append_row(lead_to_row(lead, run_date), value_input_option="USER_ENTERED")
        if name_ja: existing_names.add(name_ja)
        if name_en: existing_names.add(name_en)
        if dom:     existing_domains.add(dom)
        rows_written += 1

    msg = f"SHEETS: {rows_written}行追記"
    if skipped:
        msg += f"（{skipped}件重複スキップ）"
    print(msg)


if __name__ == "__main__":
    main()
