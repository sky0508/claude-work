# アウトリーチスキル

## 目的
Google Sheets の "Leads" タブを直接参照し、`outreach_status = "未完了"` のリードに対して
JVA公式テンプレートをベースにしたパーソナライズされたアウトリーチメッセージを下書きする。

---

## スプレッドシート情報

- **Spreadsheet ID**: `1zeZq2EmLd86zefxXOsKsrcv5YFfxa7Cs-eb4o2NPRSY`
- **Leads タブ**: `Leads`（ヘッダー行: 1行目、データ: 2行目以降）

### Leads タブの列構成

| 列 | フィールド名 |
|---|---|
| A | run_date |
| B | company_name |
| C | company_name_en |
| D | url |
| E | industry |
| F | stage |
| G | location |
| H | why_target |
| I | contact_name |
| J | contact_title |
| K | contact_linkedin |
| L | contact_email |
| M | source |
| N | confidence |
| O | Status |
| P | contact_status |
| Q | outreach_status |

---

## 実行手順

### Step 1: Leads タブの読み込み

Google Sheets MCP を使って Leads タブを読み込む:

```
mcp__google-sheets__get_sheet_data
  spreadsheet_id: 1zeZq2EmLd86zefxXOsKsrcv5YFfxa7Cs-eb4o2NPRSY
  sheet: Leads
```

### Step 2: 対象リードの抽出

- **必ず行番号の小さい順（上から）に処理する**（行2、行3、行4…の順）
- `outreach_status`（Q列）が `"未完了"` または空欄の行を対象とする
- `outreach_status = "完了"` の行はスキップ（既に下書き済み）

### Step 3: メッセージ生成

各対象リードについて以下のロジックで処理:

1. `contact_linkedin`（K列）に `/in/` 形式のURLがある → **LinkedIn接続リクエスト文**を生成
2. `contact_email`（L列）がある（かつLinkedInなし）→ **メール**を生成
3. 両方なし → スキップ（`skip_reason: "no_contact_info"`）

---

## テンプレート

### 【LinkedIn 接続リクエスト — EN】（300文字以内厳守）

```
Hi [FIRST_NAME]!

I'm with Japan's Venture Academy, a student startup community in Tokyo. We run a free internship board connecting global startups with top university students in Japan. We'd love to have [COMPANY_NAME] list a role. See our prospectus below!

https://tinyurl.com/jvaib2026
```

### 【LinkedIn 接続リクエスト — JP】（300文字以内厳守）

```
はじめまして！国内トップ大学のグローバル学生と東京のスタートアップをつなぐ「JVA Internship Board」を運営している佐々木と申します！ただいま先着20社限定で掲載から採用まで完全無料で提供しています。インターン採用でお役に立てるかもと思いご挨拶させていただきました！よろしくお願いいたします。
```

---

### 【メール — EN】

**件名:**
```
Internship Opportunity: [COMPANY_NAME] x JVA Internship Board
```

**本文:**
```
Hi [FIRST_NAME],

My name is Sora Sasaki, and I'm part of the Partnerships Team at Japan's Venture Academy (JVA), a student-run startup community in Tokyo backed by Shibuya Startup Support.

We run the JVA Internship Board — a free platform connecting global startups in Japan with internationally competitive students from top universities, including UTokyo, Keio, Waseda, and Tokyo Tech. Our students are English-proficient, startup-minded, and actively looking for hands-on experience.

Would [COMPANY_NAME] be open to listing an internship role? It costs nothing to get started, and we handle distribution and application routing on our end.

I've attached a short overview below. Please let me know if you'd be interested!

Best regards,
Sora Sasaki
JVA Internship Board | japansventureacademy@gmail.com
https://tinyurl.com/jvaib2026
```

---

### 【メール — JP】

**件名:**
```
【インターン掲載のご案内】[COMPANY_NAME] x JVA Internship Board
```

**本文:**
```
[FULL_NAME]様

はじめまして。Japan's Venture Academy（JVA）の佐々木と申します。渋谷区を拠点に活動する学生主導のスタートアップコミュニティで、パートナーシップを担当しております。

現在、東大・慶應・早稲田・東工大などトップ大学に在籍するグローバルな学生と、日本のスタートアップをつなぐ無料のインターンマッチングプラットフォーム「JVA Internship Board」を運営しています。英語対応可能で、実務経験に意欲的な学生が多く登録しています。

もし[COMPANY_NAME]様でインターン生の受け入れにご関心がありましたら、ぜひ一度ポジションを掲載いただけないでしょうか。掲載から採用まで全て無料でこちらでサポートさせていただいております。

よろしくお願いいたします。

佐々木 宙（Sora Sasaki）
JVA Internship Board | japansventureacademy@gmail.com
https://tinyurl.com/jvaib2026
```

---

## プレースホルダー置換ルール

| プレースホルダー | 置換する値 |
|---|---|
| `[FIRST_NAME]` | `contact_name` の名前部分（スペース前。不明なら "there" を使う） |
| `[FULL_NAME]` | `contact_name` 全体 |
| `[COMPANY_NAME]` | `company_name_en`（なければ `company_name`） |

**重要**: 出力前に全プレースホルダーが置換済みか確認すること。

---

## 言語選択ルール

**判定の優先順位（上から順に確認）:**

1. **企業のHP言語** — `url` を参照。HPが日本語主体なら JP、英語主体なら EN
2. **LinkedInプロフィール言語** — `contact_linkedin` のプロフィールや投稿の言語
3. **企業名・担当者名** — 日本語名（漢字含む）なら JP

**判断できない場合（上記で明確に判断できないとき）:**
→ **EN と JP の両方を作成する**（2件として `messages` に含める）

---

## 品質チェック（出力前に自己確認）

- [ ] `[FIRST_NAME]`、`[COMPANY_NAME]` 等が全て置換済みか
- [ ] LinkedInメッセージが300文字以内か（`len(message_body) <= 300` を必ず確認）
- [ ] 行の順番通りに処理されているか（行2→行3→行4…）
- [ ] 出力JSONの `company_name` フィールドが **Leadsシートの B列（company_name）の値と完全一致**しているか（短縮・変換不可）

---

## Step 4: JSON出力

エージェント定義の出力形式に従って**JSONのみ**を出力する。
Sheetsへの書き込みと `outreach_status` の更新は run-agent.sh が自動処理する。

---

## Step 5（任意）: LinkedIn へ実送信する場合（agent-browser MCP）

**前提**: トレーナーまたは運用ポリシーで自動送信が明示的に許可されているときのみ実施する。LinkedIn の自動化は利用規約上グレーになり得るため、頻度・本数は極小に保つ。

1. `mcp__agent-browser__navigate` — K列の `contact_linkedin`（`/in/` URL）を開く
2. `mcp__agent-browser__wait` — **2000〜3000ms**
3. `mcp__agent-browser__snapshot` — メッセージ開始ボタンの `ref`（`@e…`）を特定
4. `mcp__agent-browser__click` — メッセージ画面を開く
5. `mcp__agent-browser__wait` — **1000〜2000ms**
6. `mcp__agent-browser__snapshot` — 入力欄の `ref` を特定
7. `mcp__agent-browser__fill` — Step 3 で確定した本文（300文字以内の接続リクエスト文など）を入力
8. `mcp__agent-browser__click` または `mcp__agent-browser__press`（`Enter`）— 送信
9. 次のリードへ進む前に **さらに 1〜3秒** 空ける

UIが想定と異なる場合は送信を中止し、下書きJSONのみで完了とする。
