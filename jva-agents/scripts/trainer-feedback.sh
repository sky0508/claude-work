#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
DB_PATH="$PROJECT_DIR/db/jva-agents.db"

usage() {
  cat <<EOF
Usage:
  $0 <agent-name> "<feedback>"    # FBを記録
  $0 <agent-name> --list          # 過去のFBを一覧表示

Arguments:
  agent-name   エージェント名 (例: lead-search, outreach)
  feedback     トレーナーのフィードバックメッセージ

Examples:
  $0 lead-search "SaaSに偏りすぎ。製造業・物流・医療も入れて"
  $0 lead-search "confidence_score が 0.7 以上のみ採用して"
  $0 outreach "英語メッセージは300文字以内に収めて"
  $0 lead-search --list
EOF
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

AGENT_NAME="$1"
ACTION="$2"

AGENT_FILE="$PROJECT_DIR/.claude/agents/${AGENT_NAME}.md"
if [ ! -f "$AGENT_FILE" ]; then
  echo "ERROR: エージェントが見つかりません: ${AGENT_NAME}" >&2
  echo "利用可能なエージェント:" >&2
  ls "$PROJECT_DIR/.claude/agents/" | sed 's/\.md$/  /' >&2
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: データベースが見つかりません。先に scripts/init-db.sh を実行してください。" >&2
  exit 1
fi

# 直近のポケモン名を取得（表示用）
POKEMON_NAME=$(sqlite3 "$DB_PATH" "
  SELECT pokemon_name FROM agent_runs
  WHERE agent_name='${AGENT_NAME}'
  ORDER BY started_at DESC LIMIT 1;
" 2>/dev/null || echo "")

if [ "$ACTION" = "--list" ]; then
  echo "=== ${AGENT_NAME}$([ -n "$POKEMON_NAME" ] && echo " (${POKEMON_NAME})") へのトレーナーFB ==="
  RESULT=$(sqlite3 "$DB_PATH" "
    SELECT
      '#' || id || ' [' || datetime(created_at,'localtime') || '] ' || content
    FROM dialogue_logs
    WHERE agent_name='${AGENT_NAME}' AND direction='trainer_to_agent'
    ORDER BY created_at DESC
    LIMIT 20;
  " 2>/dev/null || true)
  if [ -z "$RESULT" ]; then
    echo "（まだFBはありません）"
  else
    echo "$RESULT"
  fi
  exit 0
fi

FEEDBACK="$ACTION"
if [ -z "$FEEDBACK" ]; then
  echo "ERROR: FBメッセージが空です。" >&2
  exit 1
fi

FEEDBACK_ESCAPED=$(echo "$FEEDBACK" | LC_ALL=C sed "s/'/''/g")
POKEMON_ESCAPED=$(echo "$POKEMON_NAME" | LC_ALL=C sed "s/'/''/g")

LOG_ID=$(sqlite3 "$DB_PATH" "
  INSERT INTO dialogue_logs (agent_name, pokemon_name, direction, content)
  VALUES ('${AGENT_NAME}', '${POKEMON_ESCAPED}', 'trainer_to_agent', '${FEEDBACK_ESCAPED}');
  SELECT last_insert_rowid();
")

echo "✅ FBを記録しました (id: ${LOG_ID})"
echo "   エージェント : ${AGENT_NAME}$([ -n "$POKEMON_NAME" ] && echo " (${POKEMON_NAME})")"
echo "   フィードバック: ${FEEDBACK}"
echo ""
echo "次回 ${AGENT_NAME} が起動したとき、このFBが自動的にプロンプトに反映されます。"
