# KPI 管理 — ローカルKDB 運用ガイド

## 概要

スプレッドシートへの書き込みは **Manus AI が担当**。
このディレクトリは Claude との作業用ローカルKDB として機能する。

---

## ファイル構成

```
kpi/
├── db/
│   ├── weekly.md      ← 週次生データ（正となるデータ）
│   ├── monthly.md     ← 月次集計（weekly.md から自動集計）
│   └── conversion.md  ← コンバージョン率推移（週次・累計）
├── settings.md        ← KPI目標値
├── current.md         ← 現在値スナップショット（参照用）
└── README.md          ← 本ドキュメント
```

---

## 週次の使い方

### 1. Manus AI レポートを受け取ったら

```
レポートをコピーして Claude に貼り付け → /weekly_kpi
```

Claude が以下を自動実行:
- `db/weekly.md` に週次データを追記
- `db/monthly.md` の当月集計を更新
- `db/conversion.md` の転換率を再計算
- `current.md` のスナップショットを更新
- `strategy/sessions/` に PDCA セッションを生成

### 2. KPI を確認したいとき

| 目的 | 参照ファイル |
|------|-------------|
| 今週の数値 | `current.md` |
| 週次推移を見たい | `db/weekly.md` |
| 月次まとめ | `db/monthly.md` |
| 転換率の変化 | `db/conversion.md` |
| 目標値との差 | `settings.md` |

### 3. 戦略・PDCA を話したいとき

```
「戦略を話したい」「KPIを振り返りたい」と伝えるだけ
```

Claude が `strategy/CLAUDE.md` に従って議論を進める。
過去セッションは `strategy/sessions/` に蓄積される。

---

## データの正について

| データ | 正 | 参照 |
|--------|-----|------|
| 生データ（数値） | スプレッドシート（Manus管理） | `db/weekly.md` |
| 戦略・分析 | ローカルKDB（Claude管理） | `strategy/sessions/` |
| 目標値 | スプレッドシート「00_Settings」 | `settings.md` |

---

## 過去データの修正

`db/weekly.md` の該当行を直接編集した後、Claude に以下を依頼:

```
「db/weekly.md を修正したので monthly.md と conversion.md を再計算して」
```
