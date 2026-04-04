# JVA 仮想エージェントチーム 設計ドキュメント
**バージョン**: 1.0
**作成日**: 2026-03-23
**対象**: Japan's Venture Academy (JVA)

---

## 1. 概要

### 目的
JVAの業務を漏れなくダブりなく分解し、自然言語の短文指示で29名の専門エージェントが並列で動く仮想チームをClaude Code上に構築する。

### 解決する課題
- 営業リスト収集・アウトリーチ文作成・コンテンツ制作・KPI分析などの業務をAIが処理できていない
- 既存のスキル（morning/secretary等）はあるが、専門化・並列化が不十分
- 指示 → 実行 → Notionアウトプットのフローが手動

### 設計思想
チューリングPRマネージャーの事例（8部門32人・CLAUDE.md司令塔）を参考に、
「1つのAIに全部やらせる」ではなく「専門家チームとして設計する」アプローチを採用。

---

## 2. システム構成

### ファイル配置
```
/Users/sorasasaki/claude-workspace/jva-agents/   ← 独立フォルダ（ここからClaude起動）
├── CLAUDE.md                                      ← 司令塔（チーフ）
└── .claude/
    ├── agents/                                    ← 29名のエージェント
    │   ├── sales/（5名）
    │   ├── matching-ops/（4名）
    │   ├── content/（5名）
    │   ├── kpi-strategy/（4名）
    │   ├── partnership/（4名）
    │   ├── secretary/（4名）
    │   └── technical/（3名）
    └── skills/                                    ← 8冊の社内マニュアル
```

### 起動方法
```bash
cd /Users/sorasasaki/claude-workspace/jva-agents
claude
```

---

## 3. CLAUDE.md（司令塔）設計

チーフが自然言語指示を受け取り、最適なエージェントに振り分ける。

| キーワード | 起動エージェント |
|---|---|
| リスト、収集、LinkedIn | list-hunter + list-manager |
| メール、アウトリーチ、DM | outreacher + sales-copywriter |
| LINE、投稿、コンテンツ | line-content-writer + content-planner |
| スライド、資料 | slide-creator |
| KPI、週次、数値 | kpi-analyst + pdca-strategist |
| タスク、バックログ | chief-secretary |
| GAS、自動化 | gas-engineer |
| Notion、データベース | notion-architect |

**並列実行ルール**
- 独立したタスクは同時起動（リスト収集+文案作成 など）
- 依存関係がある場合は順次（構成→執筆 など）

**出力ルール**
- アウトプットは原則 Notion に記録
- チーム作業完了時は Discord 通知

---

## 4. 部門・エージェント一覧（29名）

### 営業部門 Sales（5名）
| エージェント | 役割 |
|---|---|
| student-outreacher | 学生へのDM・LINEメッセージ文案 |
| company-outreacher | 企業向けアウトリーチメール文案（LinkedIn・コールド） |
| list-hunter | LinkedIn/Web検索でターゲット企業リスト収集 |
| list-manager | リスト整理・重複管理・フォロー追跡 |
| sales-copywriter | VP基準のアウトリーチメッセージテンプレート設計 |

### マッチング・オペレーション部門（4名）
| エージェント | 役割 |
|---|---|
| matching-coordinator | 学生×企業の最適マッチング提案（手動サポート） |
| application-manager | 応募フロー管理・GAS自動化連携 |
| followup-specialist | 応募後の進捗追跡・返信期限リマインド |
| data-operator | Sheetsデータ整理・ステータス管理 |

### コンテンツ部門（5名）
| エージェント | 役割 |
|---|---|
| line-content-writer | 学生向けLINEポスト作成 |
| sns-strategist | Twitter/Instagram戦略設計 |
| copywriter | 短文コピー・見出し・CTA |
| content-planner | 週次・月次コンテンツ計画 |
| slide-creator | スライド・プレゼン資料作成 |

### KPI・戦略部門（4名）
| エージェント | 役割 |
|---|---|
| kpi-analyst | 週次KPI集計（4カテゴリ）・数値レポート |
| pdca-strategist | ボトルネック分析・PDCA改善提案 |
| market-researcher | 競合調査・市場トレンド・業界情報 |
| ceo-advisor | 意思決定支援・戦略ドキュメント |

### パートナーシップ部門（4名）
| エージェント | 役割 |
|---|---|
| university-recruiter | 大学・サークルへのアウトリーチ（学生獲得） |
| sponsorship-manager | スポンサー企業獲得・収益化提案 |
| external-relations | 外部イベント・メディア連携 |
| proposal-writer | 提案書・協業資料作成 |

### 秘書・管理部門（4名）
| エージェント | 役割 |
|---|---|
| chief-secretary | タスク管理・バックログ・カレンダー管理 |
| email-secretary | Gmail管理・返信下書き |
| document-secretary | 議事録・社内ドキュメント作成 |
| project-manager | プロジェクト進捗・マイルストーン管理 |

### テクニカル部門（3名）
| エージェント | 役割 |
|---|---|
| gas-engineer | GASスクリプト開発・保守（IB自動化等） |
| notion-architect | Notion DB設計・構造管理 |
| automation-engineer | MCP・ワークフロー自動化 |

---

## 5. Skills（社内マニュアル）一覧（8冊）

| ファイル | 内容 |
|---|---|
| jva-brand-guide | ブランドボイス・トーン・NG表現 |
| sales-outreach | アウトリーチチャネル・ターゲット・VP・メッセージ |
| content-creation | コンテンツ形式・LINE/SNSルール・投稿頻度 |
| kpi-reporting | 4カテゴリKPI定義・週次レポート・PDCA |
| matching-operations | 応募フロー・ステータス管理・フォローアップ |
| partnership-playbook | スポンサー収益化プロセス・提案書テンプレ |
| task-management | バックログ形式・デイリータスク・Notion連携 |
| technical-manual | GASパターン・Notion MCP・Discord通知 |

---

## 6. ブランドガイド要約

- **学生向け**: フレンドリー・熱量・日本語・絵文字OK
- **企業向け**: プロフェッショナル・英語（IBプラットフォーム）
- **名称**: 「JVA」または「Japan's Venture Academy」
- **NG**: 誇張表現・競合否定・曖昧コピー
- **企業VP**: コスト効率 × 日本トップ大学グローバル学生

---

## 7. 既存スキルとの関係

既存スキル（morning/evening/secretary/weekly_kpi等）は**段階的移行**。
エージェントシステムは独立フォルダで動作し、既存スキルと並存する。

---

## 8. 次フェーズ

- Skills内容を1冊ずつブレストして充実させる
- 既存スキルとの統合計画を設計
