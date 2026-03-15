# AutoMatch Agent

「人 × 機会」を自動スコアリングするマッチングエンジン。

## 対応ユースケース

| ユースケース | 説明 |
|-------------|------|
| インターンシップマッチング | 学生 × 企業ポジション |
| 中途採用マッチング | 求職者 × 求人票 |
| メンタリング | メンティー × メンター |
| フリーランス | フリーランサー × プロジェクト |
| ボランティア | 参加者 × 団体・活動 |

設定ファイル（`match.config.json`）を差し替えるだけで、どのドメインにも対応する。

## ファイル構成

```
auto-match/
├── README.md
├── match.config.json          ← アクティブな設定（プリセットをコピーして使う）
├── data/
│   ├── candidates.json        ← 候補者データ
│   └── opportunities.json     ← 機会（求人・ポジション等）データ
├── presets/
│   ├── internship.config.json ← インターンシップ用プリセット
│   ├── fulltime.config.json   ← 中途採用用プリセット
│   └── mentoring.config.json  ← メンタリング用プリセット
└── src/
    ├── index.js               ← CLI エントリーポイント
    ├── scorer.js              ← スコアリングエンジン
    ├── matcher.js             ← マッチングロジック
    └── formatter.js           ← 出力フォーマット
```

## 使い方

```bash
# インストール
npm install

# 実行（デフォルト: Admin Mode）
node src/index.js

# 特定候補者のマッチングを見る（Student Mode）
node src/index.js --candidate "Nam Pham"

# プリセットを指定して実行
node src/index.js --preset internship

# 上位N件だけ表示
node src/index.js --top 5

# Markdownファイルに出力
node src/index.js --output report.md
```

## 設定ファイルの概念

```json
{
  "domain": "internship",          // ドメイン名（表示用）
  "candidate_label": "学生",       // 候補者の呼び方
  "opportunity_label": "ポジション", // 機会の呼び方
  "scoring_axes": [...]            // スコアリング軸（カスタマイズ可能）
}
```

スコアリング軸は重み（weight）と判定ロジック（type）をセットで定義。
ドメインが変わっても軸の設定を変えるだけで対応できる。
