#!/usr/bin/env python3
"""
JVA Webhook Server
Manus AI の週次レポートを受け取り、ローカルKDBを自動更新する
"""
import os
import re
import json
import secrets
from datetime import date, datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.responses import JSONResponse
import uvicorn

# ━━━━━━━━━━━━━━━━━━━━ 設定 ━━━━━━━━━━━━━━━━━━━━
COMPANY_DIR  = Path("/Users/sorasasaki/claude-workspace/company_jva")
CONFIG_PATH  = Path(__file__).parent / "config.json"
DB_WEEKLY    = COMPANY_DIR / "kpi/db/weekly.md"
DB_MONTHLY   = COMPANY_DIR / "kpi/db/monthly.md"
DB_CONV      = COMPANY_DIR / "kpi/db/conversion.md"
CURRENT_MD   = COMPANY_DIR / "kpi/current.md"
STRATEGY_DIR = COMPANY_DIR / "strategy/sessions"
REPORTS_DIR  = COMPANY_DIR / "reports/weekly"


def _init_config() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    cfg = {"token": secrets.token_urlsafe(32), "port": 8765}
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2))
    print(f"\n✅ 初回起動: トークンを生成しました → {cfg['token']}\n")
    return cfg


CONFIG = _init_config()
TOKEN  = CONFIG["token"]
PORT   = CONFIG.get("port", 8765)

app = FastAPI(title="JVA KPI Webhook", version="1.0")


# ━━━━━━━━━━━━━━━━━━━━ パーサー ━━━━━━━━━━━━━━━━━━━━
def parse_report(text: str) -> dict:
    """Manus AI レポートからデータを抽出する"""

    # 週の範囲・年  "Week of Mar 11, 2026 (03/05 - 03/11)"
    hdr = re.search(r'Week of \w+ \d+, (\d{4}) \((\d{2}/\d{2}) - (\d{2}/\d{2})\)', text)
    year       = hdr.group(1) if hdr else str(date.today().year)
    week_start = hdr.group(2) if hdr else ""
    week_end   = hdr.group(3) if hdr else ""

    # Growth Summary テーブル
    def get_metric(label: str) -> int:
        m = re.search(rf'\*\*{re.escape(label)}\*\*\s*\|\s*\*\*(\d+)\*\*', text)
        return int(m.group(1)) if m else 0

    line_new = get_metric("New LINE Connections")
    apps_new = get_metric("Student Applications")
    co_apps  = get_metric("Company Applications")
    matches  = get_metric("Matches Completed")

    # LINE累計 — Daily Breakdown の最終行の "Total Friends" 列
    # 形式: "| 03/11/2026 | 66 | 0 |" or "| **03/07/2026** | 61 | **+4** |"
    daily_rows = re.findall(
        r'\|\s*\*?\*?\d{2}/\d{2}/\d{4}\*?\*?\s*\|\s*\*?\*?(\d+)\*?\*?\s*\|',
        text
    )
    line_total = int(daily_rows[-1]) if daily_rows else 0

    # JBA週番号（8人目追加日 2026-01-13 木曜起点、7日刻み）
    iso_week = ""
    LAUNCH = date(2026, 1, 13)
    if week_end and year:
        mm, dd = week_end.split('/')
        end_date = date(int(year), int(mm), int(dd))
        delta = (end_date - LAUNCH).days
        week_num = delta // 7 + 1
        iso_week = f"{year}-W{week_num:02d}"

    # 学生詳細
    # 形式: "| **03/07/2026** 14:40 | Jeongmin | Waseda University | email |"
    students = []
    for m in re.finditer(
        r'\|\s*\*?\*?(\d{2}/\d{2}/\d{4})\*?\*?[^|]*?\|\s*\*?([^|*\n]+?)\*?\s*\|\s*([^|\n]+?)\s*\|\s*([^\s|@\n]+@[^\s|@\n]+)\s*\|',
        text
    ):
        students.append({
            "date":       m.group(1).strip(),
            "name":       m.group(2).strip(),
            "university": m.group(3).strip(),
            "email":      m.group(4).strip(),
        })

    return {
        "year":          year,
        "week_start":    week_start,
        "week_end":      week_end,
        "week_range":    f"{week_start} - {week_end}",
        "iso_week":      iso_week,
        "line_new":      line_new,
        "line_total":    line_total,
        "apps_new":      apps_new,
        "co_apps":       co_apps,
        "matches":       matches,
        "students":      students,
        "student_count": len(students),
    }


