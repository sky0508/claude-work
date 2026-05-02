# 実装ステータス

最終更新: 2026-04-16

## 完了済み

### Phase 0: プロジェクト再構築
- [x] 旧エージェント定義を `_archive/` に移動
- [x] 新ディレクトリ構造作成（`.claude/agents/`, `.claude/skills/`, `scripts/`, `db/`, `scheduler/`）

### Phase 1: インフラ基盤
- [x] `scripts/init-db.sh` — SQLite初期化（4テーブル: agent_runs, agent_costs, dialogue_logs, outreach_logs）
- [x] `db/jva-agents.db` — データベース初期化済み・動作確認済み
- [x] `scripts/notify-discord.sh` — Discord Webhook通知スクリプト
- [x] `.env.example` — Webhook URL テンプレート
- [x] `.gitignore` — .env, db/*.db, db/*.log を除外
- [x] `scripts/run-agent.sh` — 統括実行スクリプト（SQLite記録→claude -p→Hook→Sheets→Discord通知）

### Phase 2: ポケモンエージェント
- [x] `.claude/agents/lead-search.md` — ヒコザル（リード検索）
- [x] `.claude/skills/lead-search.md` — リード検索スキル
- [x] `.claude/agents/outreach.md` — ヒトカゲ（アウトリーチ）
- [x] `.claude/skills/outreach.md` — アウトリーチスキル
- [x] `CLAUDE.md` — プロジェクト全体ルール

### Phase 3: Hook（品質ゲート）
- [x] `scripts/post-run-hook.sh` — JSON検証（lead-search, outreach, arceus対応）

### Phase 4: スケジューラ
- [x] `scheduler/com.jva.pokemon-agent.plist` — launchd（毎朝9:00 / ヒコザル）
- [x] `scheduler/com.jva.arceus.plist` — launchd（毎朝9:30 / アルセウス）
- [x] `scheduler/setup.sh` — マルチplist対応 install/uninstall/status

### Phase 5: 自律改善ループ基盤
- [x] `scripts/trainer-feedback.sh` — トレーナーFB記録（dialogue_logsへのINSERT）
- [x] `run-agent.sh` コンテキストインジェクター — 過去5回の実行履歴とトレーナーFBをプロンプト注入
- [x] `run-agent.sh` `error_max_turns` 検出ロジック — 最大ターン超過を failed として扱う
- [x] `--max-turns 30` に増加（20→30）

### Phase 6: アルセウス（メタ監査エージェント）
- [x] `.claude/agents/arceus.md` — アルセウス エージェント定義
- [x] `.claude/skills/arceus.md` — メタ監査スキル（SQLiteクエリ手順・分析観点・出力スキーマ）
- [x] `run-agent.sh` に arceus 用 Discord 通知追加
- [x] `post-run-hook.sh` に arceus passthrough 追加

---

## 稼働状況（2026-04-16 時点）

| ポケモン | 直近29回の成功率 | 主な原因 |
|---------|--------------|--------|
| ヒコザル（lead-search）| 約3% | error_max_turns（`--max-turns 20`超過）→ **30に修正済み** |
| ヒトカゲ（outreach）| — | — |
| アルセウス | 実装完了・未起動 | — |

---

## 現在の未対応事項

### launchdの有効化（手動作業が必要）
- `scheduler/setup.sh install` を実行して launchd に登録する
  - アルセウス（com.jva.arceus）は `setup.sh install` 後に自動登録される
- MacBookのスリープ防止: システム設定 > 省エネルギー > ディスプレイがオフのときにスリープさせない

### Discord Webhook
- `.env` ファイルがまだ作成されていない（`.env.example` をコピーして Webhook URL を設定する必要あり）

### dialogue_logs が0件
- `trainer-feedback.sh` は実装済みだが、まだ実際に使われていない
- トレーナーFBを記録してコンテキスト注入ループを検証する

---

## Future ロードマップ（アイデア・未着手）

### F1: 手動で `/in/` を足したら LinkedIn DM 送信（agent-browser MCP）

1. 営業リスト（例: Google Sheets `Leads`）に担当者の個人プロフィール URL（`/in/`）を追記
2. 別エージェントが未送信行に対して agent-browser MCP で DM 送信フローを実行

**検討メモ**: LinkedIn 利用規約・スパム判定・送信頻度上限への配慮が必須。送信前の人間承認を入れるかは未決。

### F2: 数時間おきにメッセージ状況を監視 → 返信・日程調整まで自動化

1. 定期実行で LinkedIn 受信トレイを取得
2. 返信が必要と判定したスレッドに下書き or 自動返信
3. Google Calendar 連携で日程調整まで自動化

**検討メモ**: F1より複雑度・リスクが高い。完全自動より下書き生成＋人間承認から始める方が現実的。

---

## ファイル一覧

```
jva-agents/
├── CLAUDE.md
├── .claude/
│   ├── agents/
│   │   ├── lead-search.md          # ヒコザル
│   │   ├── outreach.md             # ヒトカゲ
│   │   └── arceus.md               # アルセウス（NEW）
│   └── skills/
│       ├── lead-search.md
│       ├── outreach.md
│       └── arceus.md               # メタ監査スキル（NEW）
├── scripts/
│   ├── run-agent.sh                # 統括実行（max-turns=30, error_max_turns対応）
│   ├── post-run-hook.sh            # 品質ゲート（arceus passthrough追加）
│   ├── notify-discord.sh
│   ├── init-db.sh
│   ├── trainer-feedback.sh         # トレーナーFB記録
│   ├── linkedin-search.py
│   ├── write-to-sheets.py
│   └── write-outreach-to-sheets.py
├── db/
│   ├── jva-agents.db
│   └── runs/
├── scheduler/
│   ├── com.jva.pokemon-agent.plist # ヒコザル 9:00
│   ├── com.jva.arceus.plist        # アルセウス 9:30（NEW）
│   └── setup.sh                   # マルチplist対応（NEW）
├── docs/
│   ├── hearing-summary.md
│   ├── implementation-status.md
│   ├── self-improvement-plan.md
│   └── reference-article-pokemon-agents.md
├── .env.example
├── .gitignore
└── jva-ib-guide.md
```
