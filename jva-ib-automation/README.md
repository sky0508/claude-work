# JVA IB 応募自動化 — Google Apps Script

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `Code.gs` | `onFormSubmit` ハンドラー（エントリーポイント） |
| `email.gs` | `sendApplicationEmail()` — 企業へのメール送信 |
| `discord.gs` | `notifyDiscord()` — Discord Webhook 通知 |
| `utils.gs` | `lookupCompanyEmail()`, `extractDriveFileId()` |

---

## セットアップ手順

### 1. GAS プロジェクト作成

1. Response Spreadsheet を開く
2. 「拡張機能」→「Apps Script」を開く
3. 4つの `.gs` ファイルをそれぞれ作成してコードを貼り付ける

### 2. スクリプトプロパティの設定

「プロジェクトの設定」→「スクリプトのプロパティ」に以下を追加：

| キー | 値 |
|------|----|
| `DISCORD_WEBHOOK_URL` | Discord の Webhook URL |
| `COMPANY_MASTER_SHEET_ID` | 会社マスタースプレッドシートの ID |
| `SENDER_NAME` | `JVA Internship Board`（任意） |

### 3. フォームフィールド名の確認

`Code.gs` の `FIELD_NAMES` 変数を **Google Form の質問文と完全一致** するよう更新する：

```javascript
var FIELD_NAMES = {
  company:    '応募先会社名',       // ← フォームの質問文に合わせて変更
  position:   '応募ポジション',
  name:       '氏名',
  university: '大学名・学年',
  skills:     'スキルセット',
  linkedin:   'LinkedIn URL',
  cvUrl:      'CV（Google Drive URL）',
  clUrl:      'カバーレター（Google Drive URL）'
};
```

### 4. トリガー設定

「トリガーを追加」→ 以下の設定でインストーラブルトリガーを作成：

- 実行する関数: `onFormSubmit`
- イベントのソース: スプレッドシートから
- イベントの種類: フォーム送信時

> ⚠️ **重要**: シンプルトリガー（`function onFormSubmit`）ではなくインストーラブルトリガーとして設定すること。DriveApp・GmailApp・SpreadsheetApp（別スプレッドシート）へのアクセスにはインストーラブルトリガーが必要。

### 5. JVA 共通アカウントで承認

**JVA 共通 Gmail アカウント** でブラウザにログインした状態で：
1. Apps Script エディタを開く
2. `onFormSubmit` を手動実行 → OAuth 承認ダイアログで以下を許可：
   - Gmail（メール送信）
   - Google Drive（ファイル読み取り）
   - Google Sheets（スプレッドシート読み書き）

> ⚠️ Sora 個人アカウントで承認すると Sora のアドレスから送信されます。

### 6. 会社マスターシートの整備

`COMPANY_MASTER_SHEET_ID` で指定したスプレッドシートの **1枚目のシート** に以下の形式で入力：

| A列（会社名） | B列（メールアドレス） |
|--------------|-------------------|
| Jurin AI | hr@jurinai.com |
| BLUED Inc. | recruit@blued.com |

> ⚠️ A列の会社名はフォームのプルダウン選択肢と **完全一致** させること。

### 7. Response Sheet の準備

フォームの回答シートの **1行目（ヘッダー行）** の末尾に `送信ステータス` という列を追加する（スクリプトが自動作成することもできますが、手動追加を推奨）。

---

## 検証手順

1. テスト用 Google アカウントでフォームに回答（テストファイルをアップロード）
2. Response Sheet に行が追加され「送信済み（タイムスタンプ）」が記録されることを確認
3. Discord に ✅ 通知が届くことを確認
4. 企業担当者のメールに CV・CL 添付で届くことを確認
5. 会社名が存在しないケースでテスト → Discord に 🚨 アラートが届くことを確認
6. 同じフォーム回答を2回処理 → ⚠️ 重複警告が届きスキップされることを確認

---

## エラーハンドリング一覧

| エラー種別 | Discord 通知 | ステータス列 |
|-----------|------------|------------|
| 会社名が見つからない | 🚨 アラート | `エラー: 会社未登録` |
| Drive ファイルアクセス不可 | 🚨 アラート | `エラー: (詳細)` |
| メール送信失敗 | 🚨 アラート | `エラー: (詳細)` |
| 重複送信検知 | ⚠️ 警告 | 変更なし（スキップ） |