# ━━━━━━━━━━━━━━━━━━━━ KDB Updater ━━━━━━━━━━━━━━━━━━━━
def _table_append(filepath: Path, new_row: str) -> None:
    """テーブルの最後の行の後に new_row を追加する"""
    lines = filepath.read_text().split('\n')
    last_table_idx = max((i for i, l in enumerate(lines) if l.startswith('|')), default=-1)
    if last_table_idx >= 0:
        lines.insert(last_table_idx + 1, new_row)
    else:
        lines.append(new_row)
    filepath.write_text('\n'.join(lines))


def update_weekly(r: dict) -> str:
    content = DB_WEEKLY.read_text()
    week    = r["iso_week"]
    new_row = f"| {week} | {r['line_new']} | {r['line_total']} | {r['apps_new']} | {r['matches']} | — | — | — | — |"

    if f"| {week} |" in content:
        old = re.search(rf'\| {re.escape(week)} \|[^\n]+', content)
        if old and old.group().count('—') >= 3:
            DB_WEEKLY.write_text(content.replace(old.group(), new_row))
            return f"updated {week}"
        return f"skipped (already has data): {week}"

    _table_append(DB_WEEKLY, new_row)
    return f"added {week}"


def update_monthly(r: dict) -> str:
    content     = DB_MONTHLY.read_text()
    year, month = r["year"], (r["week_end"].split('/')[0] if r["week_end"] else "")
    if not month:
        return "skipped: no month"

    month_label = f"{year}-{month}"   # "2026-03"

    # 当月の集計値を db/weekly.md から再計算
    weekly_text = DB_WEEKLY.read_text()
    m_line_new, m_line_total, m_apps, m_matches = 0, 0, 0, 0
    for row in re.finditer(
        r'\|\s*([\d-]+W\d+)\s*\|\s*([\d—]+)\s*\|\s*([\d—]+)\s*\|\s*([\d—]+)\s*\|\s*([\d—]+)\s*\|',
        weekly_text
    ):
        try:
            yr, wk = row.group(1).strip().split('-W')
            monday = date.fromisocalendar(int(yr), int(wk), 1)
            if f"{monday.year}-{monday.month:02d}" == month_label:
                def val(s): return int(s) if s != '—' else 0
                m_line_new   += val(row.group(2))
                m_line_total  = max(m_line_total, val(row.group(3)))
                m_apps       += val(row.group(4))
                m_matches    += val(row.group(5))
        except Exception:
            continue

    targets = {"line": 16.7, "app": 8.3, "match": 5}
    line_rate  = f"{m_line_new / targets['line'] * 100:.0f}%"
    app_rate   = f"{m_apps / targets['app'] * 100:.0f}%" if m_apps else "—"
    match_rate = f"{m_matches / targets['match'] * 100:.0f}%"

    new_row = f"| {month_label} | {m_line_new} | {m_line_total} | {m_apps} | {m_matches} | — | {line_rate} | {app_rate} | {match_rate} |"

    if month_label in content:
        old = re.search(rf'\| {re.escape(month_label)} \|[^\n]+', content)
        if old:
            DB_MONTHLY.write_text(content.replace(old.group(), new_row))
            return f"updated {month_label}"

    _table_append(DB_MONTHLY, new_row)
    return f"added {month_label}"


def update_conversion(r: dict) -> tuple:
    """コンバージョン率を更新。(message, app_total, match_total) を返す"""
    content = DB_CONV.read_text()

    # 直前行から累計を取得
    rows = re.findall(
        r'\|\s*([\d-]+W\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|',
        content
    )
    prev_app_total   = int(rows[-1][2]) if rows else 15   # W09以前の既知値
    prev_match_total = int(rows[-1][3]) if rows else 0

    app_total   = prev_app_total + r["apps_new"]
    match_total = prev_match_total + r["matches"]
    line_total  = r["line_total"]

    l2a = f"{app_total / line_total * 100:.1f}%"  if line_total else "—"
    a2m = f"{match_total / app_total * 100:.1f}%" if app_total  else "—"

    week    = r["iso_week"]
    new_row = f"| {week} | {line_total} | {app_total} | {match_total} | {l2a} | {a2m} |"

    if f"| {week} |" in content:
        old = re.search(rf'\| {re.escape(week)} \|[^\n]+', content)
        if old:
            DB_CONV.write_text(content.replace(old.group(), new_row))
            return f"updated {week}", app_total, match_total

    _table_append(DB_CONV, new_row)
    return f"added {week}", app_total, match_total


