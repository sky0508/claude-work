# アウトリーチスキル

## 目的
ヒコザルが生成したリードリストの各企業に対して、JVA公式テンプレートをベースにした
パーソナライズされたアウトリーチメッセージを下書きし、JSON形式で出力する。

---

## 実行手順

### Step 1: 最新リードデータの取得

```bash
sqlite3 db/jva-agents.db "
  SELECT id, started_at
  FROM agent_runs
  WHERE agent_name='lead-search' AND status='success'
  ORDER BY started_at DESC
  LIMIT 1;
"
```

取得した `id`（run_id）に対応するJSONファイルを読み込む:

```bash
ls db/runs/lead-search_*_<run_id>.json
```

### Step 2: 既アウトリーチ企業の確認

```bash
sqlite3 db/jva-agents.db "
  SELECT company_name FROM outreach_logs WHERE status != 'skipped';
"
```

このリストに含まれる企業は今回スキップ（`skip_reason: "already_contacted"`）。

### Step 3: メッセージ生成

各リードを以下のロジックで処理:

1. `contact.linkedin` に `/in/` 形式のURLがある → **LinkedIn接続リクエスト文**を生成
2. `contact.email` がある（LinkedInがない場合）→ **メール**を生成
3. 両方なし → スキップ（`skip_reason: "no_contact_info"`）

---

## テンプレート

### 【LinkedIn 接続リクエスト — EN】（300文字以内厳守）

```
Hi [FIRST_NAME]!

I'm with Japan's Venture Academy, a student startup community in Tokyo. We run a free internship board connecting global startups with top university students in Japan. We'd love to have [COMPANY_NAME] list a role. I've linked our prospectus below. Hope to hear from you!

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
| `[FIRST_NAME]` | `contact.name` の名前部分（スペース前の部分。不明なら "there" を使う） |
| `[FULL_NAME]` | `contact.name` 全体 |
| `[COMPANY_NAME]` | `company_name_en`（なければ `company_name`） |

**重要**: 置換後にプレースホルダーが残っていないことを必ず確認する。

---

## 言語選択ルール

**判定の優先順位（上から順に確認）:**

1. **企業のHP言語** — リードの `url` を参照。HPが日本語主体なら JP、英語主体なら EN
2. **LinkedIn投稿言語** — `contact.linkedin` があれば、そのプロフィールや投稿の言語を参考にする
3. **企業名・担当者名** — 日本語名（漢字含む）なら JP

**判断できない場合（上記で明確に判断できないとき）:**
→ **EN と JP の両方を作成する**（メールなら件名・本文を2パターン、LinkedInなら2種類の文章を出力）

その場合、出力は `language: "en"` と `language: "jp"` の2件として records に含める。

---

## 品質チェック（出力前に自己確認）

- [ ] `[FIRST_NAME]`、`[COMPANY_NAME]` 等のプレースホルダーが全て置換済みか
- [ ] LinkedInメッセージが300文字以内か
- [ ] why_target の内容をメッセージで活かせているか（特にメールの場合）
- [ ] 企業名・担当者名が正確か

---

## Step 4: JSON出力

エージェント定義の出力形式に従ってJSONのみを出力する。
Sheetsへの書き込みは run-agent.sh が自動処理するため、エージェントはJSONだけでよい。
