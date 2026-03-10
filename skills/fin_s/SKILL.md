---
name: fin_s
description: セッション終了コマンド。作業内容を自動仕分け保存し、ナレッジを適切な場所に蓄積する。/fin_s と呼ばれたら即座に実行する。
---

# /fin_s — セッション終了 & 自動ナレッジ仕分けシステム

## 概要

4つのことを行う:
1. **今セッションの内容を自動分類** → 仕分けルールに従い適切なファイルへ保存
2. **セッションログを2箇所に生成** → カンパニー固有 + 個人レベル
3. **短いヒアリング（2問以内）** → AIの使い勝手・作業傾向を学習
4. **永続コンテキストを更新** → 次回から即使える状態に

---

## ディレクトリ構造と仕分けルール

### 個人レベル（`~/.company_personal/`）
**ここに置くもの: カンパニーに関係なく自分に紐づくもの**

| 保存先ファイル | 内容の種類 | 判断基準 |
|-------------|----------|---------|
| `context/ai-preferences.md` | AIへの要望・フィードバック | 「AIにこうしてほしい」という発言 |
| `context/owner-profile.md` | 作業スタイル・好み・性格 | 自分の働き方・考え方に関する発見 |
| `context/work-knowledge/writing.md` | ライティングナレッジ | 文章作成・コンテンツ系の作業をした時 |
| `context/work-knowledge/research.md` | リサーチナレッジ | 調査・分析系の作業をした時 |
| `context/work-knowledge/sales.md` | 営業ナレッジ | 営業・提案系の作業をした時 |
| `context/work-knowledge/strategy.md` | 戦略・企画ナレッジ | 戦略立案・企画系の作業をした時 |
| `tasks/recurring.md` | 定期タスク | 「毎週〜する」「定期的に〜する」系 |
| `tasks/backlog.md` | 汎用バックログ | 複数カンパニーにまたがるタスク |
| `secretary/sessions/YYYY-MM-DD.md` | 個人セッションログ | 毎回作成（全カンパニーの俯瞰） |

### カンパニーレベル（`.company_jva/` 等）
**ここに置くもの: そのカンパニー固有の業務情報**

| 保存先 | 内容の種類 | 判断基準 |
|--------|----------|---------|
| `pm/projects/` | プロジェクト進捗 | 「プロジェクト名 + 進捗・変更」 |
| `research/topics/` | 調査・分析結果 | 「〇〇について調べた・分析した」 |
| `sales/clients/` | クライアント情報 | 「企業名 + コミュニケーション・状況」 |
| `hr/hiring/` | 採用・候補者情報 | 「学生・候補者 + ステータス変化」 |
| `secretary/sessions/` | カンパニーセッションログ | 毎回作成 |
| `secretary/todos/YYYY-MM-DD.md` | 日次TODO | 当日のタスク追記 |
| `secretary/notes/` | 壁打ち・決定事項 | 重要な議論・決定があった時 |
| `ceo/decisions/` | 意思決定ログ | 方向性の変更・重要な判断 |

---

## 実行フロー

### Step 1: カンパニー特定（Automatic）

```bash
ls -d .company_* 2>/dev/null
```

- 1つ → そのカンパニー対象
- 複数 → AskUserQuestion で選択
- なし → 個人レベルのみ

### Step 2: コンテキスト収集（Automatic）

以下を読み込む:
```
~/.company_personal/context/owner-profile.md   （ヒアリング済みリスト確認）
{company_dir}/CLAUDE.md
{company_dir}/secretary/todos/TODAY.md
{company_dir}/pm/projects/*.md
```

### Step 3: 自動仕分け & ファイル更新（Automatic）

今セッションの会話内容を以下の仕分けルールで分類し、各ファイルへ**追記**する:

#### 仕分け判定フロー

```
この情報は...
│
├─ AIへの要望・不満・希望？
│   → ~/.company_personal/context/ai-preferences.md に追記
│
├─ 自分の作業スタイル・好みの発見？
│   → ~/.company_personal/context/owner-profile.md に追記
│
├─ 特定作業タイプのナレッジ（ライティング/分析/営業等）？
│   → ~/.company_personal/context/work-knowledge/{type}.md に追記
│
├─ 定期的に繰り返すタスク・習慣？
│   → ~/.company_personal/tasks/recurring.md に追記
│
├─ カンパニーをまたぐタスク・アイデア？
│   → ~/.company_personal/tasks/backlog.md に追記
│
└─ カンパニー固有の業務情報？
    ├─ プロジェクト進捗変化 → pm/projects/ を更新
    ├─ 新しい調査・分析 → research/topics/ に追記
    ├─ クライアント情報変化 → sales/clients/ を更新
    ├─ 採用・学生情報 → hr/hiring/ を更新
    └─ 重要な決定事項 → ceo/decisions/ に追記
```