def update_current(r: dict, app_total: int, match_total: int) -> str:
    content = CURRENT_MD.read_text()
    today   = date.today().strftime("%Y-%m-%d")

    content = re.sub(r'\| 更新日 \|[^\n]+',    f'| 更新日 | {today} |',               content)
    content = re.sub(r'\| 対象週 \|[^\n]+',    f'| 対象週 | {r["iso_week"]} |',        content)
    content = re.sub(r'\| ソース \|[^\n]+',     f'| ソース | Manus AI ({r["week_range"]}) |', content)

    content = re.sub(
        r'\| LINE新規追加 \|[^\n]+',
        f'| LINE新規追加 | **{r["line_total"]}名** | +{r["line_new"]}名 | 16.7名 | — |',
        content
    )
    content = re.sub(
        r'\| Application \|[^\n]+',
        f'| Application | **{app_total}件** | {r["apps_new"]}件 | 8.3件 | — |',
        content
    )

    l2a = f"{app_total / r['line_total'] * 100:.1f}%" if r["line_total"] else "—"
    a2m = f"{match_total / app_total * 100:.1f}%"     if app_total        else "—"
    content = re.sub(
        r'\| LINE → Application \|[^\n]+',
        f'| LINE → Application | **{l2a}** | — | {"⚠️" if app_total / max(r["line_total"],1) < 0.3 else "✅"} |',
        content
    )

    # 月次トレンド: 当月行のみ更新（ヘッダー行は触らない）
    year  = r["year"]
    month = r["week_end"].split('/')[0] if r["week_end"] else ""
    if month:
        month_label = f"{year}-{month}"
        # 月次集計値を monthly.md から取得
        monthly = DB_MONTHLY.read_text()
        m_row = re.search(rf'\| {re.escape(month_label)} \|[^\n]+', monthly)
        if m_row:
            cols = [c.strip() for c in m_row.group().split('|') if c.strip()]
            # cols: [month, line_new, line_total, app, match, jobcard, line_rate, app_rate, match_rate]
            if len(cols) >= 5:
                trend_new = cols[1] if len(cols) > 1 else "—"
                trend_app = cols[3] if len(cols) > 3 else "—"
                trend_match = cols[4] if len(cols) > 4 else "—"
                trend_rate = cols[6] if len(cols) > 6 else "—"
                new_trend = f"| {month_label}（〜{r['iso_week']}） | +{trend_new}名 | {trend_app}件 | {trend_match} | {trend_rate} |"
                # 当月行を置換（〜W** パターン or 固定月ラベルどちらでも）
                content = re.sub(
                    rf'\| {re.escape(month_label)}[^|]*\|[^\n]+',
                    new_trend,
                    content
                )

    CURRENT_MD.write_text(content)
    return "updated"


