---
date: "2026-03-11"
source_dept: "kpi"
summary: "KPIスプレッドシート接続完了。目標値確認。週次記録体制が整った。"
action_required: true
---

# インサイト: KPI → Strategy

## 内容

KPIスプレッドシートへのGAS接続が完了。Settingsシートから目標値を取得済み。
`kpi/kpi.sh` による週次実績の記録・スプレッドシートへの書き込みが可能になった。
読み取りAPIが存在しないため、実績はローカルの `weekly-flow-log.md` でも管理する。

## 数値・データ

| KPI | 月次目標 | 週次目標 | 6ヶ月目標 |
|-----|---------|---------|---------|
| LINE登録 | 16.7 | 4.2 | 100 |
| Application | 8.3 | 2.1 | 50 |
| Match | 5 | 1.25 | 30 |
| Job Card Create | 10 | 2.5 | 60 |

## Strategyへの示唆

- **Match目標が最も遠い**: 現状0件、月5件目標 → 即効施策が必須
- **LINE登録は伸びている**（週+10名ペース）が、コンバージョン（Match）に繋がっていない
- **Application数は未集計** → 毎週 `kpi.sh record` で記録して実績を見える化する必要あり

## 要対応アクション

- [ ] 毎週月曜に `./kpi/kpi.sh record` で先週の実績を記録する（習慣化）
- [ ] COLUMN_MAP.mdのカラム順をスプレッドシートと照合する
- [ ] 記録が3週分たまったら、コンバージョン率の傾向を分析する

## 元ファイル

- 参照: `kpi/weekly-flow-log.md`
- 参照: `config/kpi-settings.md`
- 参照: `kpi/README.md`
