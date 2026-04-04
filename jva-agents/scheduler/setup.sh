#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_SRC="$SCRIPT_DIR/com.jva.pokemon-agent.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.jva.pokemon-agent.plist"
LABEL="com.jva.pokemon-agent"

case "${1:-install}" in
  install)
    if launchctl list | grep -q "$LABEL" 2>/dev/null; then
      echo "[setup] Unloading existing job..."
      launchctl unload "$PLIST_DST" 2>/dev/null || true
    fi

    cp "$PLIST_SRC" "$PLIST_DST"
    launchctl load "$PLIST_DST"
    echo "[setup] Installed and loaded: $LABEL"
    echo "[setup] Schedule: every day at 09:00"
    echo "[setup] To test now: launchctl start $LABEL"
    ;;

  uninstall)
    launchctl unload "$PLIST_DST" 2>/dev/null || true
    rm -f "$PLIST_DST"
    echo "[setup] Uninstalled: $LABEL"
    ;;

  status)
    if launchctl list | grep -q "$LABEL" 2>/dev/null; then
      echo "[setup] $LABEL is loaded"
      launchctl list "$LABEL" 2>/dev/null || true
    else
      echo "[setup] $LABEL is NOT loaded"
    fi
    ;;

  *)
    echo "Usage: $0 [install|uninstall|status]"
    exit 1
    ;;
esac