# ━━━━━━━━━━━━━━━━━━━━ Strategy Session ━━━━━━━━━━━━━━━━━━━━
def generate_strategy(r: dict, app_total: int, match_total: int) -> str:
    today    = date.today().strftime("%Y-%m-%d")
    filepath = STRATEGY_DIR / f"{today}.md"

    # Claude API で生成を試みる
    ai_body = None
    try:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if api_key:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)

            current_snap  = CURRENT_MD.read_text()[:1500]
            weekly_recent = "\n".join(DB_WEEKLY.read_text().split('\n')[-8:])

            prompt = f"""JVA IBの週次PDCAセッションを生成してください。

## 今週のデータ（{r['iso_week']} / {r['week_range']}）
- LINE: +{r['line_new']}名（累計{r['line_total']}名）
- Application: +{r['apps_new']}件（累計{app_total}件）
- Match: +{r['matches']}件（累計{match_total}件）
- 新規学生: {[s['name']+'（'+s['university']+'）' for s in r['students']] or 'なし'}

## KPI現状
{current_snap}

## 直近週次推移
{weekly_recent}

以下の構成でMarkdown（日本語）を生成してください。前置きなしに内容から始めること。

## ① KPIギャップ分析（テーブル: KPI/月次目標/累計/直近週/達成率）
## ② 週次トレンド観察（箇条書き2-3点）
## ③ ボトルネック特定（1-2点）
## ④ 仮説（最大3つ）
## ⑤ 打ち手リスト（テーブル: 施策/担当/期限/優先度）
## ⑥ 今週のアクションアイテム（最大3件・具体的に）
## 次回への引き継ぎ"""

            res     = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            ai_body = res.content[0].text
    except Exception as e:
        print(f"Claude API error (using template): {e}")

    # ヘッダー
    header = f"""---
date: "{today}"
week: "{r['iso_week']}"
source: "Manus AI Weekly Report ({r['week_range']})"
generated_by: "{'Claude API' if ai_body else 'template'} + JVA Webhook"
---

# ストラテジーセッション: {today}（{r['iso_week']}）

## 新規学生（{r['student_count']}名）
{chr(10).join(f"- **{s['name']}**（{s['university']}）{s['date']}" for s in r['students']) or "- なし"}
"""

    if ai_body:
        body = f"\n---\n\n{ai_body}"
    else:
        l2a = f"{app_total / max(r['line_total'],1) * 100:.1f}%"
        a2m = f"{match_total / max(app_total,1) * 100:.1f}%"
        body = f"""
---

## ① KPIギャップ分析

| KPI | 月次目標 | 累計 | 直近週 |
|-----|---------|------|--------|
| LINE新規 | 16.7名 | {r['line_total']}名 | +{r['line_new']}名 |
| Application | 8.3件 | {app_total}件 | +{r['apps_new']}件 |
| Match | 5件 | {match_total}件 | +{r['matches']}件 |

## ② コンバージョン
- LINE→App: {l2a}
- App→Match: {a2m} {"❌ 完全停止" if match_total == 0 else ""}

## ⑥ 今週のアクションアイテム（要確認・Claude と話して詳細化）
1. 新規学生スクリーニング: {', '.join(s['name'] for s in r['students']) or 'なし'}
2. Match 0件継続中 → 企業フォロー状況確認
3. LINE登録者へのブロードキャスト検討

> ⚠️ Claude API 未設定のためテンプレート生成。詳細分析は「戦略を話したい」と伝えてください。
"""

    footer = f"\n---\n*自動生成: {datetime.now().strftime('%Y-%m-%d %H:%M')} by JVA Webhook*\n"
    content = header + body + footer

    if filepath.exists():
        existing = filepath.read_text()
        filepath.write_text(existing + "\n\n---\n\n" + content)
        return f"appended to {filepath.name}"
    else:
        filepath.write_text(content)
        return f"created {filepath.name}"


# ━━━━━━━━━━━━━━━━━━━━ Routes ━━━━━━━━━━━━━━━━━━━━
@app.get("/health")
async def health():
    return {"status": "ok", "service": "JVA KPI Webhook"}


@app.post("/webhook/weekly-report")
async def receive_weekly_report(
    request: Request,
    authorization: str = Header(None)
):
    # 認証
    if not authorization or authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid token")

    # レポート本文を取得（text/markdown or JSON どちらも対応）
    ct = request.headers.get("content-type", "")
    if "json" in ct:
        body = await request.json()
        report_text = body.get("report") or body.get("content") or str(body)
    else:
        raw = await request.body()
        report_text = raw.decode("utf-8")

    if not report_text.strip():
        raise HTTPException(status_code=400, detail="Empty report body")

    # パース
    r = parse_report(report_text)
    if not r.get("iso_week"):
        raise HTTPException(status_code=422, detail="Could not parse week from report")

    # レポートを保存
    report_file = REPORTS_DIR / f"{r['iso_week']}.md"
    if not report_file.exists():
        report_file.write_text(report_text)
        results_save = f"saved {report_file.name}"
    else:
        results_save = f"already exists: {report_file.name}"

    # KDB更新
    results = {"report": results_save}
    results["weekly"]     = update_weekly(r)
    results["monthly"]    = update_monthly(r)
    conv_msg, app_total, match_total = update_conversion(r)
    results["conversion"] = conv_msg
    results["current"]    = update_current(r, app_total, match_total)
    results["strategy"]   = generate_strategy(r, app_total, match_total)

    return JSONResponse({
        "ok":    True,
        "week":  r["iso_week"],
        "parsed": {
            "line_new":   r["line_new"],
            "line_total": r["line_total"],
            "apps_new":   r["apps_new"],
            "matches":    r["matches"],
            "students":   r["student_count"],
        },
        "updated": results,
    })


if __name__ == "__main__":
    print(f"\n🚀 JVA Webhook Server")
    print(f"   Port:  {PORT}")
    print(f"   Token: {TOKEN}")
    print(f"   KDB:   {COMPANY_DIR}/kpi/db/\n")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
