---
name: morning
description: 朝のブリーフィング。今日のTODO・前回の持ち越し・優先事項を整理して1日をスタートする。/morning と呼ばれたら即座に実行する。
---

# /morning — 朝のブリーフィング

## 概要

1日のスタートを効率化する。以下を自動実行:
1. **前回セッションの持ち越しを確認** → 未完了タスクを引き継ぎ
2. **今日のTODOファイルを作成** → 優先順位付きで整理
3. **ブリーフィングを表示** → 今日やるべきことを一覧で確認

---

## 実行フロー

### Step 1: コンテキスト読み込み（Automatic）

```
~/.company_personal/context/ai-preferences.md
~/.company_personal/context/owner-profile.md
~/.company_personal/tasks/recurring.md        → 今日が該当する定期タスクを抽出
~/.company_personal/tasks/backlog.md          → 高優先タスクを抽出
```

カンパニー検出:
```bash
ls -d .company_* 2>/dev/null
```

カンパニーがある場合:
```
{company_dir}/secretary/sessions/ の最新ファイル  → 前回の持ち越し
{company_dir}/secretary/todos/    の最新ファイル  → 未完了タスク
{company_dir}/pm/projects/*.md                   → 進行中プロジェクト確認
```

### Step 2: 今日のTODOファイル作成（Automatic）

**`{company_dir}/secretary/todos/YYYY-MM-DD.md`** を新規作成:

```markdown
# TODO: YYYY-MM-DD（曜日）

## 今日の最優先（Must Do）
- [ ] ... | 優先度: 最高 | 理由: ...
- [ ] ... | 優先度: 高

## 通常タスク（Should Do）
- [ ] ...

## 定期タスク（今日が該当するもの）
- [ ] ...（recurring.md から抽出）

## 持ち越し（前回未完了）
- [ ] ...（前回セッションから引き継ぎ）

---
作成: /morning YYYY-MM-DD
```

### Step 3: ブリーフィング表示（Automatic）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  おはようございます！ YYYY-MM-DD（曜日）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 今日の最優先:
  1. [最優先タスク]
  2. [次点]
  3. [次点]

📋 持ち越しタスク: X件
  - [未完了タスク一覧]

🔄 今日の定期タスク:
  - [recurring.md から該当するもの]

📊 プロジェクト状況:
  [アクティブなプロジェクトの一言サマリー]

📁 今日のTODOファイル:
  {company_dir}/secretary/todos/YYYY-MM-DD.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
何から始めますか？
```

---

## 重要ルール

1. **TODOファイルが既存の場合は新規作成しない** → 既存ファイルに追記のみ
2. **最優先は最大3件** → 絞り込んで提示する（多すぎると機能しない）
3. **定期タスクは今日が該当する曜日・日付のもののみ** → 毎日全部出さない
4. **「何から始めますか？」で締める** → ユーザーが次のアクションを取りやすくする
