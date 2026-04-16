#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 管理対象のplist一覧（label: srcファイル: スケジュール説明）
AGENTS=(
  "com.jva.pokemon-agent:com.jva.pokemon-agent.plist:毎日 09:00 (ヒコザル/lead-search)"
  "com.jva.arceus:com.jva.arceus.plist:毎日 09:30 (アルセウス/arceus)"
)

install_agent() {
  local label="$1"
  local src="$SCRIPT_DIR/$2"
  local schedule="$3"
  local dst="$HOME/Library/LaunchAgents/${label}.plist"

  if [ ! -f "$src" ]; then
    echo "[setup] SKIP: plist not found: $src"
    return
  fi

  if launchctl list | grep -q "$label" 2>/dev/null; then
    echo "[setup] Unloading existing job: $label"
    launchctl unload "$dst" 2>/dev/null || true
  fi

  cp "$src" "$dst"
  launchctl load "$dst"
  echo "[setup] Installed: $label ($schedule)"
}

uninstall_agent() {
  local label="$1"
  local dst="$HOME/Library/LaunchAgents/${label}.plist"

  launchctl unload "$dst" 2>/dev/null || true
  rm -f "$dst"
  echo "[setup] Uninstalled: $label"
}

status_agent() {
  local label="$1"
  local schedule="$3"

  if launchctl list | grep -q "$label" 2>/dev/null; then
    echo "[setup] LOADED  : $label ($schedule)"
    launchctl list "$label" 2>/dev/null || true
  else
    echo "[setup] NOT LOADED: $label ($schedule)"
  fi
}

case "${1:-install}" in
  install)
    for entry in "${AGENTS[@]}"; do
      IFS=':' read -r label src schedule <<< "$entry"
      install_agent "$label" "$src" "$schedule"
    done
    echo ""
    echo "[setup] All agents installed."
    echo "[setup] To test manually: launchctl start <label>"
    ;;

  uninstall)
    for entry in "${AGENTS[@]}"; do
      IFS=':' read -r label src schedule <<< "$entry"
      uninstall_agent "$label" "$src" "$schedule"
    done
    echo "[setup] All agents uninstalled."
    ;;

  status)
    for entry in "${AGENTS[@]}"; do
      IFS=':' read -r label src schedule <<< "$entry"
      status_agent "$label" "$src" "$schedule"
    done
    ;;

  *)
    echo "Usage: $0 [install|uninstall|status]"
    exit 1
    ;;
esac
