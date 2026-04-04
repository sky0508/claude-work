#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "[notify-discord] ERROR: DISCORD_WEBHOOK_URL not set" >&2
  echo "[notify-discord] Set it in $ENV_FILE or as environment variable" >&2
  exit 1
fi

usage() {
  echo "Usage: $0 --pokemon <name> --status <success|failed|hook_rejected|info> --title <title> --body <body>"
  exit 1
}

POKEMON_NAME=""
STATUS=""
TITLE=""
BODY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pokemon)  POKEMON_NAME="$2"; shift 2 ;;
    --status)   STATUS="$2"; shift 2 ;;
    --title)    TITLE="$2"; shift 2 ;;
    --body)     BODY="$2"; shift 2 ;;
    *)          usage ;;
  esac
done

if [ -z "$POKEMON_NAME" ] || [ -z "$STATUS" ] || [ -z "$TITLE" ]; then
  usage
fi

case "$STATUS" in
  success)       COLOR=3066993  ;; # green
  failed)        COLOR=15158332 ;; # red
  hook_rejected) COLOR=16776960 ;; # yellow
  info)          COLOR=3447003  ;; # blue
  *)             COLOR=10070709 ;; # gray
esac

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

BODY_ESCAPED=$(echo "$BODY" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
TITLE_ESCAPED=$(echo "$TITLE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": ${TITLE_ESCAPED},
    "description": ${BODY_ESCAPED},
    "color": ${COLOR},
    "footer": { "text": "${POKEMON_NAME} | ${STATUS}" },
    "timestamp": "${TIMESTAMP}"
  }]
}
EOF
)

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "[notify-discord] Sent (${STATUS}): ${TITLE}"
else
  echo "[notify-discord] ERROR: HTTP ${HTTP_CODE}" >&2
  exit 1
fi
