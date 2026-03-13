---
date: "2026-03-11"
source_dept: "research"
summary: "マッチング0件の根本原因特定。学生多数派 vs 企業要件のミスマッチ構造が判明。"
action_required: true
---

# インサイト: リサーチ → Strategy

## 内容

`matching-bottleneck-analysis.md` と `student-persona.md` の分析から、
マッチング0件の根本原因が「学生の多数派プロファイルと掲載企業要件の構造的ミスマッチ」と確定。
特にJurin AIへの応募集中が主因。

## 数値・データ

| 指標 | 値 |
|------|-----|
| 有効学生数 | 18名（74行目以降） |
| 学生Owner分布 | Nahi 8名 / Sora 4名 / 未割当 6名 |
| 応募集中企業 | Jurin AI（AI系・要件過剰） |
| 要件マッチする企業 | BLUED Inc.・GlobalDeal等（応募ほぼゼロ） |

## Strategyへの示唆

- **即効**: Jurin AIへ推薦候補5名を送付（Nam, Physiwell, Pavit, Janine, Ronaldo）
- **即効**: BLUED Inc.をオンボードして、LINEや応募ページで前面に出す
- **中期**: 学生の応募前にスキルチェック/マッチング提案機能を導入
- **中期**: `/ib_match` スキルで学生×企業の自動マッチング提案を実装

## 要対応アクション

- [ ] Jurin AIへの推薦候補リストを営業に渡す（`sales/clients/jurin-ai.md` に追記）
- [ ] BLUED Inc.オンボーディングを進める（`sales/clients/` にファイル作成）
- [ ] 未割当6名のOwner割り当て（Sora優先）→ HR部署へ連携
- [ ] `/ib_match` スキル作成をPMのチケットに起票

## 元ファイル

- 参照: `research/topics/matching-bottleneck-analysis.md`
- 参照: `research/topics/student-persona.md`
