name: ohayo
description: >
  朝の挨拶・起床・朝を感じさせる発言を検知したら自動でGoogleカレンダー予定取得＋タスク進捗確認＋今日やるべきことの提案を行う。
  以下のような発言が来たら即座に実行する（スラッシュコマンド不要）:
  「おはよう」「おはようございます」「はよう」「はよ」「よっす」「good morning」「グッドモーニング」
  「朝だ」「いい朝だ」「起きた」「朝起きた」「眠い」「今日もよろしく」「今日もよろしくお願いします」
  「もう朝か」「朝になった」「始めよう」「さあやるか」「今日も頑張ろう」
  /ohayo と呼ばれても即座に実行する。
triggers:
  - おはよう
  - おはようございます
  - はよう
  - はよ
  - よっす
  - good morning
  - グッドモーニング
  - 朝だ
  - いい朝だ
  - 起きた
  - 朝起きた
  - 眠い
  - 今日もよろしく
  - 今日もよろしくお願いします
  - もう朝か
  - 朝になった
  - 始めよう
  - さあやるか
  - 今日も頑張ろう
---

# /ohayo — AI朝会ブリーフィング

## 概要

朝の挨拶 or `/ohayo` を検知したら、以下を **全自動** で実行して今日の最適な行動を提案する:

1. **Googleカレンダーから今日・今週の予定を取得**（MCP）
2. **学生スプレッドシートから新規応募を検出**（GAS endpoint）
3. **企業スプレッドシートから新規申請を検出**（GAS endpoint）
4. **タスク・プロジェクトの進捗を読み込み**（company files）
5. **今日やるべきことを優先順位付きで提案**

---

## 実行フロー

### Step 1: 現在時刻・日付の取得（Automatic）

`mcp__google-calendar__get-current-time` を呼び出し、今日の日付・曜日・時刻を取得する。

### Step 2: カレンダー取得（Automatic）

`mcp__google-calendar__list-events` を使い以下を取得:

- **今日の予定**: `timeMin = TODAY 00:00:00` / `timeMax = TODAY 23:59:59`
- **今週の残り予定**（今日以降〜今週末まで）

取得対象カレンダー: `primary`（デフォルト）

### Step 3: 新規学生応募の検出（Automatic）

設定ファイルを読み込む:
```
{company_dir}/config/sheets.json       → GAS URL・token
{company_dir}/config/last_checked.json → 前回チェック日
```

以下のbashコマンドで学生データを取得し、`last_checked.students_last_checked` より新しいタイムスタンプの行を抽出する:

```bash
curl -sL "{students.url}?token={token}"
```

**有効データの範囲**: スプレッドシートの74行目以降のみ対象（それ以前は旧フォームデータ）

新規応募の判定:
- 前回チェック日より新しい `Timestamp` を持つ行
- かつ `First Name` が空でないこと

**Owner割り当てロジック**（新規・未割当の学生に適用）:
- 現在のOwner別カウントを集計（"Sora" と "sora" は同一人物として正規化）
- 件数が少ない方（Sora or Nahi）に割り当てる
- 同数の場合は Sora → Nahi → Sora... の交互割り当て

**TODO生成**（新規応募者がいる場合）:
各新規学生について以下のTODOを生成する（担当者ベース）:
```
- [ ] [担当:Sora/Nahi] {名前}（{大学}）の応募を企業に連絡
      応募先: {Company Name} / {Position Title}
      登録日: {Timestamp}
      連絡先: {Email} / LINE: {LINE User Name}
```

### Step 3b: 新規企業申請の検出（Automatic）

設定ファイル `{company_dir}/config/sheets.json` の `startups.url` からデータ取得:

```bash
curl -sL "{startups.url}?token={token}"
```

**シートの2層構造（必ず区別して参照すること）:**

| 区分 | 行（シート上） | インデックス | 用途 |
|------|------------|------------|------|
| 旧フォーム（更新済み既存企業） | 4〜11行 | row[3]〜row[10] | ヘッダー=row[2]。col3-11がプラット更新時の情報。Active判定: col[5]に"continue"が含まれるか |
| **新フォーム（新規申請）** | **20行目以降** | **row[19]がヘッダー、row[20]以降がデータ** | これからどんどん溜まる。col0=Timestamp, col1=First Name, col2=Last Name, col3=Email, col4=LinkedIn, col5=Company Name, col6=Logo, col7=Website, col8=Location, col9=Industry, col10=About |

