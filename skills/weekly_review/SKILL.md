---
name: weekly_review
description: 週次レビュー自動生成。今週の成果・未完了・来週の優先事項をまとめてレポートを生成する。/weekly_review と呼ばれたら即座に実行する。
---

# /weekly_review — 週次レビュー自動生成

## 概要

以下を自動実行:
1. **今週の作業ログを収集** → セッションログから実績を集計
2. **KPI・タスク進捗を集計** → 完了/未完了を整理
3. **来週の優先事項を提案** → バックログ + 未完了から優先順位付け
4. **週次レビューファイルを生成** → カンパニー別レビュー + 個人サマリー

---

## 実行フロー

### Step 1: カンパニー検出 & ログ収集（Automatic）

```bash
ls -d .company_* 2>/dev/null
```

対象ディレクトリのセッションログを読み込む:
- `.company_*/secretary/sessions/YYYY-MM-DD*.md`（今週分）
- `~/.company_personal/secretary/sessions/YYYY-MM-DD*.md`（今週分）

今週 = 月曜〜本日（実行日）

### Step 2: タスク状況収集（Automatic）

以下を読み込む:
```
~/.company_personal/tasks/recurring.md     → 定期タスクの実施状況
~/.company_personal/tasks/backlog.md       → 汎用バックログ
{company_dir}/secretary/todos/YYYY-MM-DD.md（今週分）
{company_dir}/pm/projects/*.md             → プロジェクト進捗
```

### Step 3: 週次レビュー生成（Automatic）

**① カンパニー別週次レビュー**: `{company_dir}/reviews/YYYY-WXX.md`

```markdown
# 週次レビュー: YYYY-WXX [カンパニー名]
期間: YYYY-MM-DD（月） 〜 YYYY-MM-DD（本日）

## 今週の成果
- （セッションログから抽出）

## 完了タスク
- [x] ...

## 未完了タスク（持ち越し）
- [ ] ...（優先度付き）

## KPI・数値（あれば）
| 指標 | 今週 | 先週 | 変化 |
|------|------|------|------|
| ... | ... | ... | ... |

## 来週の優先アクション（Top 5）
1. 【最優先】...
2. 【高】...
3. 【高】...
4. 【通常】...
5. 【通常】...

## 振り返り・インサイト
- うまくいったこと:
- 改善点:
- 発見・気づき:
```

**② 個人週次サマリー**: `~/.company_personal/secretary/sessions/YYYY-WXX-weekly.md`

```markdown
# 個人週次サマリー: YYYY-WXX
期間: YYYY-MM-DD 〜 YYYY-MM-DD

## 全カンパニー今週サマリー
| カンパニー | 主な成果 | 最優先未完了 |
|----------|---------|-----------|
| JVA | | |

## 来週の全体優先（横断）
1.
2.
3.

## 個人メモ（任意）
```

### Step 4: バックログ整理（Automatic）

`~/.company_personal/tasks/backlog.md` を読み込み、完了タスクに `[x]` を付け、来週優先候補を `🔜` でマーク。

### Step 5: 完了サマリー表示（Automatic）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  週次レビュー完了 YYYY-WXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 今週の成果（ハイライト）:
  [2-3行サマリー]

✅ 完了タスク: X件
⏳ 未完了持ち越し: X件

🔜 来週の最優先:
  1. [最優先タスク]
  2. [次点]

📁 生成したファイル:
  {company_dir}/reviews/YYYY-WXX.md
  ~/.company_personal/secretary/sessions/YYYY-WXX-weekly.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 重要ルール

1. **既存ファイルは上書き禁止** → 同週のファイルがあれば末尾に追記
2. **ログがない日はスキップ** → 空の集計行は作らない
3. **KPI数値は確認できたもののみ記載** → 推測値は書かない
4. **来週の優先は最大5件** → 絞り込んで提示する
