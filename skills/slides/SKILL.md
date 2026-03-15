---
name: slides
description: Googleスライド（PPTX）を自動生成するスキル。ブランドデザインに沿った48種のレイアウトを使い、テーマを伝えるだけでスライドを生成できる。「スライドを作って」「資料を作りたい」「プレゼン作成」「PPTX」「Google Slides」と言われたら即座に使用する。
---

# スライド自動生成スキル

このスキルが存在するディレクトリ: `~/.claude/skills/slides/`（以降 `SKILL_DIR` と呼ぶ）

## 使い方

```
ユーザーがテーマ・内容を伝える
        ↓
Claude がスライド構成を提案（承認を取る）
        ↓
deckDef JSON を生成して deck.json に保存
        ↓
node generate.js deck.json "ファイル名"
        ↓
.pptx 生成 → Google Drive にアップ（任意）
```

---

## Step 1: スライド構成の提案

ユーザーの意図を確認し、以下の表形式で構成案を提示する。承認後に次のステップへ進む。

```
| # | スライドタイプ | タイトル       | レイアウト         |
|---|--------------|--------------|-----------------|
| 1 | cover        | JVA IB紹介    | -               |
| 2 | section      | 事業概要       | -               |
| 3 | content      | 現状KPI        | kpi-three-col   |
| 4 | content      | 課題と解決策   | before-after-split |
| 5 | ending       | -             | -               |
```

## Step 2: JSON 生成

`SKILL_DIR/deck.json` に保存する。構造：

```json
{
  "author": "JVA",
  "slides": [
    {
      "type": "cover",
      "title": "JVA IB プラットフォーム",
      "subtitle": "2026年 事業説明資料",
      "catchphrase": "学生とスタートアップをつなぐ"
    },
    {
      "type": "section",
      "title": "事業概要"
    },
    {
      "type": "content",
      "sectionName": "事業概要",
      "title": "現状KPI",
      "layout": "kpi-three-col",
      "content": {
        "items": [
          { "value": "46名", "label": "学生LINE登録" },
          { "value": "7社", "label": "掲載企業" },
          { "value": "15件", "label": "応募数" }
        ]
      }
    },
    {
      "type": "ending",
      "message": "ご清聴ありがとうございました",
      "contact": "contact@jva.jp"
    }
  ]
}
```

## Step 3: 生成

```bash
cd SKILL_DIR
npm install  # 初回のみ
node generate.js deck.json "出力ファイル名"
```

## Step 4: 品質チェック

```bash
node validate-slide.js deck.json
```

問題があれば JSON を修正して再実行する。

## Step 5: Google Drive アップロード（任意）

```bash
# 初回のみ認証
node auth-drive.js

# アップロード
node upload-to-drive.js "出力ファイル名.pptx"
```

---

## スライドタイプ

| type | 説明 | 必須フィールド |
|------|------|------------|
| `cover` | 表紙 | `title` |
| `section` | セクション区切り | `title` |
| `content` | コンテンツ | `title`, `layout`, `content` |
| `case-study` | ケーススタディ（content と同じ） | `title`, `layout`, `content` |
| `ending` | 終了 | `message` |

---

## 主要レイアウト一覧

### データ・KPI系
| レイアウト | 用途 |
|-----------|------|
| `kpi-three-col` | 3つのKPI数値を大きく表示 |
| `text-data-emphasis` | テキスト＋大きな数字を並列表示 |
| `horizontal-bar-ranking` | 横棒グラフランキング（最大8項目） |
| `stacked-bar-chart` | 積み上げ棒グラフ |
| `pie-chart-highlight` | 円グラフ＋強調数値 |
| `doughnut-three-col` | ドーナツチャート3列 |
| `two-col-text-chart` | 左テキスト＋右グラフ |

### フロー・プロセス系
| レイアウト | 用途 |
|-----------|------|
| `step-flow` | 横フロー（最大6ステップ） |
| `three-step-column` | 番号付き3〜4列ステップ |
| `numbered-feature-cards` | 番号付きカード（最大4枚） |
| `step-up` | 階段状グラフ（成長表現） |
| `cycle` | サイクル図（PDCA等） |
| `funnel` | ファネル図 |
| `pyramid` | ピラミッド図 |