**新規申請の判定:**
- row[20]以降（`data_row_index_start: 20`）のデータが対象
- `last_checked.startups_last_checked` より新しい `Timestamp`（col[0]）を持つ行
- かつ col[5]（Company Name）が空でないこと

**TODO生成**（新規企業申請がある場合）:
```
- [ ] [新規企業] {Company Name}（{Industry}）の申請を確認・オンボーディング
      担当者: {First Name} {Last Name} <{Email}>
      場所: {Office Location} | サイト: {Company Website}
      申請日: {Timestamp}
```

### Step 4: タスク・プロジェクト進捗の読み込み（Automatic）

以下の順序でファイルを読み込む（カレントディレクトリの `.company*` を検索）:

```
1. {company_dir}/secretary/todos/TODAY.md        → 今日のTODO（あれば）
2. {company_dir}/secretary/sessions/ 最新ファイル → 前回の持ち越し
3. {company_dir}/pm/projects/*.md                → 進行中プロジェクトの現状
4. ~/.company_personal/tasks/recurring.md        → 今日が該当する定期タスク
```

### Step 5: 今日のTODOファイル作成・更新（Automatic）

`{company_dir}/secretary/todos/YYYY-MM-DD.md` を作成（既存なら追記のみ）:

```markdown
# TODO: YYYY-MM-DD（曜日）

## 今日の最優先（Must Do）
- [ ] [タスク] | 理由: [なぜ今日やるか]

## 新規応募対応（要連絡）
- [ ] [担当:Sora] {名前}の応募を{企業}に連絡 | 登録:{日付}
- [ ] [担当:Nahi] {名前}の応募を{企業}に連絡 | 登録:{日付}

## 今日の予定（カレンダーより）
- HH:MM [イベント名]

## 通常タスク（Should Do）
- [ ] [タスク]

## 持ち越し（前回未完了）
- [ ] [前回セッションから引き継ぎ]

---
作成: /ohayo YYYY-MM-DD
```

### Step 6: last_checked.json 更新（Automatic）

```json
{ "students_last_checked": "YYYY-MM-DD" }
```

### Step 7: ブリーフィング表示（Automatic）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  おはようございます！ YYYY-MM-DD（曜日）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 今日の予定（N件）:
  HH:MM  [イベント名]
  ...（なければ「予定なし」）

🆕 新規学生応募（前回チェック以降）: N名
  [担当:Sora] {名前}（{大学}）→ {企業}/{ポジション}
  [担当:Nahi] {名前}（{大学}）→ {企業}/{ポジション}
  ※ TODOに追加済み

🏢 新規企業申請（前回チェック以降）: N社
  {Company Name}（{Industry}）— {First Name} <{Email}>
  ※ TODOに追加済み

🎯 今日の最優先（最大3件）:
  1. [タスク] — [理由]
  2. [タスク] — [理由]
  3. [タスク] — [理由]

📋 持ち越しタスク（N件）:
  - [未完了タスク一覧]

📊 プロジェクト現在地（IB）:
  有効学生: N名 / Owner: Sora N名・Nahi N名
  [進行中プロジェクトの一言サマリー]

🔄 今日の定期タスク:
  - [recurring.md から今日が該当するもの。なければ省略]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
何から始めますか？
```

---

## 優先順位のロジック

最優先タスクを選ぶ基準（上が強い）:

| 優先度 | 条件 |
|--------|------|
| 最高 | 新規応募あり → 企業への連絡TODOを最上位に |
| 最高 | 今日カレンダーに予定がある → 直前準備が必要なもの |
| 高 | 期限が今週中 or マイルストーン期限が近い |
| 高 | 前回セッションで「次回の推奨アクション 1位」に挙がったもの |
| 中 | ボトルネック解消に直結するもの |
| 低 | バックログ・通常タスク |

---

## 重要ルール

1. **MCPが使えない場合** → カレンダー取得をスキップし「カレンダー取得不可」と明記して継続
2. **GAS取得が失敗した場合** → 「スプレッドシート取得不可」と明記して継続
3. **TODOファイルが既存の場合** → 上書き禁止・追記のみ
4. **最優先は最大3件に絞る**
5. **新規応募がない場合** → 「🆕 新規応募: なし」と表示して次へ
6. **Owner正規化**: "sora" / "Sora" / "SORA" はすべて "Sora" として集計
7. **カレンダーの予定は時系列で表示**（時刻昇順）
8. **終日イベントは「終日:」プレフィックスで区別**
9. **学生データは74行目（ヘッダー除く）以降のみ有効**
