---
name: weekly_kpi
description: >
  Manus AI の週次レポートを受け取り、ローカルKDBを更新して戦略アクションアイテムを生成する。
  /weekly_kpi と呼ばれたら即座に実行する。
  レポートがペーストされた状態で呼び出すこと。
---

# /weekly_kpi — 週次KDB更新 & PDCA生成

## 概要

Manus AI の週次レポートを受け取り、以下を全自動で実行する:

1. `kpi/db/weekly.md` に週次データを追記
2. `kpi/db/monthly.md` の当月集計を更新
3. `kpi/db/conversion.md` の転換率を再計算
4. `kpi/current.md` のスナップショットを更新
5. `strategy/sessions/YYYY-MM-DD[-N].md` にPDCAセッションを生成
6. ブリーフィングを表示

**スプレッドシートへの同期は行わない**（Manus AI が担当）。

---

## KDBパス

```
BASE = /Users/sorasasaki/claude-workspace/company_jva
DB_WEEKLY   = {BASE}/kpi/db/weekly.md
DB_MONTHLY  = {BASE}/kpi/db/monthly.md
DB_CONV     = {BASE}/kpi/db/conversion.md
SETTINGS    = {BASE}/kpi/settings.md
CURRENT     = {BASE}/kpi/current.md
STRATEGY    = {BASE}/strategy/sessions/
```

---

## Step 1: レポートのパース

以下の値を抽出する:

| 項目 | Manus レポートの場所 |
|------|-------------------|
| 対象週（開始〜終了日） | タイトル・Date行 |
| LINE新規追加数 | Weekly Growth Summary |
| LINE累計（週末時点） | LINE Official Account Insights の最終行 |
| Application数（新規） | Weekly Growth Summary |
| Match数 | Weekly Growth Summary |
| 新規学生詳細 | Student Applications Detail |
| 新規企業詳細 | Company Applications Detail |

ISO週番号: 対象週の**終了日**が含まれる月曜起点の週（例: 03/09-03/15 → 2026-W11）

---

## Step 2: db/weekly.md の更新

**読み込み** → 最終行を確認:
- 対象週の行がない → 末尾に追記
- 対象週の行が `—` のみ → 実績値で更新
- 対象週の行に既に実績値がある → **更新しない**（ログに記録のみ）

追記フォーマット:
```
| {WEEK} | {LINE_ADD} | {LINE_TOTAL} | {APP} | {MATCH} | — | — | — | — |
```

**週の境界処理**: Manus レポートが ISO 週をまたぐ場合:
- 発生日ベースで正しい週に割り当てる
- 学生応募の日付は Student Applications Detail から取得

---

## Step 3: db/monthly.md の更新

当月の行を更新（または追記）:

1. `db/weekly.md` から当月の全週データを集計
2. `db/monthly.md` の当月行を更新
3. 達成率 = 実績 ÷ 月次目標 × 100（`settings.md` から目標値を参照）

月の帰属: **週の開始日（月曜）が属する月**で集計。

---

## Step 4: db/conversion.md の更新

累計値から再計算:
```
LINE→App率 = Application累計 ÷ LINE累計 × 100
App→Match率 = Match累計 ÷ Application累計 × 100
```

週次推移テーブルに新行を追加（または更新）。
ボトルネックセクションも最新値に更新。

---

## Step 5: current.md の更新

以下のセクションを最新値に書き換え:
- 最終更新（日付・対象週・ソース）
- 実績サマリーテーブル（累計・直近週・達成率）
- コンバージョン率テーブル（前週比付き）
- 月次トレンドテーブル（当月行を更新）

---

## Step 6: strategy session の生成

`strategy/sessions/YYYY-MM-DD.md` を確認:
- **当日ファイルがない** → 新規作成
- **当日ファイルがある** → 末尾に `## W{N} アップデート` セクションを追記
- **同日2回目** → `YYYY-MM-DD-2.md` を新規作成

### セッション構成（新規作成時）

```markdown
---
date: "YYYY-MM-DD"
week: "2026-W{N}"
source: "Manus AI Weekly Report"
---

# ストラテジーセッション: YYYY-MM-DD（W{N}）

## ① KPI確認

### ギャップ分析
| KPI | 月次目標 | 今月実績 | 達成率 | ギャップ |

### 週次トレンド（直近4週）
（db/weekly.md の直近4行を引用）

## ② データ分析

### 学生フロー
- 転換率・今週の注目学生

### 企業フロー
- 新規企業・アクティブ企業

### ボトルネック
- 詰まり箇所を1-2行で特定

## ③ 仮説（3つ以内）

## ④ 打ち手リスト
| 施策 | 担当部署 | 期限 | 優先度 |

## ⑤ アクションアイテム（最大3件）
1. 【今日/今週中】タスク
2. 【今週中】タスク
3. 【来週】タスク

## 次回への引き継ぎ
```

### 追記時（既存ファイルあり）

```markdown
---

## W{N} アップデート（Manus AI レポート: {日付範囲}）

### 数値更新
| KPI | 前週 | 今週 | 変化 |

### 新規学生
- {名前}（{大学}）

### 新規企業
- {企業名}

### 今週のアクションアイテム
1. タスク
2. タスク
3. タスク
```

---

## Step 7: ブリーフィング表示

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /weekly_kpi 完了 — YYYY-MM-DD (W{N})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 KDB更新:
  LINE: {前週累計} → {今週累計} (+{差分})
  Application: {前週累計} → {今週累計} (+{差分})
  Match: {累計} (+{差分})
  転換率: LINE→App {%} / App→Match {%}

🆕 新規学生（{N}名）:
  - {名前}（{大学}）

🏢 新規企業（{N}社）:
  - {企業名}

🎯 今週のアクションアイテム:
  1. {アクション}
  2. {アクション}
  3. {アクション}

📁 更新ファイル:
  ✅ kpi/db/weekly.md
  ✅ kpi/db/monthly.md
  ✅ kpi/db/conversion.md
  ✅ kpi/current.md
  ✅ strategy/sessions/YYYY-MM-DD.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 重要ルール

1. **既存データ上書き禁止**: 実績値が入っている行は変更しない
2. **strategy sessionは追記優先**: 当日ファイルがある場合は末尾に追記
3. **月次集計は週次データから計算**: monthly.md を単独で編集しない
4. **コンバージョン率は累計ベース**: 週次の瞬間値ではなく累計で計算
