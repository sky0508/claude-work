# リード検索スキル

## 目的
JVA（Japan's Venture Academy）のターゲット企業を自動検索し、構造化されたリードリストを生成する。

## JVA バリュープロポジション（企業向け）
```
Core VP: Cost-efficient access to motivated international students
         from Japan's top universities.

差別化ポイント:
1. コスト効率: 採用コストゼロ・トライアル形式
2. グローバル人材: 日本語+英語+専門性を持つインターナショナル学生
3. 品質フィルター: JVAが事前審査した学生のみ掲載
```

## ターゲット企業プロフィール

### 主要ターゲット
- 東京ベースの成長期スタートアップ（シリーズA〜B）
- テック・フィンテック・HR・SaaS等（業界問わず）
- 英語対応可能
- 成長投資に積極的でインターン受け入れポテンシャルあり

### サブターゲット
- 日本進出中または進出検討中の海外企業
- 日本で人材を探しているグローバル企業の日本拠点

### 除外条件
- 大企業の子会社（意思決定が遅く合わない）
- 休眠企業・採用凍結中の企業
- 従業員1名以下の個人事業

## 検索手順

### Step 1: Web検索によるリサーチ
以下のクエリパターンでWeb検索を実行する:

- `Tokyo startup Series A 2025 2026 hiring`
- `東京 スタートアップ 資金調達 2025 2026`
- `Japan startup funding round 2025 2026`
- `foreign company entering Japan market 2025 2026`
- `東京 外資系 スタートアップ 新規進出`

各検索で上位結果を確認し、条件に合う企業を抽出する。

### Step 2: 企業情報の収集
各候補企業について以下を調査:

1. **企業HP** → 事業内容、チームサイズ、採用ページの有無
2. **PR TIMES / TechCrunch Japan** → 資金調達ニュース、成長指標
3. **LinkedIn 担当者検索（個人プロフィール必須）**

   `contact.linkedin` には必ず `linkedin.com/in/...` の個人URLを入れること。
   `linkedin.com/company/...` は**絶対に使わない**。

   以下の順で検索する：

   **Step A — HR担当者を探す（最優先）**
   - `site:linkedin.com/in "[企業名]" "HR" OR "Talent" OR "Recruiting" OR "People"`
   - `site:linkedin.com/in "[英語企業名]" "Head of HR" OR "Chief People Officer" OR "Talent Acquisition"`

   **Step B — CEO/Founderにフォールバック**（Step Aで見つからない場合のみ）
   - `site:linkedin.com/in "[企業名]" "CEO" OR "Founder" OR "Co-Founder"`
   - 資金調達ニュース（PR TIMES / TechCrunch）の記事内に LinkedInリンクが掲載されていることも多い

   **Step C — 企業サイトのAbout/Teamページを確認**
   - 企業HPの `/team`, `/about`, `/company` ページに担当者のLinkedInリンクが載っていることがある
   - 名前だけ分かった場合は `site:linkedin.com/in "[氏名]" "[企業名]"` で検索

   **見つからなかった場合**
   - `contact.linkedin` は `""` のまま（企業ページURLを絶対に入れない）
   - 名前だけ分かれば `contact.name` に記入してOK
4. **Crunchbase** → ファンディングラウンド、投資家情報

### Step 3: フィルタリング
以下の条件で候補をフィルタリング:

- [ ] 東京ベースまたは日本拠点あり
- [ ] 直近1年以内に資金調達またはメディア露出
- [ ] 企業HPが英語対応
- [ ] チームサイズ5名以上（インターン受け入れ体制あり）

### Step 4: 出力
フィルタリングを通過した企業を、エージェント定義の出力形式（JSON）で整形して出力する。

## 出力品質基準
- 全企業に `company_name`, `url`, `industry`, `stage` が必須
- `why_target` は具体的理由を1文以上（「良さそう」等の曖昧表現NG）
- `source` は実在するURL
- `confidence` は情報の確度に基づいて正直に設定
  - high: 公式サイト+複数ソースで確認済み
  - medium: 1ソースで確認済み
  - low: 推測を含む

## 重複チェック
過去の実行結果（SQLiteのagent_runsテーブル）に同一企業名がある場合は除外する。

## 実行制限
- 1回の実行で**最大5社**
- 条件に合う企業が5社未満の場合は、無理に数を揃えない
- 情報が不十分な企業は `confidence: low` とするか、除外する
