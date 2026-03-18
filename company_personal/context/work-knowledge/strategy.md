# 戦略・企画ナレッジ

> 戦略立案・PDCA・数値分析系の作業で得たナレッジを蓄積する。

---

## ファネル分析の型（IB事例 2026-03-11）

### 基本フレーム
```
集客（LINE追加）→ 応募（Application）→ 選考通過 → マッチング
   ↑ここは伸びてる    ↑ここは？           ↑ここが0%
```

**教訓**: KPIが「全部ダメ」ではなく「どこで詰まっているか」を特定することが先。
詰まり箇所が1つ分かれば、そこだけ集中できる。

### データ分析の手順
1. 目標値を先に把握（Settingsシート等）
2. 実績データを週次で集計
3. 週次トレンドを見て「急増・急減のイベント」を特定
4. 急増の原因を特定 → 再現性を設計する
5. ファネルの各ステップのコンバージョン率を計算
6. 最もコンバージョン率が低いステップ = ボトルネック

---

## GAS（Google Apps Script）API 連携パターン

### JVA KPI GAS の仕様（2026-03-11確認）

```
GET  → 00_Settings のみ返す（目標値取得）
POST → 302リダイレクト → Locationヘッダー先をGETして結果取得

利用可能アクション:
  listSheets  → シート一覧
  appendRow   → {"sheet":"名前","row":[...]}
  updateCell  → {"sheet":"名前","row":数値,"col":数値,"value":"値"}
  updateRange → {"sheet":"名前",...}（詳細要確認）
  recordKPI   → {"week":"2026-WXX",...}（内部仕様不明）

読み取りAPIは存在しない → ローカルmdファイルをミラーとして管理
```

### curlでPOST→リダイレクト処理する型
```bash
LOC=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"...","token":"..."}' \
  -w "%{redirect_url}" -o /dev/null)
curl -sL "$LOC"
```

---

## LINEデータ分析（CSV）

### LINE公式アカウントのCSV形式
```
date, contacts, targetReaches, blocks
YYYYMMDD, 累計友達数, リーチ可能数, ブロック数
```

- `contacts` は**累計値**なので、週次追加数は前週末との差分を計算する
- ブロック数が0 = まだブロックされていない = 健全な状態

### 週次集計コード（Python）
```python
def get_week(row):
    d = datetime.strptime(row['date'], '%Y%m%d')
    return d.isocalendar()[:2]  # (year, week_num)

weekly = {}
for row in rows:
    yw = get_week(row)
    if yw not in weekly:
        weekly[yw] = {'start': int(row['contacts']), ...}
    else:
        weekly[yw]['end'] = int(row['contacts'])

# 前週末比で追加数計算
prev_end = initial_value
for yw in sorted(weekly.keys()):
    added = weekly[yw]['end'] - prev_end
    prev_end = weekly[yw]['end']
```

---

## タスク管理の2層構造設計（2026-03-12）

### 採用した設計パターン

```
[AI参照・管理層]                    [ユーザー確認層]
company_*/secretary/backlog.md  →  tasks/backlog.md（統合ビュー）
company_*/secretary/todos/      →  tasks/today.md（今日のタスク）
```

**なぜ2層か**: AIが参照するファイルは細かいメタデータや管理情報が多い。
ユーザーが見るファイルはシンプルな表形式で十分 → 目的が違うので分ける。

### 4象限管理の定義

| 象限 | 緊急度 | 重要度 | 対応方針 |
|------|-------|-------|---------|
| Q1 | 高 | 高 | 今日〜2日以内に着手（Must） |
| Q2 | 低 | 高 | 今週〜来週に計画・着手（Should） |
| Q3 | 高 | 低 | 素早く片付ける（Minimize） |
| Q4 | 低 | 低 | 後回し・削除検討（Eliminate） |

### 今日のタスク選定ロジック

1. Q1を全件Must入り
2. カレンダーの「準備必要な予定」→ Q1扱いで追加
3. 今日締め切りのQ2 → Mustに追加
4. 空き時間があればQ2を最大2件Should追加
5. Mustは**最大4件**に絞る

---

## SNS → KPI 因果関係の発見手法

1. 日次データで「急増日」を特定
2. 急増日の前後1〜2日に何をしたか確認（SNS投稿・イベント・紹介等）
3. 因果関係が疑われたら「投稿内容・時間帯・リーチ数」を記録
4. 次回同様の施策時に意図的に実施 → 効果を測定

