# KPI Settings（目標値）

> **参照元**: スプレッドシート「00_Settings」と同期。JVA作業中はこのファイルで目標値をいつでも参照する。

## 最終同期

| 項目 | 値 |
|------|-----|
| 最終取得日 | （未取得の場合は空欄） |
| 取得方法 | 下記「取得コマンド」を実行後、出力をこのファイルに反映 |

## 取得コマンド

KPI GAS の **GET** は 00_Settings のみ返す。

```bash
# company_jva 直下で
curl -sL "https://script.google.com/macros/s/AKfycbxcAN8DAcCWgWg0xzCuuKCYmmt9z0kYblazLygxjYmmJN7tbD9FrJChNSLK5vCLQU0ILA/exec?token=jva_secret_token_2026"
```

取得したJSONをここに転記するか、`config/kpi-settings.json` に保存して参照する。

---

## 目標値（00_Settings の内容を転記）

| KPI項目 | 目標値 | 単位・備考 |
|---------|--------|------------|
| LINE公式アカウント登録数 | — | 週次 or 月次目標 |
| スタートアップ申し込み数 | — | 週次 or 月次目標 |
| コンバージョン率 | — | % |
| その他 | — | スプレッドシートの設定に合わせて追記 |

※ 実際の項目名・数値はスプレッドシート「00_Settings」に合わせて上記を更新すること。

---

## 注意

- **LINE累計登録数**: このKPIシート（Weekly Flow Log）にある数値**のみ**を合計して計算する。他ソースと合算しない。
- 目標値の**修正**はスプレッドシート「00_Settings」で行い、必要に応じてここを再取得で更新する。
