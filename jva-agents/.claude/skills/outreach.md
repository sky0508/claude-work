# アウトリーチスキル

## 目的
ヒコザルが生成したリードリストの各企業に対して、パーソナライズされたアウトリーチメッセージを下書きし、
Google Sheets "Outreach" タブに書き込む。

## 実行手順

### Step 1: 最新リードデータの取得

SQLiteから最新の成功したlead-search実行を取得する:

```bash
sqlite3 db/jva-agents.db "
  SELECT id, started_at, output_summary
  FROM agent_runs
  WHERE agent_name='lead-search' AND status='success'
  ORDER BY started_at DESC
  LIMIT 1;
"
```

取得した `id`（run_id）を使って対応するJSONファイルを探す:

```bash
ls db/runs/lead-search_*_<run_id>.json
```

そのファイルを読み込んで `leads` 配列を取得する。

### Step 2: 既アウトリーチ企業の除外

```bash
sqlite3 db/jva-agents.db "
  SELECT company_name
  FROM outreach_logs
  WHERE status != 'skipped';
"
```

このリストに含まれる企業は今回のアウトリーチから除外する（重複送信防止）。

### Step 3: メッセージ生成

各リードに対して以下のロジックでメッセージを作成する:

#### LinkedIn接続リクエスト（`contact.linkedin` が有効な場合）

- `https://www.linkedin.com/in/...` 形式のURLがある場合のみ
- 企業ページ (`/company/`) は対象外
- **300文字以内厳守**

**テンプレート（必ず why_target の内容でカスタマイズ）:**
```
Hi [contact.name first name], [specific insight from why_target].

At JVA, we connect growth-stage startups with motivated international students from Japan's top universities (Waseda/Keio/UTokyo) — zero recruitment cost, trial format.

Worth a quick chat?
```

#### メール（`contact.email` がある場合 / LinkedInがない場合）

**件名テンプレート:**
```
[Company Name] × Global Talent from Japan's Top Universities
```

**本文テンプレート（why_target の内容で1段落目をカスタマイズ）:**
```
Hi [contact.name],

[Specific observation from why_target — e.g., "Your recent Series A and rapid international expansion" or "Your focus on AI-native hiring tools"] caught my attention.

At JVA, we partner with growth-stage startups like [Company] to provide access to motivated international students from Japan's top universities (Waseda, Keio, UTokyo) — on a trial basis with zero recruitment cost.

Happy to share what this looked like for similar-stage companies. Open to a 15-min call?

Best,
[Your name]
JVA
```

#### スキップ条件
- `contact.linkedin` も `contact.email` も空 → `status: "skipped"`, `skip_reason: "no_contact_info"`
- 既にアウトリーチ済み → `status: "skipped"`, `skip_reason: "already_contacted"`

### Step 4: 品質チェック（自己検証）

出力前に各メッセージを確認:
- [ ] `[placeholder]` 形式のテキストが残っていないか
- [ ] LinkedIn文が300文字以内か
- [ ] `why_target` の具体的な内容がメッセージに反映されているか
- [ ] 英語で書かれているか

### Step 5: JSON出力

エージェント定義の出力形式に従ってJSONを出力する。
**JSONのみを出力すること。余計な説明文は不要。**

## 出力品質基準

- `message_body` が50文字以上（LinkedIn）または100文字以上（email）
- `[placeholder]` が残っていない
- 同一企業への重複アウトリーチなし
- LinkedInメッセージは300文字以内

## 注意事項

- コンタクト情報が不完全な企業は無理に対応しない（スキップで正解）
- `why_target` が具体的でない企業はメッセージも具体性が下がる → 可能な限り企業サイトを参照して補完する
- Sheets への書き込みは run-agent.sh が自動で行うため、エージェントは JSON 出力のみでよい
