#!/bin/bash
# JVA Webhook Server 起動スクリプト

set -e
cd "$(dirname "$0")"

# ── サーバー起動 ──────────────────────────────
echo "🚀 Webhook サーバーを起動中..."
python3 server.py &
SERVER_PID=$!
sleep 1

# ── ngrok トンネル ────────────────────────────
if command -v ngrok &>/dev/null; then
    ngrok http 8765 --log=stdout > /tmp/jva_ngrok.log 2>&1 &
    NGROK_PID=$!
    sleep 3

    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels \
        | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null)

    TOKEN=$(python3 -c "import json; print(json.load(open('config.json'))['token'])")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ JVA Webhook 起動完了"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Endpoint:"
    echo "  ${NGROK_URL}/webhook/weekly-report"
    echo ""
    echo "  Authorization Header:"
    echo "  Bearer ${TOKEN}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Manus の設定にこの2つを渡してください"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "停止: Ctrl+C"

    trap "kill $SERVER_PID $NGROK_PID 2>/dev/null; echo '停止しました。'" INT
    wait $SERVER_PID
else
    TOKEN=$(python3 -c "import json; print(json.load(open('config.json'))['token'])")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ⚠️  ngrok が見つかりません"
    echo "  ローカルのみで起動: http://localhost:8765"
    echo ""
    echo "  Token: ${TOKEN}"
    echo ""
    echo "  ngrok インストール:"
    echo "  brew install ngrok"
    echo "  ngrok config add-authtoken <your-token>"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    trap "kill $SERVER_PID 2>/dev/null; echo '停止しました。'" INT
    wait $SERVER_PID
fi
