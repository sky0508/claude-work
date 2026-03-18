# 営業・提案ナレッジ

> /fin_s が営業系作業のあるセッション後に更新する。

## IBの営業コンテキスト

- ターゲット: 英語対応可能なスタートアップ（創業期〜シリーズA程度）
- JVAの価値提案: 優秀な国際系学生（英語ネイティブ）を無料または低コストで採用できる
- 学生の強み: 英語力・グローバル視点・起業意欲・多様なバックグラウンド

## 理想の企業プロフィール（学生ペルソナに合う）

- 英語メイン or 英語OK（日本語不問）
- 15-25h/週（学生が無理なく続けられる）
- No Experience OK / 成長重視
- ビジネス・マーケ・オペレーション系のポジション
- AI/テック系で「かっこよさ」がある（学生が応募したくなる）

## 有効だったアプローチ

- （未収集 — 今後のセッションで蓄積）

## 営業メールのナレッジ

- （未収集 — 初回メール送付後に蓄積予定）

---

### 2026-03-16 追記

## LinkedIn B2B アウトリーチ ナレッジ（IB営業 初回実戦）

### 接続リクエスト vs InMail
| 方法 | 返信率 | 特徴 |
|------|--------|------|
| 接続リクエスト（note付き） | ~9% | 無制限・スケーラブル |
| InMail（LinkedIn Premium） | 18-25% | 月5通制限（Career plan）→ 意外と少ない |
| 接続後メッセージ | 25-35% | 最も高い → 接続承認を増やすことが鍵 |

**結論**: LinkedIn Premium Career では InMail は月5通しか使えないため、接続リクエスト＋note が主戦力。

### メッセージ設計の原則
1. **メッセージ = 4要素必須**: Hook（相手のニュース） / What+Who（JVA IBとは） / Scarcity（20社限定・無料） / CTA（プロフィール見せていいか）
2. **長さ**: 接続リクエストnoteは300文字以内、1通目メッセージは400文字以内
3. **実績を褒めるのはNG**: 「上から」に聞こえる → ニュースを「フック」として使うだけにとどめる
4. **学生先出しアプローチ（Candidate-First）**: 「プロフィールを見せていいか？」が最高ROI。Hiredly事例でリード120%増。
5. **送付タイミング**: 月・火曜日が最も反応率高い

### 会社規模別 担当者選定
| 規模 | 送る相手 |
|------|---------|
| ~50名 | CEO / 代表 |
| 50名以上 | HR / 採用担当 |

### 日本語テンプレート（確定版）
```
はじめまして！国内トップ大学のグローバル学生と東京のスタートアップをつなぐ「JVA Internship Board」を運営している佐々木と申します！ただいま先着20社限定で掲載から採用まで完全無料で提供しているので、インターン採用でお役に立てるかもと思いご挨拶させていただきました！よろしくお願いいたします。
```

### 英語テンプレート（確定版）
```
Hi [Name], I'm Sora, co-founder of JVA Internship Board — a platform matching global students from top Japanese universities with Tokyo startups. We're onboarding our first 20 partner companies for free (listing through hire). Think there might be a fit with [Company] — would love to connect!
```

### アウトリーチトラッカー 運用ルール（2026-03-16 確定）

- **Google Sheets がメイン（正）**: 承認・送付・返信があったらまずSheetsを更新
- CSV / MD はバックアップ・ローカル参照用（Claudeが会話中に読む用途）
- Claude が承認報告を受けたら Sheets → CSV → MD の順で同期する

### 言語一貫性ルール（2026-03-16 確定）

- 接続リクエスト時に使用した言語（EN/JA）を `Msg Lang` 列に記録
- **1通目〜FU2まで、必ず同じ言語で送る**（途中で言語を変えない）
- 承認が来たら最初にLang列を確認してからメッセージを用意する

### 1通目メッセージ戦略（2026-03-16 策定）

- **学生主体・学生目線が最大の差別化ポイント**:「学生自身が運営するプラットフォーム」として打ち出す
- 「内側にいるから意欲ある学生だけ集められる」という信頼感が生まれる
- CTA: 15〜20分のミーティングを提案（プロフィール送付よりも関係構築重視）
- CTAにはスケジューリングリンクを入れる（Calendly / Cal.com 調整中）
- ドラフト保存先: `dep_IB/sales/1st-message-draft.md`

### 初回15社の送付実績（2026-03-16）
- 送付済み: 15社（接続リクエスト13社 + InMail 2社）
- JA送付: ArkEdge Space, enechain, Loglass, Kyoto Fusioneering, センシンロボティクス, Aeterlink, Asuene, ElevationSpace, Pale Blue（一部JA variant）
- EN送付: Notta, Recursive Inc., GITAI, QunaSys, Asilla, Instalimb
- トラッカー: `company_jva/sales/outreach-db.md` / `sales/outreach-tracker.csv`