**IB事例**: LinkedIn投稿（2/15〜16頃）→ W08+16名、W09+14名
1投稿で約15〜20名のLINE追加。月2回投稿で月次目標達成可能。

---

## プレゼン資料のブランド設計（2026-03-12）

### PDFからブランド抽出するパターン
```bash
pip3 install pymupdf pillow
```
```python
import fitz  # PyMuPDF
doc = fitz.open('brand.pdf')
page = doc[0]
pix = page.get_pixmap(dpi=120)
# ピクセルサンプリングで主要色を抽出（白・黒・グレー除外）
```

### JVA スライドブランド定数（確定版）
| 要素 | 値 |
|------|-----|
| プライマリレッド | `#BE1229` |
| ダークレッド | `#8C0D1E` |
| IBパープル | `#6251D0` |
| 背景（ダーク） | `#1A0508` |
| タイトルフォント | Montserrat Bold |
| 本文フォント | Lato Regular |
| ロゴ位置 | 右上（カバー・セクション・エンディング）|
| アクセントライン | 下部 `#BE1229` 帯（高さ 0.175 inch）|

### スライド種別とデザインの対応
| スライド種別 | 背景 | ロゴ |
|------------|------|------|
| カバー | 黒→ダークレッドグラデーション | 右上白 |
| セクション | ダークレッド→黒グラデーション | 右上白 |
| コンテンツ | オフホワイト | ダーク背景右下 |
| エンディング | 黒→ダーク紫グラデーション | 右上白 |

---

## スライドレイアウト設計原則（2026-03-13 確立）

### セーフエリア（絶対守る）
| 軸 | 安全範囲 |
|----|---------|
| 横 | `x = 0.2 〜 9.6"` |
| 縦 | `y = 1.15 〜 5.05"` |

### 視線の階層設計
- **スライドタイトル**: 大・太字・黒（最上位）
- **レイアウト内 heading**: `11px・赤・大文字`（補足ラベル。タイトルより明確に小さく）
- **本文 / bullets**: `13〜14px・左揃え`
- **同じサイズ・同じ色を並べない** → 視線がどこに行けばいいか分からなくなる

### 箇条書き vs 段落
- `body` に `\n\n` を使わない → **`bullets[]` 配列を使う**
- 各 bullet は等間隔で divider 線で区切る
- 行高 = `totalH / count`（動的計算）→ 下に余白を残さない

### 放射系レイアウトの重なり防止
```
cy = 3.2〜3.3（3.0以下は title に被る）
r  = 1.6〜1.8
条件: r - ボックス半幅 - 楕円半幅 ≥ 0.1"
```

### ツリー系（kpi-logic-tree）の配置設計
```
Root:   x=0.2, w=2.0  → 右端2.2"
Branch: x=3.3, w=2.4  → 右端5.7"
Leaf:   x=6.7, w=2.9  → 右端9.6"  ← 葉ノードに最大幅
縦分布: totalLeaves の総数で topY〜bottomY を均等割り
コネクタ: 直角線（横→縦→横）が斜め線より読みやすい
```

---

## オペレーション設計にロジックツリーを使うパターン（2026-03-13）

### 手順
1. まず組織が「やっていること全部」を ロジックツリー / マインドマップ形式で図解する
2. ツリーを元に「誰が何を担うか」の役割分担を設計する
3. 役割分担から「新メンバーに最初に任せるタスク」を抽出する
4. タスクは優先順位付きで箇条書き → 各タスクの流れを補足説明

**なぜ有効**: 全体像が先にあることで、「なぜこのタスクが重要か」の文脈が自然につく。
タスク単体より「ツリーの一部」として渡した方がオンボーディング精度が高い。

### IB業務ツリーの構造（確定版 2026-03-13）
```
IB Operations
├── Student Side
│   ├── Community Management（LINE通知・Q&A対応）
│   └── Student Acquisition（SNS・LinkedIn投稿）
├── Company Side
│   ├── Outreach & Onboarding（アプローチ→MTG→Job Card）
│   └── SLA管理（4営業日ルール・フォロー）
├── Matching
│   ├── Application Intake & Screening（確認Q&A分岐）
│   └── CV Forwarding & Tracking
├── Operations
│   └── KPI集計・分析・週次レポート
└── Strategy
    └── マッチング率改善・新規開拓・Instagram等
```

---

