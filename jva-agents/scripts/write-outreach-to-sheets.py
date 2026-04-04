#!/usr/bin/env python3
"""
write-outreach-to-sheets.py — Google Sheets の "Outreach" タブにアウトリーチ下書きを書き込む

Usage: python3 write-outreach-to-sheets.py <output_file> <spreadsheet_id> [db_path]

- run-agent.sh が生成した JSON ファイルを読み込む
- messages 配列を抽出して Google Sheets の "Outreach" タブに追記
- SQLite の outreach_logs テーブルにも記録（db_path が渡された場合）
- 既にアウトリーチ済みの企業はスキップ（outreach_logs 参照）
- ヘッダー行がなければ自動作成
"""

import sys
import json
import os
import re
import sqlite3
from pathlib import Path

CREDENTIALS_FILE = Path.home() / ".config" / "gsheets-mcp" / "credentials.json"
TOKEN_FILE = Path.home() / ".config" / "gsheets-mcp" / "token.json"
SHEET_TAB = "Outreach"

HEADERS = [
    "run_date", "company_name", "channel",
    "recipient_name", "linkedin_url", "email",
    "subject", "message_body", "status", "sent_at", "notes"
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
        token_data["access_token"] = creds.token
        token_data["expiry_date"] = int(creds.expiry.timestamp() * 1000) if creds.expiry else None
        with open(TOKEN_FILE, "w") as f:
            json.dump(token_data, f)

    return creds


def extract_messages(output_file):
    """claude -p の JSON 出力からメッセージデータを抽出する"""
    with open(output_file) as f:
        raw = f.read()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [], None

    result_text = ""
    if isinstance(data, dict) and "result" in data:
        result_text = data["result"]
    elif isinstance(data, list):
        texts = [b.get("text", "") for b in data if b.get("type") == "text"]
        result_text = "\n".join(texts)
    else:
        result_text = raw

    json_match = re.search(r'\{[\s\S]*\}', result_text)
    if not json_match:
        return [], None

    try:
        outreach_data = json.loads(json_match.group())
        messages = outreach_data.get("messages", [])
        lead_run_id = outreach_data.get("based_on_lead_run_id")
        return messages, lead_run_id
    except (json.JSONDecodeError, AttributeError):
        return [], None


def get_or_create_sheet(gc, spreadsheet_id):
    import gspread

    spreadsheet = gc.open_by_key(spreadsheet_id)

    try:
        worksheet = spreadsheet.worksheet(SHEET_TAB)
    except gspread.WorksheetNotFound:
        worksheet = spreadsheet.add_worksheet(title=SHEET_TAB, rows=1000, cols=len(HEADERS))

    existing = worksheet.get_all_values()
    if not existing:
        worksheet.append_row(HEADERS, value_input_option="RAW")
    elif existing[0] != HEADERS:
        worksheet.insert_row(HEADERS, index=1, value_input_option="RAW")

    return worksheet


def get_existing_companies(worksheet):
    """Outreach タブから既存の企業名セットを返す"""
    all_values = worksheet.get_all_values()
    if len(all_values) <= 1:
        return set()

    header = all_values[0]
    try:
        idx = header.index("company_name")
    except ValueError:
        return set()

    return {row[idx].strip().lower() for row in all_values[1:] if len(row) > idx and row[idx]}


def message_to_row(msg, run_date):
    return [
        run_date,
        msg.get("company_name", ""),
        msg.get("channel", ""),
        msg.get("recipient_name", "") or "",
        msg.get("linkedin_url", "") or "",
        msg.get("email", "") or "",
        msg.get("subject", "") or "",
        msg.get("message_body", "") or "",
        msg.get("status", "drafted"),
        "",  # sent_at (人間が記入)
        "",  # notes
    ]


def update_leads_outreach_status(gc, spreadsheet_id, messages):
    """Leads タブの outreach_status 列を更新する（drafted の企業を「完了」に）"""
    import gspread

    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        leads_ws = spreadsheet.worksheet("Leads")
        all_values = leads_ws.get_all_values()
        if len(all_values) <= 1:
            return

        header = all_values[0]
        try:
            col_company = header.index("company_name")
            col_company_en = header.index("company_name_en")
            col_outreach = header.index("outreach_status")
        except ValueError:
            return  # ヘッダーが見つからない場合はスキップ

        # drafted 企業名のセット（正規化）
        drafted_names = set()
        for msg in messages:
            if msg.get("status") == "drafted":
                name = (msg.get("company_name") or "").strip().lower()
                if name:
                    drafted_names.add(name)

        if not drafted_names:
            return

        # 更新対象の行を探してバッチ更新
        updates = []
        for row_idx, row in enumerate(all_values[1:], start=2):  # 2行目から
            name_ja = row[col_company].strip().lower() if len(row) > col_company else ""
            name_en = row[col_company_en].strip().lower() if len(row) > col_company_en else ""
            if name_ja in drafted_names or name_en in drafted_names:
                # outreach_status 列を「完了」に更新
                col_letter = chr(ord('A') + col_outreach)
                updates.append({
                    "range": f"{col_letter}{row_idx}",
                    "value": "完了"
                })

        for update in updates:
            leads_ws.update(update["range"], [[update["value"]]])

        print(f"Leads.outreach_status 更新: {len(updates)}行 → 完了", flush=True)

    except Exception as e:
        print(f"Leads status update warning: {e}", file=sys.stderr)


def write_to_sqlite(db_path, messages, run_id_str):
    """outreach_logs テーブルに記録する"""
    try:
        run_id = int(run_id_str) if run_id_str else None
    except (ValueError, TypeError):
        run_id = None

    try:
        conn = sqlite3.connect(db_path)
        for msg in messages:
            conn.execute("""
                INSERT INTO outreach_logs
                  (run_id, company_name, channel, recipient_name,
                   linkedin_url, email, message_body, status, skip_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id,
                msg.get("company_name"),
                msg.get("channel"),
                msg.get("recipient_name"),
                msg.get("linkedin_url"),
                msg.get("email"),
                msg.get("message_body"),
                msg.get("status", "drafted"),
                msg.get("skip_reason"),
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"SQLite write warning: {e}", file=sys.stderr)


def main():
    if len(sys.argv) < 3:
        print("Usage: write-outreach-to-sheets.py <output_file> <spreadsheet_id> [db_path]",
              file=sys.stderr)
        sys.exit(1)

    output_file = sys.argv[1]
    spreadsheet_id = sys.argv[2]
    db_path = sys.argv[3] if len(sys.argv) > 3 else None

    if not os.path.exists(output_file):
        print(f"ERROR: File not found: {output_file}", file=sys.stderr)
        sys.exit(1)

    messages, lead_run_id = extract_messages(output_file)
    if not messages:
        print("OUTREACH-SHEETS: No messages found in output")
        return

    # Sheetsへの書き込み
    import gspread

    creds = authenticate()
    gc = gspread.authorize(creds)
    worksheet = get_or_create_sheet(gc, spreadsheet_id)
    existing_companies = get_existing_companies(worksheet)

    fname = os.path.basename(output_file)
    date_match = re.search(r'(\d{8})', fname)
    run_date = (date_match.group(1)[:4] + "-" + date_match.group(1)[4:6] + "-" +
                date_match.group(1)[6:]) if date_match else ""

    rows_written = 0
    skipped = 0
    for msg in messages:
        company = (msg.get("company_name", "") or "").strip().lower()
        if company and company in existing_companies:
            skipped += 1
            continue

        worksheet.append_row(message_to_row(msg, run_date), value_input_option="USER_ENTERED")
        if company:
            existing_companies.add(company)
        rows_written += 1

    # Leads タブの outreach_status を「完了」に更新
    update_leads_outreach_status(gc, spreadsheet_id, messages)

    # SQLite への記録
    if db_path and os.path.exists(db_path):
        write_to_sqlite(db_path, messages, None)

    msg_parts = [f"OUTREACH-SHEETS: {rows_written}行追記"]
    if skipped:
        msg_parts.append(f"（{skipped}件重複スキップ）")
    print("".join(msg_parts))


if __name__ == "__main__":
    main()
