#!/bin/bash
# JVA KPI 管理スクリプト
# Claude なしでもスプレッドシートへの書き込み・確認が可能
#
# Usage:
#   ./kpi.sh status              目標値と実績を表示
#   ./kpi.sh record              今週の実績をインタラクティブに記録
#   ./kpi.sh record-raw <week> <line> <app> <match> <jobcard> [reach_li] [reach_mail] [mtg]
#   ./kpi.sh update <sheet> <row> <col> <value>   セル直接修正
#   ./kpi.sh strategy            目標 vs 実績でPDCA分析
#   ./kpi.sh refresh-settings    Settingsを再取得して kpi-settings.md を更新

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/../config/sheets.json"
FLOW_LOG="$SCRIPT_DIR/weekly-flow-log.md"
CURRENT="$SCRIPT_DIR/current.md"
SETTINGS_MD="$SCRIPT_DIR/../config/kpi-settings.md"

# config/sheets.json から URL と TOKEN を読む
KPI_URL=$(jq -r '.sheets.kpi.url' "$CONFIG")
TOKEN=$(jq -r '.token' "$CONFIG")

# ----------------------------------------
# 内部関数: POST → 302 リダイレクト先を GET
# ----------------------------------------
post_kpi() {
  local data="$1"
  local loc
  loc=$(curl -s -X POST "$KPI_URL" \
    -H "Content-Type: application/json" \
    -d "$data" \
    -w "%{redirect_url}" -o /dev/null)
  curl -sL "$loc"
}

