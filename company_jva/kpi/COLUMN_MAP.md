# 01_Weekly_Flow_Log — カラムマッピング

> ⚠️ このファイルは**実際のスプレッドシートのカラム順と一致させる必要があります**。
> スプレッドシートを開いて確認し、下記テーブルを修正してください。

## 現在の想定カラム順（要確認）

| col番号 | カラム名 | kpi.sh の引数 | 備考 |
|--------|---------|--------------|------|
| 1 | Week | `<week>` | 例: 2026-W11 |
| 2 | LINE新規登録 | `<line>` | LINE Friends Add |
| 3 | Application数 | `<app>` | Fill Form |
| 4 | Match数 | `<match>` | 最終KPI |
| 5 | Job Card作成数 | `<jobcard>` | 企業側KPI |
| 6 | Reachout (LinkedIn) | `[reach_li]` | 営業アウトリーチ |
| 7 | Reachout (Mail) | `[reach_mail]` | |
| 8 | MTG数 | `[mtg]` | |

## カラム順がずれている場合

`kpi.sh` の `record` / `record-raw` コマンド内の以下の行を修正：

```bash
"row": ["$WEEK", $LINE_ADD, $APP, $MATCH, $JOBCARD, $REACH_LI, $REACH_MAIL, $MTG],
```

スプレッドシートのカラム順に合わせて並び替えてください。

## WeeklyKPI シートのカラム（確認待ち）

| col番号 | カラム名 | 備考 |
|--------|---------|------|
| 1 | ? | スプレッドシートで確認 |