### 比較・分析系
| レイアウト | 用途 |
|-----------|------|
| `before-after-split` | Before/After 2分割 |
| `comparison-table` | 比較表 |
| `matrix-quadrant` | 2×2マトリクス |
| `venn-diagram` | ベン図（2〜3円） |
| `business-concept` | 概念×概念（A×B） |

### 構造・関係性系
| レイアウト | 用途 |
|-----------|------|
| `radial-spread` | 放射状（中心から広がる） |
| `convergence` | 収束型（複数→1点） |
| `three-way-relation` | 3点関係図 |
| `kpi-logic-tree` | ロジックツリー |
| `kpi-formula` | 数式（KPIの分解） |
| `containment` | 包含関係 |

### テキスト・リスト系
| レイアウト | 用途 |
|-----------|------|
| `three-column` | 3列テキスト |
| `qa-grid` | Q&A 2×2グリッド |
| `quote` | 引用・証言 |
| `year-list` | 年表（最大6行） |
| `timeline` | 横タイムライン |
| `vertical-timeline` | 縦タイムライン（左右交互） |
| `before-after-split` | Before/After |

### テーブル系
| レイアウト | 用途 |
|-----------|------|
| `pricing-table` | 料金表・機能比較 |
| `schedule-list` | スケジュール一覧 |
| `checklist-table` | チェックリスト |

### 人物・組織系
| レイアウト | 用途 |
|-----------|------|
| `ceo-message` | 代表メッセージ |
| `member-grid` | メンバー紹介（2×2） |
| `member-three-col` | メンバー紹介（3列） |
| `logo-wall` | ロゴ一覧（実績等） |

### その他
| レイアウト | 用途 |
|-----------|------|
| `fullscreen-photo` | フルスクリーン画像＋テキスト |
| `awards-parallel` | 実績・受賞（最大4件） |
| `user-pain-points` | ユーザー課題放射状 |
| `tam-concentric` | TAM/SAM/SOM 同心円 |
| `tam-parallel` | 市場規模並列 |
| `channel-mapping` | チャネルマッピング |
| `chat-dialogue` | 対話形式 |
| `case-two-col` | ケーススタディ詳細 |

---

## デザイン原則（2026-03-13 確立）

> このセクションはユーザーフィードバックから抽象化した再現可能な設計ルール。
> JSON生成・レイアウト修正の際は必ずここを参照する。

### 1. セーフエリア

| 軸 | 安全範囲 | 注意 |
|----|---------|------|
| 横 | `x = 0.2 〜 9.6"` | スライド幅10"。左右0.2"のマージンを守る |
| 縦 | `y = 1.15 〜 5.05"` | タイトルバー（〜1.1"）とフッター（5.1"〜）を避ける |

### 2. 放射系レイアウト（convergence / user-pain-points）

**重なり防止の計算式:**
```
cy（中心Y） = 3.2〜3.3  ← 3.0以下にしない（上端が title に被る）
r（半径）   = 1.6〜1.8
ボックス半幅 < r - 中心楕円半幅  ← 必ずこれを満たす
```

| パラメータ | 推奨値 |
|-----------|--------|
| 中心 `cy` | 3.25〜3.3 |
| 半径 `r` | 1.6〜1.8 |
| ボックス幅 | 2.0"（半幅1.0") |
| 中心楕円幅 | 1.0"（半幅0.5"） |
| 隙間 | `r - ボックス半幅 - 楕円半幅 ≥ 0.1"` を確認 |

### 3. テキスト階層（視線の優先順位）

| レベル | 役割 | スタイル |
|--------|------|---------|
| スライドタイトル | 最大見出し | 大・太字・黒（generate.js が自動付与） |
| `heading`（レイアウト内） | 補足ラベル | **小（11px）・赤・大文字** → タイトルと明確に差別化 |
| 本文 / bullets | 詳細 | **13〜14px・左揃え** |

