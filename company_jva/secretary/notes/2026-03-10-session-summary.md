---
created: "2026-03-10"
topic: "初回セッションサマリー / IBプロジェクト立ち上げ"
type: note
tags: [IB, session-summary, context]
---

# セッションサマリー: 2026-03-10

## このセッションでやったこと

1. **仮想会社組織（.company）をセットアップ**
   - 秘書室・CEO・PM・リサーチ・営業・人事の6部署を構築

2. **JVA / IB の現状把握**
   - JVA_General ファイルを読み込み、IBの状況を理解
   - 企業DBのCSVを分析（DB_Company）
   - 学生DBのCSVを分析（Student Application）

3. **マッチング0件の原因分析を実施**
   - 詳細: `research/topics/matching-bottleneck-analysis.md`

4. **学生ペルソナを分析**
   - 詳細: `research/topics/student-persona.md`

5. **IBプロジェクト全体管理ファイルを作成**
   - 詳細: `pm/projects/ib-overall.md`

6. **Jurin AIのクライアントファイルを作成**
   - 詳細: `sales/clients/jurin-ai.md`

---

## オーナーについて（重要コンテキスト）

- **名前**: 不明（敬称: 「あなた」で対応）
- **役割**:
  - @jve general（JVA = Japan's Venture Academy）でIBプラットフォームを2名で運営
  - Alphadrive でインターン（営業活動）
  - 某社のCHROとして勤務
- **ミッション**: IBプラットフォームの成長・収益化

---

## JVAとIBについての重要知識

### JVA概要
- 渋谷区（Shibuya Startup Support）公式支援の学生主導スタートアップ支援コミュニティ
- 活動3本柱: Bootcamp / ネットワーキングイベント / **IB（Internship Board）**

### IB現状（2026-03-10時点）
| 指標 | 数値 |
|------|------|
| 組織規模 | 16名 |
| IB運営人数 | **2名のみ** |
| 学生LINE登録 | 週+10名ペースで純増 |
| 掲載企業 | 約7社 |
| 掲載ポジション | 約15〜16ポジション |
| 応募数 | 約15件 |
| **マッチング数** | **0件** ← 最大ボトルネック |

### 掲載企業一覧（2026-03-10時点）
| 企業 | ポジション | 状態 | 難易度 |
|------|-----------|------|--------|
| Jurin AI | Marketing Intern | Active | 超高（Native英語+Business日本語+35-40h）|
| Jurin AI | Operations/Sales Intern | Active | 高（Business日本語+35-40h）|
| Jurin AI | Engineering Internship | Active | 超高（AI/ML+Business日本語+35-40h）|
| BLUED Inc. | English Consulting | Active | 低（No Exp OK、15h）|
| BLUED Inc. | Global Web Marketing | Active | 低（No Exp OK、15h）|
| BLUED Inc. | Video Media Marketing | Active | 低（No Exp OK、15h）|
| GlobalDeal | Growth Marketing Explorer | Active | 中（英語重視、日本語不要、15h+）|
| SORA Technology | Business Development | Active | 高（Business日英両方）|
| Nagareyama LEAD | Content Creator | Active | 低〜中 |
| Nagareyama LEAD | Process and Standardization | Active | 低〜中 |
| Jinomi株式会社 | Creative Internship | Active | 中（Native日本語必要）|
| Reiwa Pharmaceuticals | Marketing Internship | Active | 中 |
| I&N Recruitment | Internship for Recruitment | Active | 低（No Exp OK）|
| Amon Technologies | Marketing Head | Active | 中 |
| Nagareyama LEAD | Web & Gamification | **Not Active** | 中 |
| CallButler | Creative (Content) | **Not Active** | 中 |

---

## 学生ペルソナサマリー（約50名以上分析済み）

- **英語**: 80%以上がBusiness〜Native Level（強み）
- **日本語**: 80%以上がN3-N5（初級）← 弱点
- **専攻**: 70%以上がビジネス・経済・リベラルアーツ系
- **ハードスキル**: 大多数は乏しい（興味ベース）
- **テック系学生（5〜8名）**: AI/ML・プログラミングスキルあり

### Jurin AI向け推薦候補（要アクション）
| 学生名 | 大学 | スキル | 推薦ポジション |
|--------|------|--------|--------------|
| Nam Pham | 東京大学 CS | Python, React, LLMs, AI, コンテンツ制作（30Mビュー）| Engineering / Marketing |
| Physiwell Maume | Keio | Scala, Python, Spark, データエンジニア（Deutsche Bank）, AI研究 | Engineering |
| Pavit Kaur | 東工大 | LLM, MySQL, chatbot, API開発 | Engineering |
| Janine Vistro | Waseda MBA | MBA, プロジェクト管理, コンサル経験 | Operations/Sales |
| Ronaldo Keng | UNSW | Antler Singapore経験, Series A スタートアップ営業 | Operations/Sales |

---

## 決定した優先順位（IBプロジェクト）

| 優先度 | タスク | 担当部署 | ステータス |
|--------|--------|---------|-----------|
| ①最優先 | Jurin AI向け学生5名を直接推薦 | 営業 + 人事 | **未着手** |
| ②高 | BLUED Inc.向けLINE配信文作成 | 秘書室 | **未着手** |
| ③高 | 新規企業開拓（英語重視・15-25h・No Exp系）| 営業 + リサーチ | **未着手** |
| ④中 | 応募前スクリーニング仕組み化 | 人事 | **未着手** |

---

## 次回セッション開始時の秘書への指示

次回 `/company` で起動したら、以下を確認すること：
1. このファイル（notes/2026-03-10-session-summary.md）を読む
2. `pm/projects/ib-overall.md` で全体進捗を確認
3. `research/topics/matching-bottleneck-analysis.md` で分析結果を確認
4. `research/topics/student-persona.md` で学生ペルソナを確認
5. 優先順位①〜④のどこから動かすかをオーナーに確認する
