---
created: "2026-03-10"
project: "IB（Internship Board）全体"
status: in-progress
tags: [JVA, IB, matching, sales]
---

# プロジェクト: IB（Internship Board）全体管理

## 概要
JVA General が運営するインターンシップ・マッチングプラットフォーム。
学生とスタートアップを繋ぎ、リアルな実務経験を提供する。
2名体制で運営。

## 現状スナップショット（2026-03-10時点）
- 学生LINE登録: 週+10名ペースで増加中
- 掲載企業: 約7社 / 約15ポジション
- 応募数: 約15件
- マッチング数: **0件** ← 最大ボトルネック
- 仮説: 学生スキル（Figma/デザイン系）と企業JDのミスマッチ

## ゴール
- 短期（1ヶ月）: マッチング月1件以上を達成
- 中期（3ヶ月）: 掲載企業15社以上、マッチング月5件以上
- 長期: 2名リソースでPDCAが自律的に回る仕組みの構築

## プロジェクト一覧

| # | プロジェクト名 | 優先度 | ステータス | 担当部署 |
|---|--------------|--------|-----------|---------|
| 1 | マッチング0の原因分析 | 最優先 | in-progress | リサーチ |
| 2 | 学生ペルソナ定義 | 高 | open | リサーチ + 人事 |
| 3 | ターゲット企業開拓 | 高 | open | 営業 + リサーチ |
| 4 | 日常オペレーション型化 | 高 | open | 秘書室 + 人事 |
| 5 | 営業ナレッジ蓄積 | 中 | open | 営業 |

## マイルストーン
| # | マイルストーン | 期限 | 状態 |
|---|-------------|------|------|
| 1 | マッチング0の原因を特定・打ち手を決める | 2026-03-17 | 進行中 |
| 2 | 新規ターゲット企業5社リスト作成 | 2026-03-24 | 未着手 |
| 3 | 新規1社以上への営業アプローチ完了 | 2026-03-31 | 未着手 |
| 4 | マッチング1件達成 | 2026-04-10 | 未着手 |

## 関連ファイル
- リサーチ: `research/topics/matching-bottleneck-analysis.md`
- リサーチ: `research/topics/student-persona.md`
- 営業: `sales/clients/` 以下の各企業ファイル

## 分析済み事項（2026-03-10）

### マッチング0の根本原因（特定済み）
- 学生がJurin AI（AIスタートアップで魅力的）に集中して応募
- しかしJurin AIは週35-40h、Business Japanese、専門スキル必須 → 全員落ちる
- 多数派学生（70%以上）はビジネス系・英語堪能・日本語弱い・ハードスキルなし
- 多数派に合う企業（BLUED Inc.、GlobalDeal等）に応募が来ていない構造

### Jurin AI推薦候補（要アクション）
| 学生名 | スキル | 推薦先 |
|--------|--------|--------|
| Nam Pham（東大 CS）| Python, React, LLMs, AI | Engineering |
| Physiwell Maume（Keio）| Data Eng, AI, Deutsche Bank | Engineering |
| Pavit Kaur（東工大）| LLM, MySQL, chatbot, API | Engineering |
| Janine Vistro（Waseda MBA）| MBA、コンサル経験 | Operations/Sales |
| Ronaldo Keng（UNSW）| Antler、Series A営業 | Operations/Sales |

## メモ
- 現在の最優先はJurin AIへの推薦候補送付と、BLUED Inc.への学生誘導
- 2人リソースを守るため、型化・テンプレート化を常に意識する
- 詳細分析: `research/topics/matching-bottleneck-analysis.md`
- 学生ペルソナ: `research/topics/student-persona.md`
- セッションサマリー: `secretary/notes/2026-03-10-session-summary.md`

### 2026-03-10 追記: オペレーション効率化インフラ整備
- Google Calendar MCP 接続完了（カレンダー読み書き可能）
- 学生スプレッドシート GAS endpoint 接続完了
  - 総登録: 96名 / 有効（74行目以降）: 18名
  - Owner分布: Nahi 8名・Sora 4名・未割当 6名
- 企業スプレッドシート GAS endpoint 接続完了
  - ACTIVE: 7社 / 新規（row20以降）: 2社（Amon Technologies・BLUED.co.ltd）
- /ohayo スキル作成: 朝会ブリーフィング自動化（カレンダー+学生+企業の新規検出）
- 設定ファイル: `config/sheets.json`・`config/last_checked.json`
- 次フェーズ: KPIスプレッドシート接続・/ib_matchスキル作成
