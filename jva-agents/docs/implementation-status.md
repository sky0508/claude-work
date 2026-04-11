# 実装ステータス

最終更新: 2026-04-11

## 完了済み

### Phase 0: プロジェクト再構築
- [x] 旧エージェント定義を `_archive/` に移動（注: ディレクトリが消えている可能性あり）
- [x] 新ディレクトリ構造作成（`.claude/agents/`, `.claude/skills/`, `scripts/`, `db/`, `scheduler/`）

### Phase 1: インフラ基盤
- [x] `scripts/init-db.sh` — SQLite初期化スクリプト（3テーブル: agent_runs, agent_costs, dialogue_logs）
- [x] `db/jva-agents.db` — データベース初期化済み・動作確認済み
- [x] `scripts/notify-discord.sh` — Discord Webhook通知スクリプト（成功=緑、失敗=赤、警告=黄）
- [x] `.env.example` — Webhook URL テンプレート
- [x] `.gitignore` — .env, db/*.db, db/*.log を除外
- [x] `scripts/run-agent.sh` — 統括実行スクリプト（SQLite記録→claude -p→Hook→Discord通知）

### Phase 2: 第1号ポケモンエージェント
- [x] `.claude/agents/lead-search.md` — リード検索エージェント定義（ポケモン名は未命名）
- [x] `.claude/skills/lead-search.md` — リード検索スキル（ターゲット条件、検索手順、出力品質基準）
- [x] `CLAUDE.md` — プロジェクト全体ルール再設計

### Phase 3: Hook（品質ゲート）
- [x] `scripts/post-run-hook.sh` — JSON検証・必須フィールド・重複チェック
- [x] テスト済み: 有効データ→PASS、無効データ→FAIL（具体的エラーメッセージ）

### Phase 4: スケジューラ
- [x] `scheduler/com.jva.pokemon-agent.plist` — launchd定義（毎朝9:00）
- [x] `scheduler/setup.sh` — install/uninstall/status コマンド
- [x] plist構文検証: plutil -lint OK

## 未完了・要対応

### Phase 5: 動作テスト — `claude -p` がハングする問題

**問題**: `run-agent.sh` から `claude -p` を実行すると、出力なし（0バイト）のまま8分以上ハングした。単体テスト（`claude -p "say hello"  --output-format json`）も同様にハングした。

**原因の仮説**:
1. Cursorの中から `claude -p` を呼ぶと競合する可能性
2. `--output-format json` フラグとの相性
3. `--max-turns` フラグが想定通り動作しない可能性
4. Proプランのレート制限

**次のアクション**:
- ターミナルから直接 `claude -p "hello" --output-format text` を実行して切り分け
- `--output-format json` を外してテスト
- `--max-turns` を外してテスト
- 動けば `run-agent.sh` を修正

### 未設定: Discord Webhook
- `.env` ファイルがまだ作成されていない（`.env.example` をコピーして Webhook URL を設定する必要あり）

### 未設定: ポケモン名
- ユーザーがポケモン名を決めたら以下を更新:
  - `scheduler/com.jva.pokemon-agent.plist` の ProgramArguments
  - `CLAUDE.md` のポケモン一覧テーブル
  - `.claude/agents/lead-search.md` のファイル名はそのまま（run-agent.sh引数で名前を渡す設計）

### 未設定: launchdの有効化
- `scheduler/setup.sh install` を実行して launchd に登録する
- MacBookのスリープ防止: システム設定 > 省エネルギー > ディスプレイがオフのときにスリープさせない

### Phase 6（新規）: 営業リスト拡張 — 要実装

**背景（2026-04-11 ヒアリング）**: 担当者の個人 LinkedIn（`/in/`）はリスト作成時には求めない。代わりに **会社の LinkedIn（`/company/`）** を主キーにし、**件数を増やす**。コスト最適化の主眼は **Claude Code（LLM）トークン**。

| 項目 | 内容 |
|------|------|
| 1回の実行 | **約20件** |
| 週次目安 | **約100件**（例: 平日デイリー5回 × 20、または週5回 × 20 の調整） |
| 必須フィールド | **会社名**、**会社 LinkedIn URL**（`linkedin.com/company/...`） |
| 任意フィールド | **メール**（分かれば） |
| ターゲット条件 | 既存の「スタートアップ向け」条件は維持。**シリーズ段階は問わない**（アーリーでも可） |
| ソース | **Web検索** と **LinkedIn** をメイン |
| 品質 | **件数優先**。多少のノイズは許容 |

**実装で触る想定箇所**（チェックリスト用）:

- [ ] `.claude/agents/lead-search.md` — 出力スキーマ（`contact.linkedin` を会社URL許容、個人URL必須の記述を削除）
- [ ] `.claude/skills/lead-search.md` — 検索手順（会社ページ中心、件数目標20、週100の運用説明）
- [ ] `scripts/post-run-hook.sh` — 必須フィールド・重複キー（会社LinkedIn URL 等）の検証更新
- [ ] `scripts/run-agent.sh` / スケジューラ — 週100件に合わせた実行頻度（要決定）
- [ ] `scripts/linkedin-search.py` 等 — API/Web検索のバッチサイズ・クォータ確認
- [ ] トークン節約 — 可能なら **検索・正規化をスクリプト側**に寄せ、エージェントは集約・整形のみにする案を検討

---

## Future ロードマップ（アイデア・未着手）

ここに書いた項目は **仕様未確定・未実装**。後から優先度を付けて Phase に落とす。

### F1: 手動で `/in/` を足したら LinkedIn DM 送信（agent-browser MCP）

**流れ（想定）**

1. 営業リスト（例: Google Sheets `Leads`）に、トレーナーが **担当者の個人プロフィール URL**（`linkedin.com/in/...`）を列で追記する。
2. 別エージェント（既存 outreach の拡張または新ポケモン）が Sheets を読み、未送信行に対して **agent-browser MCP** でプロフィールを開き、メッセージ送信フローを実行する。

**検討メモ**

- LinkedIn 利用規約・スパム判定・送信頻度上限への配慮が必須。
- 送信前の人間承認（1行ごと / バッチ承認）を入れるかは未決。
- Sheets の列定義（どの列が「DM本文」、どれが「送信済みフラグ」か）を先に固める必要あり。

### F2: 数時間おきにメッセージ状況を監視 → 返信・日程調整まで自動化

**流れ（イメージ）**

1. **定期実行**（数時間ごとなど）で LinkedIn の受信トレイ／会話一覧を **ブラウザ MCP または API** で取得する。
2. 「返信が必要」と判定したスレッドに対し、下書きまたは自動送信で返信する。
3. **カレンダー連携**（Google Calendar 等）まで含め、日程調整のやり取りを自動化する。

**検討メモ**

- F1 より複雑度・リスクが高い（誤送信、トーン、相手の意図誤認識）。
- 完全自動より **下書き生成＋人間承認** から始める方が現実的、という段階設計が妥当になりやすい。
- 実行間隔・1日あたりの自動アクション上限はポリシーとして別途定義が必要。

---

## ファイル一覧

```
jva-agents/
├── CLAUDE.md                          # プロジェクト全体ルール
├── .claude/
│   ├── agents/
│   │   └── lead-search.md             # リード検索エージェント定義
│   └── skills/
│       └── lead-search.md             # リード検索スキル
├── scripts/
│   ├── run-agent.sh                   # 統括実行スクリプト
│   ├── post-run-hook.sh               # 品質ゲート
│   ├── notify-discord.sh              # Discord通知
│   └── init-db.sh                     # DB初期化
├── db/
│   ├── jva-agents.db                  # SQLite（初期化済み）
│   └── runs/                          # エージェント出力ファイル置き場
├── scheduler/
│   ├── com.jva.pokemon-agent.plist    # launchd定義
│   └── setup.sh                       # install/uninstall
├── docs/
│   ├── hearing-summary.md             # ヒアリング内容まとめ
│   ├── implementation-status.md       # このファイル
│   └── reference-article-pokemon-agents.md  # Tom氏の参照記事
├── .env.example                       # Discord Webhook URLテンプレート
├── .gitignore
└── jva-ib-guide.md
```
