---
name: weekly_strategy
description: >
  Manus のWeekly Reportを貼り付けた後に呼ぶと、KDB反映→KPIギャップ分析→次アクション設計→必要リサーチの切り出し→
  日本語の週次戦略レポートと、Nahi共有用の英語スライド（Markdown）を生成する。
  /weekly_strategy と呼ばれたら即座に実行する。
triggers:
  - 今週のレポートだよ
  - 今週の週次レポート
  - 週次レポート来た
  - ウィークリーレポート来た
  - Manusの週次レポート
  - Weekly Report
  - weekly report
  - 週次戦略やって
  - 週次の戦略
---

# /weekly_strategy — 週次レポート起点の「戦略エージェント」

## 前提

- 入力: **Manus Weekly Report本文（貼り付け）**
- 数値DB（正）: `company_jva/kpi/db/weekly.md`（Manus更新 → ローカルKDBに反映）
- 目標: `company_jva/kpi/settings.md`
- スナップショット: `company_jva/kpi/current.md`

---

## 実行手順（この順で必ずやる）

### Step 1) レポートをKDBへ反映

貼り付け済みレポートを使って **`/weekly_kpi` を実行**し、以下が更新されることを確認する:

- `kpi/db/weekly.md`
- `kpi/db/monthly.md`
- `kpi/db/conversion.md`
- `kpi/current.md`
- `strategy/sessions/YYYY-MM-DD[-N].md`

更新後、`kpi/current.md` の「対象週」「更新日」「コンバージョン率」が最新かを確認する。

### Step 2) ギャップ分析（何が足りていないか）

`kpi/current.md` と `kpi/settings.md` を使い、以下を必ず言語化する:

- **不足しているKPI（最大2つ）**（例: Match / Application）
- **不足の理由（仮説）**（最大3つ、深掘りしすぎない）
- **今週動かすKPI（1つ）** を決める

### Step 3) 次アクションを設計（最大3つ）

制約:
- アクションは **今週実行可能**（担当と期限が書ける）
- 施策は「数字にどう効くか」を必ず1行で書く

### Step 4) リサーチ（必要な分だけ自動で切り出す）

アクション実行に追加情報が必要なら、**調査依頼**として切り出す。
例:
- 「アウトリーチ先スタートアップを増やす」→ ターゲット条件整理 + 候補リスト作成
- 「応募→面談→Matchを増やす」→ 企業側SLA/返信率の改善案、他社運用例の収集

出力は `strategy/insights/` に保存する前提で、調査の問い・期限・期待アウトプットを明確にする。

### Step 5) 週次成果物を生成（2つ）

#### (A) 日本語レポート（Sora用）

作成先:
- `company_jva/strategy/reports/YYYY-WXX.md`

フォーマット:
- `company_jva/strategy/reports/_template.md` に準拠
- 冒頭に「今週の結論（最大3アクション）」を置く

#### (B) 英語スライド（Sora + Nahi用）

作成先:
- `company_jva/strategy/slides/YYYY-WXX.md`

フォーマット:
- `company_jva/strategy/slides/_template.md` に準拠
- 「KPI Snapshot」「Funnel」「Focus KPI」「Strategy Options」「Decisions」「Research requests」を必ず入れる

---

## 重要ルール

1. まず **KDB反映（/weekly_kpi）**。反映前に議論しない
2. 施策は **最大3つ**に絞る（増やす場合は優先度を明記）
3. 深い原因分析はしない（必要なら別セッションで）
4. すべての出力はファイル保存して積み上げる（会話だけで終わらせない）

