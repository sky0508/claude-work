#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/../db/jva-agents.db"

usage() {
  echo "Usage: $0 <output-file> <agent-name>"
  echo "  Validates agent output. Exit 0 = pass, Exit 1 = rejected."
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

OUTPUT_FILE="$1"
AGENT_NAME="$2"

ERRORS=()

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "HOOK FAIL: Output file not found: $OUTPUT_FILE"
  exit 1
fi

if [ ! -s "$OUTPUT_FILE" ]; then
  echo "HOOK FAIL: Output file is empty"
  exit 1
fi

# Claude --output-format json wraps the result; extract the actual text content
EXTRACTED=$(python3 -c "
import json, sys

raw = open('$OUTPUT_FILE').read().strip()
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    print(raw)
    sys.exit(0)

# claude -p --output-format json returns [{type:'text', text:'...'}] or {result:'...'}
if isinstance(data, list):
    texts = [b.get('text','') for b in data if b.get('type') == 'text']
    print('\\n'.join(texts))
elif isinstance(data, dict) and 'result' in data:
    print(data['result'])
else:
    print(raw)
" 2>/dev/null || cat "$OUTPUT_FILE")

validate_lead_search() {
  python3 <<PYEOF
import json, sys

raw = '''$EXTRACTED'''

# Find JSON in the output (might be wrapped in markdown code blocks)
import re
json_match = re.search(r'\{[\s\S]*\}', raw)
if not json_match:
    print("HOOK FAIL: No JSON object found in output")
    sys.exit(1)

try:
    data = json.loads(json_match.group(), strict=False)
except json.JSONDecodeError as e:
    print(f"HOOK FAIL: Invalid JSON: {e}")
    sys.exit(1)

errors = []

if "leads" not in data:
    errors.append("Missing 'leads' array")

leads = data.get("leads", [])
if not isinstance(leads, list):
    errors.append("'leads' is not an array")
    leads = []

if len(leads) > 5:
    errors.append(f"Too many leads: {len(leads)} (max 5)")

required_fields = ["company_name", "url", "industry", "stage"]
for i, lead in enumerate(leads):
    for field in required_fields:
        if not lead.get(field):
            errors.append(f"Lead [{i}]: missing required field '{field}'")

    url = lead.get("url", "")
    if url and not url.startswith("http"):
        errors.append(f"Lead [{i}]: invalid URL '{url}'")

    why = lead.get("why_target", "")
    if not why or len(why) < 10:
        errors.append(f"Lead [{i}]: 'why_target' too short or missing")

    conf = lead.get("confidence", "")
    if conf not in ("high", "medium", "low"):
        errors.append(f"Lead [{i}]: invalid confidence '{conf}'")


if errors:
    print("HOOK FAIL:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print(f"HOOK PASS: {len(leads)} leads validated")
sys.exit(0)
PYEOF
}

validate_outreach() {
  python3 - "$OUTPUT_FILE" <<'PYEOF'
import json, sys, re

output_file = sys.argv[1]
with open(output_file) as f:
    raw_file = f.read()

# claude -p --output-format json ラッパーからテキストを抽出
try:
    outer = json.loads(raw_file)
    if isinstance(outer, list):
        text = '\n'.join(b.get('text', '') for b in outer if b.get('type') == 'text')
    elif isinstance(outer, dict) and 'result' in outer:
        text = outer['result']
    else:
        text = raw_file
except json.JSONDecodeError:
    text = raw_file

json_match = re.search(r'\{[\s\S]*\}', text)
if not json_match:
    print("HOOK FAIL: No JSON object found in output")
    sys.exit(1)

try:
    data = json.loads(json_match.group(), strict=False)
except json.JSONDecodeError as e:
    print(f"HOOK FAIL: Invalid JSON: {e}")
    sys.exit(1)

errors = []

if "messages" not in data:
    errors.append("Missing 'messages' array")

messages = data.get("messages", [])
if not isinstance(messages, list):
    errors.append("'messages' is not an array")
    messages = []

drafted = [m for m in messages if m.get("status") == "drafted"]

for i, msg in enumerate(drafted):
    if not msg.get("company_name"):
        errors.append(f"Message [{i}]: missing 'company_name'")
    if not msg.get("channel"):
        errors.append(f"Message [{i}]: missing 'channel'")
    body = msg.get("message_body", "")
    if not body or len(body) < 50:
        errors.append(f"Message [{i}]: 'message_body' too short or missing (min 50 chars)")
    if body and re.search(r'\[.+?\]', body):
        errors.append(f"Message [{i}]: unfilled placeholder found in message_body")
    if msg.get("channel") == "linkedin" and body and len(body) > 300:
        errors.append(f"Message [{i}]: LinkedIn message exceeds 300 chars ({len(body)} chars)")

if errors:
    print("HOOK FAIL:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print(f"HOOK PASS: {len(drafted)} messages validated ({len(messages) - len(drafted)} skipped)")
sys.exit(0)
PYEOF
}

case "$AGENT_NAME" in
  lead-search)
    validate_lead_search
    ;;
  outreach)
    validate_outreach
    ;;
  *)
    echo "HOOK PASS: No specific validation for agent '$AGENT_NAME' (passthrough)"
    exit 0
    ;;
esac
