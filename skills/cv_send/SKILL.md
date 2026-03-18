name: cv_send
description: >
  学生のCVを企業に送る際のメール文面を生成するスキル。
  スプレッドシートから学生データを取得し、企業情報と照合して
  パーソナライズされたCV送付メールを英語で生成する（JVAは常に英語）。
  「CVを送る」「CV送付」「CV送って」「cv send」などと言われたら即座に実行する。
  /cv_send と呼ばれても即座に実行する。
triggers:
  - CVを送る
  - CV送付
  - CV送って
  - cv send
  - CVを企業に
  - 学生のCVを
---

# /cv_send — CV送付メール生成

## 概要

学生名・企業名・ポジションを指定すると、スプレッドシートから学生データを取得し、
企業情報と照合してパーソナライズされたCV送付メール文面を生成する。

---

## 実行フロー

### Step 1: 入力受け取り（Interactive）

引数なしで呼ばれた場合、以下を確認する:

```
誰のCVをどの企業に送りますか？
例: 「TranをSORA Technologyに」「AhmedをJurin AIのEngineering Internに」
```

引数付きの場合（例: `/cv_send Tran → SORA Technology`）はそのまま Step 2 へ。

### Step 2: 学生データ取得（Automatic）

`company_jva/config/sheets.json` を読み込み、以下のコマンドで学生データを取得:

```bash
curl -sL "{students.url}?token={token}"
```

**有効データ**: 74行目以降のみ（`valid_from_row: 74`）

学生名で検索（First Name / Last Name どちらでもマッチ）し、該当行から以下を抽出:

| フィールド | 用途 |
|-----------|------|
| First Name / Last Name | 氏名 |
| University | 大学名 |
| Major / Field of Study | 専攻 |
| Skills / Experience | スキル・経験 |
| English Level | 英語力 |
| Japanese Level | 日本語力 |
| Applied Position / Company Name | 応募先ポジション・企業 |
| Email | 連絡先 |
| CV URL / CV File | CV参照先（添付確認用） |

> 学生が見つからない場合: 「スプレッドシートに該当する学生が見つかりませんでした。名前を確認してください。」と表示して終了。

### Step 3: 企業情報の読み込み（Automatic）

以下の順で企業情報を取得:

1. `company_jva/sales/clients/{company-name}.md` が存在すれば読み込む
2. なければ `company_jva/config/sheets.json` の `startups.url` からデータ取得し、企業名でマッチ

取得する情報:
- 担当者名（First Name + Last Name）
- 担当者メールアドレス
- ポジション名・要件（JD）
- 企業の特徴（About Company）

### Step 4: マッチポイント分析（Automatic）

学生プロフィール × 企業JD を照合し、以下を抽出:

- **強みポイント**: 企業の求める要件と学生スキルが合致する点（2〜3点）
- **ポジション**: 応募対象ポジションを特定

### Step 5: メール文面生成（Automatic）

以下のフォーマットでメールを生成する。

---

#### 件名
```
[Student First Name] [Last Name] — CV for [Position Name] at [Company Name]
```

---

#### 本文（English）

```
Hi [Company Name] Team,

We'd like to introduce [Student Full Name], who is highly interested in [Company Name]'s [Position Name].

[Student First Name] is currently studying [Major] at [University] and has [Key Skill 1], [Key Skill 2], and [Key Skill 3]. [He/She/They] is well-positioned for [Company Name]'s environment.

Please find [his/her/their] CV attached.

If [he/she/they] passes your screening and you'd like to move forward, could you share 2–3 available interview slots? We'll coordinate on our end and confirm.

We'd appreciate your decision by [Date: 5 business days from today].

Best regards,
Sora Sasaki
JVA Internship Board
https://www.japansventureacademy.com/
```

---

---

### Step 6: 出力と確認（Interactive）

生成したメールを表示し、以下を確認:

```
━━━━━━━━━━━━━━━━━━━━━━━━
  CV送付メール生成完了
━━━━━━━━━━━━━━━━━━━━━━━━

学生: [Name]（[University] / [Major]）
送付先: [Company] — [Contact Name] <[Email]>
ポジション: [Position]
言語: EN

[メール本文をコピペ用コードブロックで表示]

━━━━━━━━━━━━━━━━━━━━━━━━
CVのダウンロード・添付をお忘れなく！
CV参照先: [CV URL or "スプレッドシートのCV列を確認"]

送付後に Notion のステータスを「CV Sent」に更新してください。
━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 重要ルール

1. **学生データが不完全な場合** → 空欄部分を `[要確認: XXX]` として表示し、ユーザーに補完を求める
2. **担当者名が不明な場合** → `Hi [Name],` のままにして「担当者名を確認してください」と添える
3. **複数学生を同一企業に送る場合** → 1通ずつ個別メールを生成する
4. **言語**: 常に英語のみ生成。日本語版は生成しない
5. **返信期限**: 今日から5営業日後（土日祝を除く）を自動計算して記載
6. **送信はしない** — 文面生成のみ。実際の送信はユーザーが手動で行う
7. **Notion更新リマインド** — 送付後に Application DB のステータスを「CV Sent」に更新するよう毎回リマインドする