## マッチング課題の根本原因分解（IB 2026-03-13）

### 問題: マッチング 0件の根本原因3層
```
Layer 1: Location mismatch
  → 学生が海外在住 or 非東京 / 企業は東京対面を要求
Layer 2: Skill mismatch
  → 学生スペックが企業要件（特に大型スタートアップ）に届かない
Layer 3: Company non-response
  → 応募受領後の返信遅延・無返信（企業側の課題）
```

### 打ち手の設計パターン
| 課題層 | 打ち手 | ツール |
|-------|-------|-------|
| Location | Apply前確認Q&A（「東京在住？」） | Google Form |
| Skill | スクリーニング基準の明文化・フォーム分岐 | 設計ブリーフ |
| Company non-response | SLA 4営業日ルール + リマインド運用 | オンボーディングテンプレ |

**教訓**: 1つの「マッチング0」の裏に複数の独立した原因が存在する。
原因ごとに独立した打ち手を設計する → 相互依存させない。

---

### 2026-03-15 追記

## Gitワークスペース管理ナレッジ

### .gitignore の必須パターン（ワークスペース共通）
```
node_modules/
credentials.json     # OAuth認証情報（Google等）
token.json           # アクセストークン・リフレッシュトークン
*.key / *.pem        # 秘密鍵
secrets.md           # 機密メモ
```

### GitHubのSecret Scanning（Push Protection）
- GitHubはPushされたファイルにシークレットが含まれるとブロックする
- **対処手順**: `git filter-branch` で問題ファイルを履歴ごと削除 → force push
- **先手の教訓**: `.gitignore` に認証ファイルを最初から含める

### 初回GitHub同期の手順
1. `.gitignore` 整備（node_modules・認証ファイル）
2. `git rm --cached node_modules/ ...` でアンステージ
3. `git remote add origin https://github.com/...`
4. コミット → Push

---

### 2026-03-16 追記

## 組織・部門フォルダ設計パターン

### 部門フォルダの命名規則

```
dep_{部門名}/   ← 部門フォルダは dep_ プレフィックスで統一
```

- 同粒度・同階層の部門はすべて `dep_` で揃える
- 会社インフラ（secretary/ceo/config等）はトップレベルに置く
- 部門固有の業務ファイルのみ `dep_*/` に入れる

### 部門フォルダの構成パターン

```
dep_{部門名}/
├── CLAUDE.md or README.md   # 部門概要・AIへの振り分け基準（必須）
├── {業務カテゴリ}/           # 業務ごとにサブフォルダ
│   ├── pipeline.md          # パイプライン・一覧管理
│   ├── _template.md         # 繰り返し使うテンプレ
│   └── {個別ファイル}.md
├── mtg/                     # MTG管理（定例・外部問わず）
│   ├── _template.md
│   └── notes/               # 1MTG1ファイル（YYYY-MM-DD_相手名.md）
└── okr.md or team.md        # OKR・チーム構成
```

### CLAUDE.md に必ず書く内容

1. **部門ミッション**（1〜2行）
2. **フォルダ構成**（ツリー形式）
3. **各フォルダの役割**（表形式）
4. **CEOの振り分け基準**（トリガーキーワード → フォルダ）
5. **他部門との連携**（連携先・シナリオ）

### 2026-03-16 追記

## 新メンバー向けオンボーディングドキュメント設計パターン

### 構成の順序原則
```
❌ NG順: 仕組み説明 → なぜ必要か
✅ OK順: なぜ必要か（コンテキスト） → 仕組み・アプローチ
```
**理由**: 「何のために動くのか」が先にないと仕組みが空中戦になる。
特にスポンサーシップのような抽象度の高い業務では「イベントを実現するためにお金が要る」という実態コンテキストを先置きすると理解度が上がる。

### スポンサーシップ設計の原則（JVA事例）
- **per-event が基本**。組織全体・年間スポンサーは企業にとってリスクが高いため取りにくい
- 例外（Bootcamp like recurring flagship / IB platform）は明示的に「例外」として説明する
- ティア（Bronze/Silver/Gold）は「Working Draft」として出す → 聴覚MTGで市場フィードバックを得てから確定

### MTG準備の型（Partnership事例）

