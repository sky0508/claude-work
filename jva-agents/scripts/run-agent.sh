#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
DB_PATH="$PROJECT_DIR/db/jva-agents.db"
HOOK_SCRIPT="$SCRIPT_DIR/post-run-hook.sh"
NOTIFY_SCRIPT="$SCRIPT_DIR/notify-discord.sh"
OUTPUT_DIR="$PROJECT_DIR/db/runs"

mkdir -p "$OUTPUT_DIR"

ENV_FILE="$PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

usage() {
  cat <<EOF
Usage: $0 <agent-name> <pokemon-name> [prompt-override]

Arguments:
  agent-name      Agent file name (without .md) in .claude/agents/
  pokemon-name    Pokemon display name for Discord notifications
  prompt-override Optional custom prompt (overrides skill-based prompt)

Example:
  $0 lead-search ニャース
  $0 lead-search ニャース "東京のFinTechスタートアップを5社探して"
EOF
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

AGENT_NAME="$1"
POKEMON_NAME="$2"
PROMPT_OVERRIDE="${3:-}"

AGENT_FILE="$PROJECT_DIR/.claude/agents/${AGENT_NAME}.md"
if [ ! -f "$AGENT_FILE" ]; then
  echo "[run-agent] ERROR: Agent file not found: $AGENT_FILE" >&2
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "[run-agent] Database not found. Initializing..."
  "$SCRIPT_DIR/init-db.sh"
fi

RUN_ID=$(sqlite3 "$DB_PATH" "
  INSERT INTO agent_runs (agent_name, pokemon_name, status)
  VALUES ('${AGENT_NAME}', '${POKEMON_NAME}', 'running');
  SELECT last_insert_rowid();
")
echo "[run-agent] Started run #${RUN_ID} — ${POKEMON_NAME} (${AGENT_NAME})"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/${AGENT_NAME}_${TIMESTAMP}_${RUN_ID}.json"
ERROR_FILE="$OUTPUT_DIR/${AGENT_NAME}_${TIMESTAMP}_${RUN_ID}.err"

SKILL_REF=$(grep -o '\.claude/skills/[^ ]*\.md' "$AGENT_FILE" 2>/dev/null | head -1 || true)
SKILL_CONTENT=""
if [ -n "$SKILL_REF" ] && [ -f "$PROJECT_DIR/$SKILL_REF" ]; then
  SKILL_CONTENT=$(cat "$PROJECT_DIR/$SKILL_REF")
fi

AGENT_CONTENT=$(cat "$AGENT_FILE")

if [ -n "$PROMPT_OVERRIDE" ]; then
  FULL_PROMPT="$PROMPT_OVERRIDE"
else
  FULL_PROMPT="あなたは ${POKEMON_NAME} です。以下のエージェント定義とスキルに従って、タスクを実行してください。

--- エージェント定義 ---
${AGENT_CONTENT}

--- スキル ---
${SKILL_CONTENT}

実行結果を必ず以下のJSON形式で出力してください。JSON以外のテキストは出力しないでください。"
fi

CLAUDE_EXIT=0
env -u CLAUDECODE claude -p "$FULL_PROMPT" \
  --max-turns 20 \
  --output-format json \
  --dangerously-skip-permissions \
  > "$OUTPUT_FILE" 2> "$ERROR_FILE" || CLAUDE_EXIT=$?

FINISHED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ $CLAUDE_EXIT -ne 0 ]; then
  ERROR_MSG=$(cat "$ERROR_FILE" 2>/dev/null | head -c 500)
  sqlite3 "$DB_PATH" "
    UPDATE agent_runs
    SET status = 'failed',
        finished_at = '${FINISHED_AT}',
        error_message = '$(echo "$ERROR_MSG" | LC_ALL=C sed "s/'/''/g")'
    WHERE id = ${RUN_ID};
  "

  echo "[run-agent] FAILED run #${RUN_ID}" >&2

  "$NOTIFY_SCRIPT" \
    --pokemon "$POKEMON_NAME" \
    --status "failed" \
    --title "🔥 ${POKEMON_NAME} がたおれた..." \
    --body "うわっ、なんかエラーが出ちゃった😢\nRun #${RUN_ID}\n\n\`\`\`\n${ERROR_MSG}\n\`\`\`" 2>/dev/null || true

  exit 1
fi

CLAUDE_OUTPUT=""
if [ -f "$OUTPUT_FILE" ]; then
  RESULT_FIELD=$(python3 -c "
import json, sys
try:
    data = json.load(open('$OUTPUT_FILE'))
    if isinstance(data, dict) and 'result' in data:
        print(data['result'])
    elif isinstance(data, list):
        for block in data:
            if block.get('type') == 'text':
                print(block.get('text', ''))
    else:
        print(json.dumps(data, ensure_ascii=False)[:2000])
except:
    print(open('$OUTPUT_FILE').read()[:2000])
" 2>/dev/null || cat "$OUTPUT_FILE" | head -c 2000)
  CLAUDE_OUTPUT="$RESULT_FIELD"
fi

HOOK_STATUS="success"
HOOK_MSG=""
if [ -x "$HOOK_SCRIPT" ]; then
  echo "[run-agent] Running post-run hook..."
  HOOK_OUTPUT=$("$HOOK_SCRIPT" "$OUTPUT_FILE" "$AGENT_NAME" 2>&1) || {
    HOOK_STATUS="hook_rejected"
    HOOK_MSG="$HOOK_OUTPUT"
    echo "[run-agent] Hook REJECTED: $HOOK_MSG" >&2
  }
fi

SUMMARY=$(echo "$CLAUDE_OUTPUT" | head -c 1000 | LC_ALL=C sed "s/'/''/g")
sqlite3 "$DB_PATH" "
  UPDATE agent_runs
  SET status = '${HOOK_STATUS}',
      finished_at = '${FINISHED_AT}',
      output_summary = '${SUMMARY}'
  WHERE id = ${RUN_ID};
"

if [ "$HOOK_STATUS" = "success" ]; then
  SHEETS_ID="${GOOGLE_SHEETS_ID:-}"
  SHEETS_RESULT="（Sheetsはスキップ）"

  # エージェント別: per-agent Discord webhook override
  case "$AGENT_NAME" in
    outreach)
      if [ -n "${DISCORD_WEBHOOK_OUTREACH:-}" ]; then
        export DISCORD_WEBHOOK_URL="$DISCORD_WEBHOOK_OUTREACH"
      fi
      ;;
  esac

  # エージェント別: Sheets書き込みスクリプト
  case "$AGENT_NAME" in
    lead-search)
      AGENT_SHEETS_SCRIPT="$SCRIPT_DIR/write-to-sheets.py"
      ;;
    outreach)
      AGENT_SHEETS_SCRIPT="$SCRIPT_DIR/write-outreach-to-sheets.py"
      ;;
    *)
      AGENT_SHEETS_SCRIPT=""
      ;;
  esac

  if [ -n "${AGENT_SHEETS_SCRIPT:-}" ] && [ -n "$SHEETS_ID" ] && [ -f "$AGENT_SHEETS_SCRIPT" ]; then
    SHEETS_RESULT=$(python3 "$AGENT_SHEETS_SCRIPT" "$OUTPUT_FILE" "$SHEETS_ID" "$DB_PATH" 2>&1) || true
    echo "[run-agent] Sheets: $SHEETS_RESULT"
  fi

  # エージェント別: Discord通知メッセージ
  case "$AGENT_NAME" in
    lead-search)
      ITEM_COUNT=$(python3 -c "
import json, sys, re
raw = open('$OUTPUT_FILE').read()
try:
    data = json.loads(raw)
    result = data.get('result', '') if isinstance(data, dict) else ''
    match = re.search(r'\"leads_found\":\s*(\d+)', result)
    if match:
        print(match.group(1))
    else:
        leads = re.findall(r'\"company_name\"', result)
        print(len(leads))
except:
    print(0)
" 2>/dev/null || echo "0")
      DISCORD_TITLE="🐒 ${POKEMON_NAME} がリードをゲット!!"
      DISCORD_BODY="${ITEM_COUNT}社のリストをゲットしたよ!! 🎉\nRun #${RUN_ID}\n\nSheetsに書き込んだからチェックしてね👀\n${SHEETS_RESULT}"
      ;;
    outreach)
      OUTREACH_DETAIL=$(python3 -c "
import json, sys, re
raw = open('$OUTPUT_FILE').read()
try:
    data = json.loads(raw)
    if isinstance(data, list):
        result = '\n'.join(b.get('text','') for b in data if b.get('type')=='text')
    elif isinstance(data, dict):
        result = data.get('result', '')
    else:
        result = raw
    match = re.search(r'\{[\s\S]*\}', result)
    if not match:
        print('0件しか書けなかった…')
        sys.exit(0)
    outreach = json.loads(match.group())
    messages = outreach.get('messages', [])
    drafted = [m for m in messages if m.get('status') == 'drafted']
    skipped = [m for m in messages if m.get('status') == 'skipped']
    lines = []
    lines.append(f'🔥 下書き完了 {len(drafted)}件:')
    for m in drafted:
        lang = m.get('language','').upper()
        ch = m.get('channel','')
        name = m.get('recipient_name','') or ''
        first = name.split()[0] if name else '?'
        lines.append(f'  🌟 {m.get(\"company_name\",\"?\")} — {first}さんへ {ch.upper()} ({lang})')
    if skipped:
        lines.append(f'💨 スキップ {len(skipped)}件:')
        for m in skipped:
            reason = m.get('skip_reason','')
            lines.append(f'  • {m.get(\"company_name\",\"?\")} ({reason})')
    print('\n'.join(lines))
except Exception as e:
    print(f'0件 (parse error: {e})')
" 2>/dev/null || echo "0件しか書けなかった…")
      DISCORD_TITLE="🔥 ${POKEMON_NAME}が熱いメッセージを書いたよ！(Run #${RUN_ID})"
      DISCORD_BODY="しっぽの炎に全力こめて書いたよ🔥✨\n\n${OUTREACH_DETAIL}\n\nSheetsで確認してね👀\n${SHEETS_RESULT}"
      ;;
    *)
      DISCORD_TITLE="✅ ${POKEMON_NAME} タスク完了"
      DISCORD_BODY="タスク完了！\nRun #${RUN_ID}"
      ;;
  esac

  "$NOTIFY_SCRIPT" \
    --pokemon "$POKEMON_NAME" \
    --status "success" \
    --title "$DISCORD_TITLE" \
    --body "$DISCORD_BODY" 2>/dev/null || true

  echo "[run-agent] SUCCESS run #${RUN_ID}"
else
  DISCORD_BODY="うーん、品質チェックで引っかかっちゃった🙈\nRun #${RUN_ID}\n\n${HOOK_MSG:0:500}"
  "$NOTIFY_SCRIPT" \
    --pokemon "$POKEMON_NAME" \
    --status "hook_rejected" \
    --title "🙈 ${POKEMON_NAME} のデータがNGだった..." \
    --body "$DISCORD_BODY" 2>/dev/null || true

  echo "[run-agent] HOOK_REJECTED run #${RUN_ID}"
fi

echo "[run-agent] Output: $OUTPUT_FILE"
