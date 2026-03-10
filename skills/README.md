# Skills Hub — コマンド管理ハブ

> Claude Code のユーザーレベルスキル一覧。
> 新しいスキルを追加する場合は `~/.claude/skills/{skill-name}/SKILL.md` に配置する。
> Claude Code を再起動すると自動で認識される。

---

## 登録済みスキル一覧

| コマンド | ファイル | 用途 | 種類 |
|---------|---------|------|------|
| `/fin_s` | `fin_s/SKILL.md` | セッション終了・自動ナレッジ仕分け | セッション管理 |
| `/weekly_review` | `weekly_review/SKILL.md` | 週次レビュー自動生成 | 定期実行 |
| `/morning` | `morning/SKILL.md` | 朝のブリーフィング・今日の優先確認 | 定期実行 |

> プラグイン系（/company など）は `~/.claude/plugins/` で管理される。

---

## 新しいスキルの追加手順

```bash
# 1. ディレクトリ作成
mkdir -p ~/.claude/skills/{skill-name}

# 2. SKILL.md を作成
# frontmatter 必須:
# ---
# name: skill-name
# description: 何をするスキルか（Claude が自動判断に使う）
# ---

# 3. Claude Code を再起動 → 自動認識
```

---

## 定期実行スキルの運用

### セッション内の定期実行（CronCreate）
Claude Code のセッション中に定期実行できる（セッション終了で消える・最大3日）:
- 使用例: 作業中に「1時間後に進捗確認して」など
- 設定方法: 会話中に「X時間ごとに〇〇して」と伝える

### 真の定期実行（システム cron）
毎日・毎週の自動実行は `crontab -e` でシステム cron に登録する:
```cron
# 毎週月曜 9:00 に週次レビューリマインダー
0 9 * * 1 claude -p "/weekly_review" --cwd /path/to/project
```

---

## スキル設計メモ（次に作るもの）

| アイデア | 用途 | 優先度 |
|---------|------|--------|
| `/ib_kpi` | IBのKPI数値を入力してPDCA分析 | 高 |
| `/new_company` | 新しいカンパニー（.company_x）をセットアップ | 中 |
| `/outreach` | 営業メール・提案文の自動生成 | 中 |
| `/match` | 学生と企業のマッチング候補を提案 | 中 |