# ----------------------------------------
# コマンド分岐
# ----------------------------------------
case "$1" in

  # ------ status: 目標値 + 直近実績を表示 ------
  status)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  JVA KPI ステータス"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "【目標値 (Settings)】"
    curl -sL "${KPI_URL}?token=${TOKEN}" \
      | grep -E "^(KPI|Job Card|LINE|Application|Match)" \
      | column -t -s ","
    echo ""
    echo "【直近実績 (weekly-flow-log.md)】"
    # 最後の5行（ヘッダー除く）
    tail -n 6 "$FLOW_LOG" | head -n 5
    echo ""
    echo "【current.md スナップショット】"
    grep -v "^#\|^>\|^---\|^$" "$CURRENT" | head -20
    ;;

  # ------ record: インタラクティブ入力 → スプレッドシート書き込み ------
  record)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  JVA Weekly KPI 記録"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    WEEK_DEFAULT=$(date +%Y-W%V)
    read -r -p "週（例: ${WEEK_DEFAULT}）: " WEEK
    WEEK="${WEEK:-$WEEK_DEFAULT}"

    read -r -p "LINE新規登録数: " LINE_ADD
    read -r -p "アプリケーション数（フォーム送信）: " APP
    read -r -p "マッチング数: " MATCH
    read -r -p "Job Card 作成数: " JOBCARD
    read -r -p "Reachout (LinkedIn): " REACH_LI
    read -r -p "Reachout (Mail): " REACH_MAIL
    read -r -p "MTG 数: " MTG

    LINE_ADD="${LINE_ADD:-0}"
    APP="${APP:-0}"
    MATCH="${MATCH:-0}"
    JOBCARD="${JOBCARD:-0}"
    REACH_LI="${REACH_LI:-0}"
    REACH_MAIL="${REACH_MAIL:-0}"
    MTG="${MTG:-0}"

    echo ""
    echo "以下をスプレッドシートに記録します:"
    echo "  週: $WEEK | LINE: $LINE_ADD | App: $APP | Match: $MATCH | JobCard: $JOBCARD"
    echo "  Reachout(LI): $REACH_LI | Reachout(Mail): $REACH_MAIL | MTG: $MTG"
    read -r -p "送信しますか？ [y/N]: " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
      echo "キャンセルしました。"
      exit 0
    fi

    DATA=$(cat <<EOF
{
  "action": "appendRow",
  "sheet": "01_Weekly_Flow_Log",
  "row": ["$WEEK", $LINE_ADD, $APP, $MATCH, $JOBCARD, $REACH_LI, $REACH_MAIL, $MTG],
  "token": "$TOKEN"
}
EOF
)
    RESULT=$(post_kpi "$DATA")
    echo "API レスポンス: $RESULT"

    if echo "$RESULT" | grep -q '"ok":true'; then
      # weekly-flow-log.md にも追記
      echo "| $WEEK | $LINE_ADD | $APP | $MATCH | $JOBCARD | $REACH_LI | $REACH_MAIL | $MTG |" >> "$FLOW_LOG"
      echo "✅ スプレッドシートおよび weekly-flow-log.md に記録しました"
    else
      echo "❌ 書き込み失敗。スプレッドシートのカラム順を確認してください（COLUMN_MAP.md 参照）"
    fi
    ;;

  # ------ record-raw: 引数直接渡し（スクリプトや自動化用）------
  record-raw)
    WEEK="${2:?'week が必要です（例: 2026-W11）'}"
    LINE_ADD="${3:-0}"
    APP="${4:-0}"
    MATCH="${5:-0}"
    JOBCARD="${6:-0}"
    REACH_LI="${7:-0}"
    REACH_MAIL="${8:-0}"
    MTG="${9:-0}"

    DATA=$(cat <<EOF
{
  "action": "appendRow",
  "sheet": "01_Weekly_Flow_Log",
  "row": ["$WEEK", $LINE_ADD, $APP, $MATCH, $JOBCARD, $REACH_LI, $REACH_MAIL, $MTG],
  "token": "$TOKEN"
}
EOF
)
    RESULT=$(post_kpi "$DATA")
    echo "$RESULT"

    if echo "$RESULT" | grep -q '"ok":true'; then
      echo "| $WEEK | $LINE_ADD | $APP | $MATCH | $JOBCARD | $REACH_LI | $REACH_MAIL | $MTG |" >> "$FLOW_LOG"
      echo "✅ 記録完了: $WEEK"
    fi
    ;;

  # ------ update: 特定セルを直接修正 ------
  update)
    SHEET="${2:?'sheet が必要です'}"
    ROW="${3:?'row（数値）が必要です'}"
    COL="${4:?'col（数値）が必要です'}"
    VALUE="${5:?'value が必要です'}"

    DATA="{\"action\":\"updateCell\",\"sheet\":\"$SHEET\",\"row\":$ROW,\"col\":$COL,\"value\":\"$VALUE\",\"token\":\"$TOKEN\"}"
    RESULT=$(post_kpi "$DATA")
    echo "$RESULT"
    ;;

  # ------ strategy: 目標 vs 実績 ギャップ分析 ------
  strategy)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  JVA KPI — 目標 vs 実績 分析"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "【月次目標】"
    curl -sL "${KPI_URL}?token=${TOKEN}" \
      | grep -E "^(KPI|Job Card|LINE|Application|Match)" \
      | awk -F',' '{printf "  %-30s 月次: %-8s 週次: %-8s 6M: %s\n", $1, $2, $3, $4}'
    echo ""
    echo "【直近4週の実績】"
    tail -n 5 "$FLOW_LOG"
    echo ""
    echo "【PDCA 分析用テンプレート → strategy.md を開いて記入】"
    echo "  cat $SCRIPT_DIR/strategy.md"
    ;;

  # ------ refresh-settings: Settingsを再取得 ------
  refresh-settings)
    echo "Settings を取得中..."
    SETTINGS=$(curl -sL "${KPI_URL}?token=${TOKEN}")
    DATE=$(date +%Y-%m-%d)

    # current.md の最終更新日を書き換え
    sed -i '' "s/| 取得日 | .* |/| 取得日 | $DATE |/" "$CURRENT" 2>/dev/null || true

    echo "$SETTINGS"
    echo "✅ 取得完了。上記を config/kpi-settings.md の目標値セクションに転記してください。"
    ;;

  # ------ ヘルプ ------
  *)
    echo "Usage: ./kpi.sh <command>"
    echo ""
    echo "Commands:"
    echo "  status                                              目標値と直近実績を表示"
    echo "  record                                              インタラクティブに今週の実績を記録"
    echo "  record-raw <week> <line> <app> <match> <jobcard>   引数直接渡しで記録（自動化用）"
    echo "             [reach_li] [reach_mail] [mtg]"
    echo "  update <sheet> <row> <col> <value>                 セル直接修正"
    echo "  strategy                                            目標 vs 実績のギャップ分析"
    echo "  refresh-settings                                    Settingsを再取得"
    echo ""
    echo "Examples:"
    echo "  ./kpi.sh status"
    echo "  ./kpi.sh record"
    echo "  ./kpi.sh record-raw 2026-W11 5 3 1 2 4 2 3"
    echo "  ./kpi.sh update WeeklyKPI 2 1 2026-W11"
    ;;
esac
