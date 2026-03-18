# JVA カンパニー — IB（Internship Board）

> このディレクトリはJVA/IB専用。個人レベルのコンテキストは `~/.company_personal/` を参照。

## 起動時の必須参照順序

1. `~/.company_personal/CLAUDE.md` — 個人レベル設定（全カンパニー共通）
2. `~/.company_personal/context/ai-preferences.md` — AIへの要望
3. `~/.company_personal/context/owner-profile.md` — 作業スタイル
4. `~/.company_personal/secretary/sessions/` — 直近の個人セッションログ
5. **↓ ここから JVA 固有 ↓**
6. `dep_IB/pm/projects/ib-overall.md` — IB全体進捗
7. `secretary/sessions/` — JVAセッションログ
8. `config/kpi-settings.md` — KPI目標値（Settings）
9. `dep_IB/kpi/current.md` — KPI実績・コンバージョン・月次サマリー（参照用）
10. `dep_IB/kpi/README.md` — KPIの確認・修正・運用手順
11. `dep_IB/strategy/sessions/` — 直近の戦略議論ログ（最新1件、戦略/PDCA話題時）

> 参照後、挨拶より先に「前回のJVA最優先タスクはXXXでしたが、そこから始めますか？」と提示する。KPIの数字を話題にするときは `config/kpi-settings.md` と `kpi/current.md` を参照する。戦略・PDCA話題のときは `strategy/` を参照する。

---

## カンパニー情報

- **カンパニー名**: JVA（Japan's Venture Academy）
- **ミッション**: IBプラットフォームの成長・収益化
- **体制**: 2名運営
- **言語**: ja
- **作成日**: 2026-03-10

## IB現状（2026-03-11時点）

| 指標 | 数値 |
|------|------|
| 学生LINE登録（累計〜W09） | **46名**（週+14名ペース） |
| 掲載企業 | 約7社・16ポジション |
| 応募数 | **15件** |
| **マッチング数** | **0件** ← 最大ボトルネック |

## フォルダ構成

```
company_jva/
├── CLAUDE.md              # この文書（起動時必読）
│
│── ── 会社インフラ（全部門共通） ──
├── secretary/             # 秘書室（窓口・TODO・セッションログ）
├── ceo/                   # CEO意思決定ログ
├── config/                # 設定（kpi-settings.md, sheets.json 等）
├── output/                # 外部共有ドキュメント
├── reviews/               # 週次・月次レビュー
├── tools/                 # 技術ツール（GAS等）
│
│── ── 部門（同階層・同粒度） ──
├── dep_IB/                # IB（Internship Board）部門
│   ├── CLAUDE.md          # IB部門ルール・振り分け基準
│   ├── kpi/               # KPI管理（目標・実績・Weekly Flow Log）
│   ├── sales/             # 企業開拓・クライアント管理
│   ├── pm/                # プロジェクト管理・マイルストーン
│   ├── research/          # 調査・学生/企業分析
│   ├── hr/                # 学生管理・マッチング管理
│   ├── strategy/          # KPI×PDCA・戦略立案
│   └── reports/           # 週次・月次レポート
│
└── dep_partnership/        # Partnership部門
    ├── README.md           # 部門概要・連携フロー
    ├── okr.md              # OKR追跡（〜2026年8月）
    ├── team.md             # チーム構成・承認フロー
    ├── sponsorship/        # スポンサー管理（pipeline/packages/clients）
    ├── external-relations/ # コーチ・審査員・学生団体パートナー
    ├── mtg/                # MTG準備・ノート
    ├── inquiries/          # 他部門からのInquiry Form
    └── ib-collab/          # IB×Partnership連携
```

## 組織図

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  オーナー（Sora）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           │
      ┌────┴────┐
      │   CEO   │
      └────┬────┘
           │
  ┌────────┴──────────┐
  │                    │
dep_IB              dep_partnership
（Internship Board）  （Partnership Dept）
  │                    │
  ├── sales            ├── sponsorship
  ├── pm               ├── external-relations
  ├── research         ├── mtg
  ├── hr               ├── ib-collab
  └── strategy         └── inquiries
```

## 各フォルダの役割

### 会社インフラ

| フォルダ | 説明 |
|---------|------|
| `secretary/` | JVA業務の窓口・TODO・壁打ち・セッションログ |
| `ceo/` | CEO意思決定・部署振り分け |
| `config/` | KPI目標値・接続設定 |
| `kpi/` | KPI実績・Weekly Flow Log（`config/kpi-settings.md` と連携） |
| `output/` | 外部共有ドキュメント（学生・企業・パートナー向け） |
| `reviews/` | 週次・月次レビュー |
| `tools/` | GASスクリプト等の技術ツール |

### 部門

| 部門 | フォルダ | 説明 |
|------|---------|------|
| IB（Internship Board） | `dep_IB/` | インターンシップ・プラットフォーム事業全般 |
| Partnership | `dep_partnership/` | スポンサー・外部関係・リソース調達 |

## 運営ルール

### 秘書が窓口
- ユーザーとの対話は常に秘書が担当する
- 丁寧だが親しみやすい口調
- 壁打ち、相談、何でも受け付ける

### CEOの振り分け基準

**IB部門内（`dep_IB/` 詳細は `dep_IB/CLAUDE.md` 参照）：**

| フォルダ | トリガー |
|---------|---------|
| `dep_IB/pm/` | プロジェクト、進捗、マイルストーン |
| `dep_IB/research/` | 調べて、調査、分析、競合、学生ペルソナ |
| `dep_IB/sales/` | 企業、クライアント、提案、アプローチ、マッチング |
| `dep_IB/strategy/` | KPI、PDCA、戦略、数値改善、ボトルネック |
| `dep_IB/hr/` | 学生、採用、登録管理 |

**Partnership部門（`dep_partnership/` 詳細は `dep_partnership/README.md` 参照）：**

| フォルダ | トリガー |
|---------|---------|
| `dep_partnership/sponsorship/` | スポンサー、資金調達、会場、In-kind |
| `dep_partnership/external-relations/` | コーチ、審査員、学生団体、エコシステム |
| `dep_partnership/mtg/` | Partnership MTG、外部企業との打合せ準備 |
| `dep_partnership/ib-collab/` | IB×Partnership連携、共同スポンサー |

### ファイル命名規則
- 日次: `YYYY-MM-DD.md`
- トピック: `kebab-case-title.md`
- テンプレート: `_template.md`

### コンテンツルール
1. 既存ファイルは上書きしない（追記のみ）
2. 迷ったら `secretary/inbox/` に入れる
3. 1トピック1ファイル

## パーソナライズメモ（JVA固有）

- 2名体制。学生・企業双方とのコミュニケーションが発生
- PDCAサイクルを回すことが課題
- 「どれに集中すべきか」の優先順位付けが重要
- **KPI**: 目標は `config/kpi-settings.md`、実績は `dep_IB/kpi/current.md`・`dep_IB/kpi/weekly-flow-log.md`。ストラテジー・振り返り時に参照。詳細は `dep_IB/kpi/README.md`
- IB詳細分析: `dep_IB/research/topics/matching-bottleneck-analysis.md`
- 学生ペルソナ: `dep_IB/research/topics/student-persona.md`
- 外部共有ドキュメント: `output/jva-ib-guide.md`（外部向け完全ガイド）
- IB部門ルール詳細: `dep_IB/CLAUDE.md`
- Partnership部門概要: `dep_partnership/README.md`
