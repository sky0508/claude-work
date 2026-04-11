# 自律改善ループ 実装プラン

最終更新: 2026-04-11 18:00

## 目的

ポケモン（エージェント）が、トレーナー（僕）のフィードバックをもとに自律改善してレベルアップしていく仕組みを構築する。

## 前提: 既に動いているもの

| レイヤー | 状態 | 備考 |
|---|---|---|
| サブエージェント定義 (.claude/agents/) | ✅ 稼働中 | lead-search（ヒコザル）, outreach（ヒトカゲ） |
| スキル定義 (.claude/skills/) | ✅ 稼働中 | lead-search, outreach |
| run-agent.sh（統括実行） | ✅ 稼働中 | 起動→記録→hook→Sheets→Discord |
| post-run-hook.sh（品質ゲート） | ✅ 稼働中 | lead-search, outreach 対応 |
| SQLite agent_runs | ✅ 稼働中 | 実行記録の書き込み・更新 |
| Google Sheets 連携 | ✅ 稼働中 | write-to-sheets.py, write-outreach-to-sheets.py |
| Discord 通知 | ✅ 稼働中 | エージェント別メッセージ |
| launchd スケジューラ | ✅ 稼働中 | lead-search 9:00, outreach 9:30 |

## 足りていない3つのループ

現在のシステムは「実行して記録する」だけ。**レベルアップに必要な3つのフィードバックループが未接続。**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ループA: トレーナー → ポケモン                              │
│   「トレーナーの声が次の実行に反映される」                     │
│                                                              │
│   ループB: ポケモン → 自己改善                                │
│   「過去の実行結果を見て、今回のアプローチを調整する」         │
│                                                              │
│   ループC: メタ監査（アルセウス）                              │
│   「全体を見渡して改善提案を出す」                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: フィードバックループ基盤（最重要）

### 1-1. コンテキストインジェクター
- **状態**: ✅ 実装完了 (2026-04-11)
- **場所**: `scripts/run-agent.sh`（FULL_PROMPT 組み立て前に追加）
- **概要**: ポケモン起動前に、過去の実行サマリー + トレーナーFBをSQLiteから取得し、プロンプトに注入する

実装済み:
- [x] SQLiteから直近5回の `agent_runs` (status, output_summary) を取得
- [x] SQLiteから直近3件の `dialogue_logs` (direction='trainer_to_agent') を取得
- [x] `--- 自律改善コンテキスト ---` ブロックでプロンプトに注入
- [x] コンテキストが空の場合（初回起動等）はスキップ

### 1-2. トレーナーフィードバック記録
- **状態**: ✅ 実装完了 (2026-04-11)
- **場所**: `scripts/trainer-feedback.sh`（新規作成）
- **使い方**: `./scripts/trainer-feedback.sh <agent-name> "フィードバック内容"`

実装済み:
- [x] dialogue_logs に INSERT（direction='trainer_to_agent'）
- [x] エージェント名バリデーション（存在しないエージェントはエラー）
- [x] 登録確認メッセージの表示（ポケモン名も表示）
- [x] `--list` オプションで過去のFB一覧表示

### 1-3. agent_costs 接続
- **状態**: ✅ 実装完了 (2026-04-11)
- **場所**: `scripts/run-agent.sh`（agent_runs UPDATE の直後に追加）

実装済み:
- [x] claude の JSON 出力から `usage.input_tokens`, `usage.output_tokens`, `total_cost_usd` を抽出
- [x] agent_costs に INSERT（run_id と紐付け）
- [x] ログ出力: `[run-agent] Costs: input=XX output=XX cost=$XX`

---

## Phase 2: 運用品質の改善

### 2-1. setup.sh の outreach 対応
- **状態**: 🟡 一部未対応
- **概要**: `scheduler/setup.sh` が outreach 用 plist を登録できない

やること:
- [ ] setup.sh を2つの plist に対応させる

### 2-2. エージェント定義とスキルの矛盾解消
- **状態**: 🟡 要整理
- **概要**: lead-search の contact URL ルール（エージェント定義では company 禁止、スキルでは許可）

やること:
- [ ] どちらを正とするか決定
- [ ] エージェント定義 or スキルを修正

### 2-3. docs/implementation-status.md の更新
- **状態**: 🟡 古い（2026-04-04時点）
- **概要**: outreach エージェント・4テーブル目(outreach_logs)・実稼働状況が反映されていない

やること:
- [ ] 現状に合わせて全面更新

---

## Phase 3: メタ監査（アルセウス）

Phase 1 が安定してから着手。全ポケモンの実行データが溜まっている前提。

### 3-1. アルセウスのエージェント定義・スキル
- **状態**: 🔴 未実装
- **場所**: `.claude/agents/arceus.md`, `.claude/skills/arceus.md`（新規）
- **概要**: 全ポケモンの agent_runs + dialogue_logs + agent_costs を読み、パフォーマンス分析・改善提案を生成

やること:
- [ ] エージェント定義作成（監査の原則、レポートフォーマット）
- [ ] スキル作成（SQLiteクエリ手順、分析観点、Discord通知フォーマット）
- [ ] run-agent.sh でのスケジューリング（3時間ごと or 1日1回）
- [ ] post-run-hook.sh にアルセウス用の品質チェック追加
- [ ] launchd plist 作成

---

## run-agent.sh v2 の全体フロー

```
run-agent.sh <agent-name> <pokemon-name>
│
├── ① PRE-RUN: コンテキスト収集 ← NEW
│   ├── agent_runs から直近5回の実行サマリー
│   ├── dialogue_logs からトレーナーの最新FB
│   └── 動的プロンプト組み立て
│
├── ② EXECUTE: ポケモン起動
│   └── claude -p (agent + skill + 動的コンテキスト)
│
├── ③ POST-RUN: 品質ゲート
│   └── post-run-hook.sh（既存）
│
├── ④ RECORD: 記録
│   ├── agent_runs 更新（既存）
│   ├── agent_costs 記録 ← NEW
│   └── output を db/runs/ に保存（既存）
│
├── ⑤ DELIVER: 配信
│   ├── Google Sheets（既存）
│   └── Discord 通知（既存）
│
└── ⑥ （将来）REFLECT: 自己振り返り
    └── 前回と今回の比較ログ
```

---

## 完了したら何が起きるか

Phase 1 完了時:
```
トレーナー: ./trainer-feedback.sh lead-search "SaaSに偏りすぎ。製造業も入れて"
    ↓ dialogue_logs に記録
翌朝 launchd がヒコザルを起動
    ↓ run-agent.sh がコンテキスト注入
ヒコザル: 「前回トレーナーから"製造業も入れて"とFBあり。今回は製造業を重点的に探す」
    ↓ リード品質が改善
```

Phase 3 完了時:
```
アルセウスが全員の実行ログを分析
    ↓ 「ヒコザルの confidence_score が先週比で上昇。ヒトカゲのoutreach返信率は低下傾向」
    ↓ Discord にレポート
トレーナーが確認 → 改善FB → ループが回る
```