1. 参加者・目的を先に確定
2. 相手のバックグラウンドを考慮（例：経験者へは「一から説明」でなく「レビュー」スタンス）
3. 論点ごとに「共有する内容」と「確認したいこと（チェックボックス）」をセット
4. 時間配分をアジェンダ表で設計（60分なら5+15+20+15+5）
5. MTG後タスクを事前に書いておく（フォローアップ・DB更新等）

### 2026-03-18 追記

## Notion KPI管理DB設計パターン（JVA IB事例）

### 2DB構成の原則
```
DB1: KPI Settings（目標値）
  - 行 = KPIの種類（LINE / Application / Match / Job Card）
  - 6ヶ月目標 → 月次・週次は数式で自動計算

DB2: Weekly Flow Log（週次実績）
  - 行 = 週（Week ID）
  - 入力: 週次インクリメント（累計ではなく週ごとの増分）
  - 自動計算: 転換率（LINE→Click率 / Fill→Match率等）

連携: リレーション + ロールアップで目標値をWeekly Logに引き込む
```

### Notionチャート機能の制限（2026-03-18確認）
- **Y軸にRollupプロパティは使えない**（Number / Formulaのみ）
- **無料プランはチャート1枚のみ** / Plusプラン以上は無制限
- 使えるチャート種類: 縦棒・横棒・折れ線・ドーナツ
- Dashboard View（専用ビュー）はBusiness/Enterpriseプランのみ

### KPIダッシュボードの標準構成
```
ページ型ダッシュボード（Plusプラン向け）:
1. LINEトレンド（折れ線チャート: Week ID × Add LINE）
2. Applicationトレンド（棒グラフ: Week ID × Fill Form）
3. KPI Settingsのリンクドビュー（目標値テーブル）
4. Weekly Flow Logのリンクドビュー（最新週降順・ギャップ列付き）
```

### 2026-03-17 追記

## Welcome MTG / ビジョン共有の構成パターン（IB Trial Member事例）

### 効果的な順序
```
1. Intro（自己紹介・関係構築）
2. 経緯（なぜ今に至ったか → Phase 1→2→3のストーリー）
3. 現状（今の数字・正直な課題開示）
4. ビジョン（長期 → 中期 → 短期KPIの順で落とす）
5. How we work（ツール・リズム・フロー）
6. Q&A + やりたいこと聴取
```

**なぜ「経緯」を先に入れるか**: 文脈がないと「なぜこの数字を目指すのか」が腹落ちしない。
Phase 1→2→3のストーリーで「今が大事な転換点」を伝えると、参加者のコミットが上がる。

### ビジョンの3層構造
```
長期ビジョン（方向性）: "International studentsがインターンを探すときまずIBを開く"
  ↓
1年後目標（具体的ゴール）: 掲載100社・IBがスタンダード
  ↓
6ヶ月目標（今のKPI）: 数値目標（KPIシートから引用）
```

### 音声ヒアリング → 構造化のパターン
- 話しながら情報提供（音声入力）→ AIが構造化 → アウトライン確認 → ファイル保存
- 特に「経緯」「ビジョン」など言語化されていない情報を引き出すのに有効
- ヒアリング質問の設計: 大きい話 → 具体化 → 体験イメージの順で深掘る

### 2026-03-18 追記
#### Notion × Claude Code × Base44 統合ワークスペース設計

**設計方針:**
- Notion = 情報の全マスター（コンテキスト全振り）
- Claude Code = 重量級タスクの実行エンジン（MCP経由でNotionを読み書き）
- Base44 = モバイル秘書UI（MCP経由でNotion/Calendar/Mail横断）
- ローカルファイルは最終的にゼロへ（CLAUDE.md + skills/ のみ残す）

**ローカル↔クラウド同期の仕組み（確定）:**
- `~/.claude/CLAUDE.md` → symlink → `~/claude-workspace/CLAUDE.md`（git管理下）
- `~/.claude/settings.json` → symlink → `~/claude-workspace/settings.json`（git管理下）
- `~/.claude/skills/` → symlink → `~/claude-workspace/skills/`（既存）
- PostToolUse hook: ファイル編集 → 自動 git commit & push
- `cc` エイリアス: git pull → claude 起動

**作業ログ設計（確定）:**
- Work Log DB: 1 Project = 1エントリ（上書き型）→ AIが迷わず最新を参照
- Project page 進捗ログ: 現在の状態を上書き（Notion AI 用コンテキスト）
- Session Log は作らない（Work Log DBに一本化）
- Notion AI 側は「保存して」スキルで同じWork Log DBに書き込む
