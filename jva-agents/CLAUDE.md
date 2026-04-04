# JVA Pokemon Agent System

## JVAについて
- **ミッション**: 日本トップ大学のグローバル学生と成長するスタートアップをつなぐ
- **VP（企業向け）**: コスト効率の高いグローバル人材へのアクセス（採用コストゼロ・トライアル形式）
- **運営体制**: 小規模・スピード重視

## このプロジェクトの仕組み
ポケモンエージェントによる自動運転システム。各エージェントにポケモンの名前をつけ、24時間自律稼働させる。

### アーキテクチャ（6レイヤー）
1. **サブエージェント** (`.claude/agents/`) — 各ポケモンの性格・原理原則・制約
2. **スキル** (`.claude/skills/`) — 具体的な手順書（技）
3. **Hook** (`scripts/post-run-hook.sh`) — 品質ゲート。NG出力を物理的にブロック
4. **SQLite** (`db/jva-agents.db`) — 実行ログ・コスト・対話ログ
5. **run-agent.sh** (`scripts/run-agent.sh`) — 統括実行スクリプト
6. **スケジューラ** (`scheduler/`) — launchdで自動起動

### SQLiteテーブル
- `agent_runs` — 実行記録（agent_name, pokemon_name, status, output_summary）
- `agent_costs` — トークン・コスト追跡
- `dialogue_logs` — トレーナーとエージェントの対話ログ（自律改善の種）

エージェントはSQLiteを読み取れる。過去の実行履歴を参照して重複排除や自己改善に活用すること。

## ポケモン一覧

| ポケモン名 | エージェント名 | 役割 | 頻度 |
|---|---|---|---|
| ヒコザル | lead-search | ターゲット企業検索・リード生成 | 毎朝1回 |

## 基本ルール
1. 出力は構造化データ（JSON）を基本とする
2. 品質ゲート（Hook）を通過しない出力はDB投入しない
3. 日本語で応答する
4. ブランドルール: 企業向けは英語・プロフェッショナル、学生向けは日本語・フレンドリー

## ドキュメント
- `docs/hearing-summary.md` — ヒアリング内容（ターゲット条件、運用方針、制約等）
- `docs/implementation-status.md` — 実装ステータスと未完了事項
- `docs/reference-article-pokemon-agents.md` — Tom氏の参照記事（ポケモンエージェントの元ネタ）

## ファイル構成
```
jva-agents/
  CLAUDE.md              ← このファイル
  .claude/
    agents/              ← エージェント定義（ポケモンの性格）
    skills/              ← スキル定義（ポケモンの技）
  scripts/
    run-agent.sh         ← 統括実行
    post-run-hook.sh     ← 品質ゲート
    notify-discord.sh    ← Discord通知
    init-db.sh           ← DB初期化
  db/
    jva-agents.db        ← SQLite
  docs/                  ← ドキュメント（ヒアリング、ステータス、参照記事）
  scheduler/             ← launchd plist
```
