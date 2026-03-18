# JVA タスクバックログ（AI管理用）

> **AIが参照・更新するファイル。**
> 重要度（縦軸）× 緊急度（横軸）の4象限で管理する。

---

## Q1: 緊急 × 重要

- [ ] Trial member Welcome MTGアウトライン ブラッシュアップ | 期限: 明日（3/18）17:00まで | ドラフト: `dep_IB/hr/onboarding/2026-03-19_welcome-mtg-outline.md` | 残: 6ヶ月KPI数字入れ・スライド要否確認
- [ ] IB自動化エージェント実装（GAS拡張 Step1）| 期限: 今日〜今週 | 設計済み: Option C ハイブリッド
- [ ] 習慣管理機能 設計・実装（毎朝9時チェック）| 期限: 今日
- [ ] WhatsApp Bot 基盤構築（モバイル対応）| 期限: 今日〜今週

```
優先度スコア: 最高（今日〜2日以内に着手）
```

- [ ] Googleフォームに確認ステップ追加（東京在住・就労資格）| 期限: 3/17 | 設計済み: `output/apply-confirmation-design.md` | **Nahiに依頼済み（3/15）**
- [ ] 企業にCVを送る（学生プロフィールをアウトリーチ先に添付）| 期限: 承認後随時 | 接続リクエスト15社送付済（2026-03-16）→ 承認待ち → 承認次第1通目メッセージ送付

---

## Q2: 非緊急 × 重要

- [ ] トライアルメンバー向けオンボーディングスライド仕上げ・共有 | スライド生成済み: `strategy/slides/JVA-IB-Trial-Member-Onboarding-0319.pptx` | 残: 内容確認・共有
- [ ] ウィークリーレポート作成 → Discordに送付 | 対象: W09（3/10〜3/16）| Discord用フォーマットのテンプレ作成含む
- [ ] Notion KPI DB構築（Notion AIで実行）| 方針確定済み: Settings DB + Weekly Flow Log DB + Dashboard の3点セット | プロンプト作成済み（2026-03-18）→ Notion AIに貼るだけ | 参照: company_jva/dep_IB/kpi/
- [ ] 1通目メッセージ ブラッシュアップ | ドラフト保存済: `dep_IB/sales/1st-message-draft.md` | 残作業: スケジューリングリンク追加・文章磨き・EN版作成

```
優先度スコア: 高（今週〜来週以内に計画・着手）
成長・予防・仕組み化に直結するタスク
```

- [ ] IBアウトリーチ 30件 Week1（3/16〜3/20）| 月曜スタート・学生先出しアプローチ | 目標: 20社掲載達成（2週間）
- [ ] ターゲットスタートアップ リスト精査 + アプローチ開始 | 候補20社作成済み: `sales/target-startups.md` | Manusで追加リサーチ後に確定・来週スタート
- [ ] 企業ミーティング用資料作成（外部向けピッチ）| 期限: 来週中 | Manus or /slides で生成
- [ ] 企業ガイドライン（SLAポリシー）→ Notionにアップ | ドラフト作成中
- [ ] 学生自動メール送信の代替手段検討（GAS CV添付問題）| 候補: Notion自動化・Make/Zapier
- [ ] 掲載企業への選考状況フォロー（I&N・GlobalDeal等）| 定期: 毎週
- [ ] LinkedIn投稿 | 定期: 週1回以上 | LINE登録の主要ドライバー
- [x] Google Sheets アウトリーチトラッカー新規作成 | 完了: 2026-03-16 → 30社登録・Message Templatesシート追加・outreach-tracker.md作成・承認3社反映済み
- [ ] LINE追加時に学生属性アンケート追加 | 目的: 企業営業時に「登録学生の属性データ」として活用 | 方法: LINE追加後の自動返信 or Googleフォーム誘導など検討

---

## Q3: 緊急 × 非重要

```
優先度スコア: 中（素早く片付けるか委任）
```

- [ ] 公式LINEコミュニケーション対応 | 随時発生
- [ ] Inbox消化 | 毎日

---

## Q4: 非緊急 × 非重要

```
優先度スコア: 低（後回し・削除検討）
```

---

## 完了済み

- [x] IBマッチング0件の原因分析 | 完了: 2026-03-10
- [x] company_jva 組織セットアップ | 完了: 2026-03-10
- [x] Gmail MCP 接続 | 完了: 2026-03-11
- [x] Google Calendar MCP 接続 | 完了: 2026-03-11
- [x] 企業オンボーディングテンプレ作成 | 完了: 2026-03-13 → `sales/onboarding-template.md`
- [x] 応募前スクリーニング設計ブリーフ | 完了: 2026-03-13 → `output/apply-confirmation-design.md`
- [x] Manus用ブランドガイド・スライドスキル整備 | 完了: 2026-03-13 → `output/manus/`
- [x] Jeongmin/Martin 企業推薦送付 | 完了: 2026-03-13
- [x] トライアルメンバー向け Responsibilities 作成・共有 | 完了: 2026-03-13
- [x] 新メンバー向けビジョン共有スライド作成（IB説明・ビジョン・Responsibilities統合）| 完了: 2026-03-15
- [x] 企業向け掲載ガイド作成（英語・日本語文面 + Manusプロンプト）| 完了: 2026-03-16 → `output/company-listing-guide.md` / `output/manus/prompt-company-listing-guide.md`
- [x] LinkedIn アウトリーチ 接続リクエスト15社送付 | 完了: 2026-03-16 → `sales/outreach-db.md` / `sales/outreach-tracker.csv`
- [x] Google Drive MCP 接続（gdrive）| 完了: 2026-03-16 → Claude Code `~/.claude.json` に追加済み
- [x] 企業オンボーディングテンプレ Rule 2 更新（4営業日統一）| 完了: 2026-03-16 → `sales/onboarding-template.md`
- [x] Google Sheets MCP 接続（google-sheets）| 完了: 2026-03-16 → OAuth設定・token取得・✓ Connected確認済み
- [x] outreach-tracker.csv 完成（30社 + 優先週 + Step + EN/JAテンプレ列）| 完了: 2026-03-16 → `sales/outreach-tracker.csv`
- [x] Google Sheets アウトリーチトラッカー作成・運用開始 | 完了: 2026-03-16 → 30社登録・Message Templatesシート・CSV+MD同期体制確立
- [x] Notion MCP連携セットアップ | 完了: 2026-03-17 → @notionhq/notion-mcp-server stdio方式で接続成功
- [x] AI秘書システム仕様書をNotionに移行 | 完了: 2026-03-18 → 「Claude to Notion」ページ配下にスペック・バックログ・プロジェクトコンテキスト全8ページ作成
- [x] LinkedInアウトリーチ 承認3社の1通目準備 | 完了: 2026-03-16 → Sensyn/Aeterlink/Asuene（全JA）・ドラフト保存済み
- [x] Partnership説明スライドをManusで作成 | 完了: 2026-03-17
- [x] Martinにスケジューリングリンク送付（JurinAI Engineering Intern）| 完了: 2026-03-17 → Interview段階へ
- [x] 学生・企業・応募進捗DB構築 | 完了: 2026-03-17 → `dep_IB/hr/students.md` / `dep_IB/sales/companies.md` / `dep_IB/hr/applications.md`

---

## 更新ルール

- `/fin_s` 実行時: 完了タスクを「完了済み」に移動 + 新規タスクを適切な象限に追加
- `/morning` 実行時: Q1→Q2の順で今日のタスク候補を `tasks/today.md` に出力
- タスク追記時: 象限は「重要度」「緊急度」で判断。迷ったらQ2に入れる

*更新日: 2026-03-17*
