# KPI 管理 — Company JVA 内での確認・更新

スプレッドシートで管理しているKPIを、Claude Code 内の Company JVA でも**確認・修正・Weekly Flow Log ベースで管理**するための仕組みです。

---

## 1. KPIを確認する

### どこを見るか

| 目的 | 参照ファイル |
|------|----------------|
| **目標値（Settings）** | `config/kpi-settings.md` |
| **現在の実績・コンバージョン・月次サマリー** | `kpi/current.md` |
| **週次実績の内訳（Weekly Flow Log）** | `kpi/weekly-flow-log.md` |

JVAの作業中に「今のKPIは？」と思ったら、上記を開いて参照する。

### 目標値（Settings）の取得

KPI GAS の **GET** は `00_Settings` のみ返す。

```bash
# company_jva のルートで
KPI_URL=$(grep -A1 '"kpi"' config/sheets.json | grep '"url"' | sed 's/.*: *"\(.*\)".*/\1/')
TOKEN=$(jq -r '.token' config/sheets.json)
curl -sL "${KPI_URL}?token=${TOKEN}"
```

取得した内容を `config/kpi-settings.md` の「目標値」セクションに転記するか、`config/kpi-settings.json` に保存して運用する。

### 実績・コンバージョン・月次の取得

シート別の取得は **POST** 必須（302 リダイレクト先を GET で結果取得）。  
GAS 側の仕様（`listSheets` / シート名指定など）に合わせてリクエストし、返却を `kpi/current.md` に転記する。  
設定は `config/sheets.json` の `sheets.kpi` を参照。

---

## 2. KPIを修正する

### 目標値の修正

- **修正場所**: スプレッドシート「00_Settings」で編集する。
- Company JVA 側は「参照用」。必要に応じて上記「目標値の取得」を実行し、`config/kpi-settings.md` を更新する。

### 実績の修正（Weekly Flow Log）

1. **編集**: `kpi/weekly-flow-log.md` の該当週の行を修正する。
2. **反映**: KPI GAS の POST で以下いずれかを使う。  
   - 新規週の追加: `appendRow` で `01_Weekly_Flow_Log` に1行追加。  
   - 既存セルの修正: `updateCell` または `updateRange` で該当セルを更新。  
   - token・URL・アクション名は `config/sheets.json` の `sheets.kpi` を参照。
3. **再取得**: 必要なら実績・コンバージョン・月次を再取得し、`kpi/current.md` を更新する。

※ LINE累計登録は**このシート（Weekly Flow Log）の数値のみ**を合計して計算する。他ソースと合算しない。

---

## 3. Weekly Flow Log ベースで実績を管理する

- **正とする実績**: すべて `kpi/weekly-flow-log.md`（＝スプレッドシート「01_Weekly_Flow_Log」）に週単位で入力する。
- **自動計算**: スプレッドシート側で  
  - コンバージョン率（02_Weekly_Conversion）  
  - 月次サマリー（03_Monthly_Summary）  
  が自動計算される。
- **運用**: 週次で1行追加し、必要なら `kpi/current.md` を取得し直してサマリーを更新する。

---

## 4. Settings（目標値）の保存と参照

- **保存**: 目標値はスプレッドシート「00_Settings」が正。  
  Company JVA では `config/kpi-settings.md` に「転記」して参照用にする。
- **参照**: JVA作業中は `config/kpi-settings.md` を開けばいつでも目標値を確認できる。  
  起動時参照順にも含める（`CLAUDE.md` で案内）。

---

## 5. 活用の目的

- **KPIを見ながらストラテジーを考える**: `config/kpi-settings.md` と `kpi/current.md` で目標と実績を並べて議論する。
- **実績とのギャップを確認する**: 目標 vs 実績を同じコンテキストで見て、施策の優先度を決める。
- **JVA内でKPI管理を完結させる**: 確認・入力・反映をすべて Company JVA のファイルと GAS 連携で行う。

---

## 6. 日々の使い方・運用イメージ

### 朝・週初め（確認）

1. **今日の優先度を決めるとき**  
   `config/kpi-settings.md` と `kpi/current.md` を開き、目標と実績のギャップを確認する。  
   「今週はLINE登録を〇件伸ばす」「コンバージョン率を〇%まで持っていく」など、数字ベースで優先タスクを決める。
2. **必要なら最新化**  
   Settings や実績を久しぶりに見る場合は、上記「取得」手順で GAS から取得し、`kpi-settings.md` / `kpi/current.md` を更新する。

### 週末・週次締め（実績入力）

1. **その週の実績を入力**  
   `kpi/weekly-flow-log.md` にその週の行を追加（LINE登録数・スタートアップ申込数など）。  
   スプレッドシートの列に合わせて入力する。
2. **スプレッドシートへ反映**  
   GAS の `appendRow` で「01_Weekly_Flow_Log」に1行送る。  
   必要なら `updateCell` / `updateRange` で過去週の修正も行う。
3. **current を更新（任意）**  
   コンバージョン・月次サマリーを確認したければ、POST で取得して `kpi/current.md` を更新する。

### ストラテジー・振り返り（活用）

1. **施策検討時**  
   `config/kpi-settings.md`（目標）と `kpi/current.md`（実績）を並べて、「どこが足りていないか」「どの指標を先に改善するか」を話す。
2. **週次レビュー**  
   `reviews/` の週次メモに「今週のKPI」「目標との差」を書くとき、上記2ファイルを参照する。
3. **PM・CEOとの相談**  
   進捗やマイルストーン議論のときに、KPIの数値をその場で参照できる。

### 運用のコツ

- **目標値**: 四半期や月で変えたら、スプレッドシート「00_Settings」を更新し、続けて `config/kpi-settings.md` を再取得で揃える。
- **実績**: 入力は原則 `weekly-flow-log.md` → GAS 反映の一方向。スプレッドシートで直接触った場合は、必要に応じて `weekly-flow-log.md` と `current.md` を手動で合わせる。
- **LINE累計**: 常に「このシートの数値のみ合計」と意識し、他ツールの数値と混同しない。

---

## ファイル一覧

| ファイル | 役割 |
|----------|------|
| `config/kpi-settings.md` | 目標値（00_Settings の参照用コピー）・取得コマンド |
| `kpi/current.md` | 現在の実績・コンバージョン率・月次サマリーのスナップショット |
| `kpi/weekly-flow-log.md` | 週次実績の入力・編集用（01_Weekly_Flow_Log と対応） |
| `kpi/README.md` | 本ドキュメント（確認・修正・運用の手順） |

設定（URL・token・シート名）は `config/sheets.json` の `sheets.kpi` を参照する。
