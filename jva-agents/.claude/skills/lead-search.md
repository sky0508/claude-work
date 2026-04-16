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

### Step 0: LinkedIn API による事前リサーチ
`scripts/linkedin-search.py` を実行し、候補企業を取得する。
```bash
python3 scripts/linkedin-search.py --keywords "Tokyo startup Series A hiring" --limit 5
```
出力された leads を Step 3 のフィルタリングにかけ、通過したものをリストに追加する。
confidence は必ず自分で調査して更新すること（デフォルト `low` のまま出力しない）。

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

#### Step 2a（任意・高精度）: agent-browser で LinkedIn を裏取り
Web検索だけでは採用状況や表記が曖昧なとき、次の順で使う:

1. `mcp__agent-browser__navigate` — 対象の LinkedIn URL（会社ページや求人にリンクが取れている場合）を開く
2. `mcp__agent-browser__wait` — **1000〜3000ms**（ページ安定化・レート配慮）
3. `mcp__agent-browser__snapshot` — アクセシビリティツリーから、企業名・業種・従業員規模・採用関連の文言を読み取る
4. 必要なら `mcp__agent-browser__click` で「See more」等を開き、再度 `snapshot`

**通常チャネル（Step 2a と併用可）:**

1. **企業HP** → 事業内容、チームサイズ、採用ページの有無
2. **PR TIMES / TechCrunch Japan** → 資金調達ニュース、成長指標
3. **LinkedIn URL 取得（会社ページ優先）**

   `contact.linkedin` には**会社ページURL（`linkedin.com/company/...`）を優先**して記載する。
   個人プロフィール（`linkedin.com/in/...`）でも可（会社URLが取得できない場合）。

   **会社ページURL取得方法:**
   - `site:linkedin.com/company "[企業名]"` で検索
   - または LinkedIn で企業名検索して会社ページのURLを取得

   **担当者を追加で探す場合（任意、時間があれば）**
   - `site:linkedin.com/in "[企業名]" "HR" OR "Talent" OR "Recruiting" OR "People"`
   - `site:linkedin.com/in "[企業名]" "CEO" OR "Founder" OR "Co-Founder"`
   - 名前だけ分かれば `contact.name` に記入してOK

   **見つからなかった場合**
   - 会社ページも個人プロフィールも取れなければ `""` のまま
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