```js
// heading の正しい実装例
slide.addText(content.heading.toUpperCase(), {
  fontSize: 11, color: COLORS.brandRed, bold: true,  // 赤・小・大文字
});
// body の正しい実装例
slide.addText("...", {
  fontSize: 13, align: "left",  // 左揃え・大きめ
});
```

### 4. 箇条書き優先

- `body` 文字列に `\n\n` を使わない → **`bullets[]` 配列を使う**
- 各 bullet を `•  テキスト` で等間隔に並べ、divider 線で区切る
- 行高 = `totalH / bullets.length`（動的計算）で下スペースを残さない

```json
// NG
"body": "ポイント1\n\nポイント2\n\nポイント3"

// OK
"bullets": ["ポイント1", "ポイント2", "ポイント3"]
```

対応レイアウト（`bullets[]` を受け付ける）: `three-column`, `funnel`

### 5. 垂直スペースを埋める

```js
const topY = 1.15, bottomY = 5.05;
const totalH = bottomY - topY;            // 3.9"
const itemH = totalH / items.length;      // 均等分割
const boxH  = Math.min(itemH * 0.85, 0.6); // 余白込み
```

- 固定の `h: 2.8` や `h: 3.0` を使わない
- アイテム数が変わっても自動的にスペースを埋める

### 6. ツリー・ロジック系（kpi-logic-tree）

```
横幅の配置（10"スライド）:
  Root    : x=0.2,  w=2.0  → 右端 2.2"
  Branch  : x=3.3,  w=2.4  → 右端 5.7"
  Leaf    : x=6.7,  w=2.9  → 右端 9.6"   ← 葉ノードに最大幅を

  connector mid1 = (2.2 + 3.3) / 2 = 2.75"
  connector mid2 = (5.7 + 6.7) / 2 = 6.2"
```

- 斜め線ではなく**直角コネクタ**（横→縦→横の3線）
- 縦分布: `totalLeaves = 全childの合計` で `topY〜bottomY` を均等割り

### 7. 正しいフィールド名チェックリスト

JSONを書く前に必ずこのフィールド名を使う:

| レイアウト | フィールド名 |
|-----------|------------|
| `three-column` | `columns[].heading` / `columns[].body` / `columns[].bullets[]` |
| `funnel` | `steps[].label` / `heading` / `bullets[]` |
| `user-pain-points` | `painPoints[]`（文字列配列） / `personLabel` |
| `convergence` | `target.label` / `items[].label` |
| `comparison-table` | `rows[].category` / `rows[].before` / `rows[].after` / `beforeTitle` / `afterTitle` |
| `numbered-feature-cards` | `items[].title` / `items[].description` |
| `kpi-logic-tree` | `root.label` / `branches[].label` / `branches[].children[].label` |
| `timeline` | `items[].date` / `items[].title` / `items[].description` ※`events[]`は非推奨 |
| `schedule-list` | `items[].time` / `items[].title` / `items[].description`（最大7行、英語ヘッダー自動） |
| `three-step-column` | `steps[].title` / `steps[].description`（最大4列、縦方向はセーフエリア全体に自動分布）|
| `business-concept` | `left.label` / `left.description` / `right.label` / `right.description` / `center.label` / `center.description`（`a`/`b`も可） |

---

## ブランドカスタマイズ

`SKILL_DIR/shared.js` の COLORS と FONTS を編集する。

**変えるだけで見た目が変わる2箇所:**
- `COLORS.brandSkyBlue` / `COLORS.brandBlue` — メインカラー
- `FONTS.heading` / `FONTS.body` — フォント（Google Fonts 必須）

**背景画像を使う場合:** `SKILL_DIR/assets/` に PNG を追加（10"×5.625"、16:9）

---

## 注意事項

- `npm install` は `SKILL_DIR` で実行すること（pptxgenjs, googleapis が必要）
- Google Fonts 非収録フォント（游ゴシック、ヒラギノ等）は使わない
- assets 画像は PNG 形式推奨
- 既存の deck.json を上書きせず、別名で保存すること（履歴保持のため）
