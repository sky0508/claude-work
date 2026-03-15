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