#### 更新ルール（厳守）

- **既存ファイルは上書き禁止。追記のみ。**
- 追記する際は `### YYYY-MM-DD 追記` のセクションを作って末尾に追加
- 「新情報なし」の場合はそのファイルをスキップ（空追記しない）
- タスクは完了したものを `[x]` に更新し、新規を `[ ]` で追加

### Step 4: セッションログ生成（Automatic）

**① カンパニーセッションログ**: `{company_dir}/secretary/sessions/YYYY-MM-DD.md`

```markdown
# セッションログ: YYYY-MM-DD [カンパニー名]

## 今日やったこと
- （箇条書き、会話から自動抽出）

## 完了タスク
- [x] ...

## 未完了・持ち越し
- [ ] ...

## 更新したファイル
- （更新したファイルパス一覧）

## 重要な決定・発見
- （インサイト）

## 次回の推奨アクション（優先順）
1.
2.
3.
```

**② 個人セッションログ**: `~/.company_personal/secretary/sessions/YYYY-MM-DD.md`

```markdown
# 個人セッションログ: YYYY-MM-DD

## 活動カンパニー: {name}

## 今日の主な成果（1-2行）

## 全カンパニー現在地
| カンパニー | 最優先タスク | ステータス |
|----------|-----------|---------|
| JVA      |           |         |

## 個人レベル更新事項
- ai-preferences: （更新した場合のみ記載）
- owner-profile: （更新した場合のみ記載）
- work-knowledge: （更新した場合のみ記載）
- tasks: （更新した場合のみ記載）
```

### Step 5: ヒアリング（Interactive）

`AskUserQuestion` で **最大2問**。

`~/.company_personal/context/owner-profile.md` の「ヒアリング済みリスト」を確認し、まだ聞いていない質問のみ選ぶ。

#### 質問プール

| カテゴリ | 質問 | 保存先 |
|---------|------|--------|
| AIスタイル | 「説明の長さ・深さ、今日はどうでしたか？」 | ai-preferences |
| AIスタイル | 「AIに任せたい vs 自分で決めたいこと、どんな基準がありますか？」 | ai-preferences |
| AIスタイル | 「今日の作業で、AIにもっとこうしてほしかった場面はありますか？」 | ai-preferences |
| 作業スタイル | 「タスクの優先順位をつける時、どんな基準を使いますか？」 | owner-profile |
| 作業スタイル | 「今日の作業リズムやテンポ、ちょうどよかったですか？」 | owner-profile |
| 組織拡張 | 「このAI組織に今後やってほしいことで、まだできていないことは？」 | ai-preferences |

**ルール:**
- 1セッションで2問以内
- ヒアリング済み質問は絶対に繰り返さない
- 回答を受けたら即座に適切なファイルに追記
- ヒアリング済みリストを更新する

### Step 6: 完了サマリー表示（Automatic）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  セッション終了 [{カンパニー名}] YYYY-MM-DD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 今日の成果:
  [1-2行サマリー]

📁 更新したファイル:
  個人レベル:
    ~/.company_personal/context/... （更新あれば）
    ~/.company_personal/tasks/...   （更新あれば）
  JVAレベル:
    .company_jva/...                （更新したファイル）

🔜 次回の推奨アクション:
  1. [最優先]
  2. [次点]

/company で再開できます。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 重要ルール（絶対守る）

1. **既存ファイルは上書き禁止** → 追記のみ
2. **ヒアリングは2問以内** → ユーザーを疲弊させない
3. **「何をしましたか？」は聞かない** → 会話から自動抽出
4. **新情報がないファイルはスキップ** → 空追記しない
5. **仕分けは自動判断** → ユーザーに「どこに保存しますか？」と聞かない
6. **`~/.company_personal/` は個人の資産** → 全カンパニーに影響するため慎重に更新
