#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_DIR="$SCRIPT_DIR/../db"
DB_PATH="$DB_DIR/jva-agents.db"

mkdir -p "$DB_DIR"

if [ -f "$DB_PATH" ]; then
  echo "[init-db] Database already exists at $DB_PATH"
  echo "[init-db] Use --force to recreate"
  if [ "${1:-}" != "--force" ]; then
    exit 0
  fi
  echo "[init-db] --force specified, recreating..."
  rm "$DB_PATH"
fi

sqlite3 "$DB_PATH" <<'SQL'
CREATE TABLE agent_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name TEXT NOT NULL,
  pokemon_name TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running','success','failed','hook_rejected')) DEFAULT 'running',
  output_summary TEXT,
  error_message TEXT
);

CREATE TABLE agent_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES agent_runs(id),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0.0
);

CREATE TABLE dialogue_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name TEXT,
  pokemon_name TEXT,
  direction TEXT NOT NULL CHECK(direction IN ('trainer_to_agent','agent_to_trainer')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE outreach_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER REFERENCES agent_runs(id),
  company_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient_name TEXT,
  linkedin_url TEXT,
  email TEXT,
  message_body TEXT,
  gmail_draft_id TEXT,
  status TEXT DEFAULT 'drafted' CHECK(status IN ('drafted','sent','skipped')),
  skip_reason TEXT,
  drafted_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_started ON agent_runs(started_at);
CREATE INDEX idx_dialogue_logs_agent ON dialogue_logs(agent_name);
CREATE INDEX idx_outreach_logs_company ON outreach_logs(company_name);
CREATE INDEX idx_outreach_logs_run ON outreach_logs(run_id);
SQL

echo "[init-db] Database initialized at $DB_PATH"
echo "[init-db] Tables: agent_runs, agent_costs, dialogue_logs, outreach_logs"
