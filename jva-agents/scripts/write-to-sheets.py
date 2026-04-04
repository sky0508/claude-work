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

CREDENTIALS_FILE = Path.home() / ".config" / "gsheets-mcp" / "credentials.json"
TOKEN_FILE = Path.home() / ".config" / "gsheets-mcp" / "token.json"
SHEET_TAB = "Leads"

HEADERS = [
    "run_date", "company_name", "company_name_en", "url",
    "industry", "stage", "location", "why_target",
    "contact_name", "contact_title", "contact_linkedin", "contact_email",
    "source", "confidence"
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

    # ヘッダーがなければ追加
    existing = worksheet.get_all_values()
    if not existing:
        worksheet.append_row(HEADERS, value_input_option="RAW")

    return worksheet


def get_existing_companies(worksheet):
    """既存の company_name 一覧を取得（重複チェック用）"""
    all_values = worksheet.get_all_values()
    if len(all_values) <= 1:
        return set()

    try:
        header = all_values[0]
        col_idx = header.index("company_name")
        return {row[col_idx] for row in all_values[1:] if len(row) > col_idx and row[col_idx]}
    except ValueError:
        return set()


def lead_to_row(lead, run_date):
    contact = lead.get("contact", {}) or {}
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
        contact.get("linkedin", ""),
        contact.get("email", ""),
        lead.get("source", ""),
        lead.get("confidence", ""),
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
    existing = get_existing_companies(worksheet)

    # run_date を出力ファイル名から推定
    fname = os.path.basename(output_file)
    date_match = re.search(r'(\d{8})', fname)
    run_date = date_match.group(1)[:4] + "-" + date_match.group(1)[4:6] + "-" + date_match.group(1)[6:] if date_match else ""

    rows_written = 0
    skipped = 0
    for lead in leads:
        company = lead.get("company_name", "")
        if company in existing:
            skipped += 1
            continue
        worksheet.append_row(lead_to_row(lead, run_date), value_input_option="USER_ENTERED")
        existing.add(company)
        rows_written += 1

    msg = f"SHEETS: {rows_written}行追記"
    if skipped:
        msg += f"（{skipped}件重複スキップ）"
    print(msg)


if __name__ == "__main__":
    main()
