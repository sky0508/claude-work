# JVA IB 応募自動化 — 実装ステータス

最終更新: 2026-03-23

---

## 現在の状態

**フェーズ: JVAアカウント移行作業中**

Soraの個人アカウント（sorasasaki140508@gmail.com）でエンドツーエンドのテストが完了。
本番運用に向けて、JVAアカウント（japansventureacademy@gmail.com）への移行を実施中。

---

## 実装済み（✅ 完了）

### GASスクリプト（4ファイル）

| ファイル | 内容 | 状態 |
|---------|------|------|
| `Code.gs` | onFormSubmit ハンドラー、重複チェック、ステータス記録 | ✅ |
| `email.gs` | 企業へのメール送信、自然な英語本文、返信期限（+7日）自動計算 | ✅ |
| `discord.gs` | 成功/エラー/重複の Discord Webhook 通知 | ✅ |
| `utils.gs` | 会社メール検索、Drive URL パース、フォーム値取得 | ✅ |

### 動作確認済みの機能

- ✅ フォーム送信 → トリガー起動
- ✅ 会社マスターシートから企業メール取得
- ✅ 企業へメール送信（CV添付）
- ✅ Discord に成功通知
- ✅ Discord にエラーアラート（会社未登録時）
- ✅ Response Sheet の「送信ステータス」列に記録
- ✅ 重複送信防止

### メール本文の仕様

```
件名: [JVA IB] Application from [Name] for [Position] at [Company]

Hi [Company] Team,

We'd like to introduce [Name], who is highly interested in [Company]'s [Position] internship.

[FirstName] is currently studying at [University] and is eager to contribute to your team.

Please find their resume attached for your review.

If they pass your initial screening and you'd like to move forward, could you share 2–3 available interview slots? We'll coordinate on our end and confirm.

We'd appreciate your decision by [送信日 + 7日].

Best regards,
JVA Internship Board
```

### フォームフィールドマッピング（現在）

| GASのキー | フォームの質問文 |
|----------|----------------|
| company | Company Name |
| position | Position Title |
| firstName | First Name |
| lastName | Last Name |
| nationality | Nationality |
| university | University |
| email | Email address |
| lineUser | LINE User Name |
| linkedin | LinkedIn Account |
| cvFile | Please upload your latest resume |

### スクリプトプロパティ（現在の設定）

| キー | 現在の値 |
|------|---------|
| DISCORD_WEBHOOK_URL | 設定済み |
| COMPANY_MASTER_SHEET_ID | 1IUK228kB6hUeLvhZRkaUkiwcPRyxbuyjkv10Gma27jo（テスト用） |
| SENDER_NAME | JVA Internship Board |

---

## JVAアカウント移行手順

### Step 1: Soraアカウントの既存トリガーを削除 ⬜

1. Soraのアカウントで Response Spreadsheet を開く
2. 「拡張機能」→「Apps Script」→「トリガー（時計アイコン）」
3. `onFormSubmit` のインストーラブルトリガーを削除

### Step 2: JVAアカウントでトリガーを再設定 ⬜

1. ブラウザで **japansventureacademy@gmail.com** にログイン
2. 同じ Response Spreadsheet を開く
3. 「拡張機能」→「Apps Script」→「トリガーを追加」
4. 設定値:
   - 実行する関数: `onFormSubmit`
   - イベントのソース: スプレッドシートから
   - イベントの種類: フォーム送信時
5. 承認ダイアログで Gmail / Drive / Sheets 権限を許可

### Step 3: スクリプトプロパティの確認・更新 ⬜

JVAアカウントのApps Scriptプロジェクトで以下を確認:

| キー | 期待値 |
|------|--------|
| `DISCORD_WEBHOOK_URL` | 設定済みか確認 |
| `COMPANY_MASTER_SHEET_ID` | 本番シートのIDに更新（現在はテスト用） |
| `SENDER_NAME` | `JVA Internship Board` |

### Step 4: テスト送信 ⬜

フォームから1件テスト応募（JVAメンバーの情報で）して確認:
- [ ] 送信元が `japansventureacademy@gmail.com` になっている
- [ ] CVが添付されている
- [ ] 企業メールアドレスに届いた
- [ ] Discord通知が届いた
- [ ] Response SheetのステータスN列が「送信済み（タイムスタンプ）」になっている

### Step 5（オプション）: 本番会社マスターシートの整備 ⬜

- 実際のJVA掲載企業名とメールアドレスを登録
- A列の会社名をフォームのプルダウン選択肢と完全一致させる
- `COMPANY_MASTER_SHEET_ID` を本番IDに更新

---

## 既知の制約・注意事項

- フォームのファイルアップロードには**学生のGoogleアカウントが必須**
- 会社名は**完全一致**（大文字小文字・スペース含む）が必要
- GASの実行権限はトリガーを設定したアカウントに依存する
  → JVAアカウントで設定しないとSoraのアドレスから送信されてしまう

---

## テスト環境

| 項目 | 値 |
|------|-----|
| テスト用フォーム | [Student] JVA Startup Internship Board |
| Response Spreadsheet | Form_Responses シート |
| 会社マスター（テスト用） | Company Sheet(CVsent 自動化テスト用) |
| 送信元（現在） | sorasasaki140508@gmail.com（→ JVAアカウントに切り替え予定） |
