# IB（Internship Board）Department

> JVAのインターンシップ・プラットフォーム事業を担う部門。学生と企業のマッチングが主軸。
> 会社インフラ（secretary/ceo/config/kpi）は上位の `../CLAUDE.md` を参照。

---

## 部門ミッション

学生と企業を繋ぐインターンシッププラットフォームの成長・収益化。  
**最大ボトルネック：マッチング数（現在0件）**

---

## フォルダ構成

```
dep_IB/
├── CLAUDE.md          # この文書
├── kpi/               # KPI管理（目標・実績・Weekly Flow Log）
│   ├── README.md      # 確認・修正・運用手順
│   ├── current.md     # 実績サマリー・コンバージョン・月次
│   ├── weekly-flow-log.md
│   └── kpi.sh         # CLI操作スクリプト
├── sales/             # 企業開拓・クライアント管理
│   ├── clients/       # 1企業1ファイル
│   └── proposals/     # 提案書
├── pm/                # プロジェクト管理・マイルストーン
│   ├── projects/      # ib-overall.md など
│   └── tickets/
├── research/          # 調査・学生/企業分析
│   └── topics/        # matching-bottleneck-analysis.md など
├── hr/                # 学生管理・マッチング管理
│   └── hiring/
├── strategy/          # KPI×学生×企業の統合分析・PDCA
│   ├── sessions/      # 戦略議論ログ
│   ├── briefs/        # テーマ別まとめ
│   ├── insights/      # 各部署インサイト集約
│   └── roadmap/       # 月次・四半期ロードマップ
└── reports/           # 週次・月次レポート
    └── weekly/
```

---

## 各フォルダの役割

| フォルダ | 役割 | 主なファイル |
|---------|------|------------|
| `kpi/` | KPI目標・実績追跡・Weekly Flow Log | `current.md`, `weekly-flow-log.md` |
| `sales/` | 企業開拓・クライアント管理・提案書 | `clients/jurin-ai.md` 等 |
| `pm/` | IB全体進捗・マイルストーン管理 | `projects/ib-overall.md` |
| `research/` | 市場調査・学生ペルソナ・ボトルネック分析 | `topics/student-persona.md` |
| `hr/` | 学生登録・マッチング管理 | - |
| `strategy/` | KPI分析・PDCA議論・戦略立案 | `sessions/`, `briefs/` |
| `reports/` | 週次・月次レポート保管 | `weekly/` |

---

## CEOの振り分け基準（IB部門内）

| フォルダ | トリガーキーワード |
|---------|----------------|
| `pm/` | プロジェクト、進捗、マイルストーン、全体像 |
| `research/` | 調べて、分析、競合、学生ペルソナ、ボトルネック |
| `sales/` | 企業、クライアント、提案、アプローチ、マッチング |
| `hr/` | 学生、採用、登録、マッチング管理 |
| `strategy/` | KPI、PDCA、戦略、数値改善、ボトルネック解消 |

---

## Partnership との連携

IB部門とPartnership部門（`../dep_partnership/`）は以下のシナリオで協力する：

- IBがスポンサー候補企業と接触 → Partnershipに紹介
- IBイベント（Demo Day等）の会場・In-kindスポンサー → Partnershipに依頼
- IBのメンター・審査員ニーズ → Partnershipに Inquiry Form提出

連携詳細: `../dep_partnership/ib-collab/README.md`
