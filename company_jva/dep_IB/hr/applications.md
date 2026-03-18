# JVA IB — 応募進捗 DB（Applications）

> **リレーション構造**:
> - `Student ID` → `students.md` の ID列を参照
> - `Position ID` → `companies.md` の Position ID列を参照
>
> **最終更新**: 2026-03-17

---

## ステータス定義

| ステータス | 説明 |
|-----------|------|
| `Applied` | 学生がフォームからアプライ（まだ企業に紹介していない）|
| `CV Sent` | 企業にCVを送付済み |
| `Interview` | 企業が面談を希望 → スケジューリング中 or 確定済み |
| `Offer` | オファー提示済み |
| `Placed` | マッチング成立・インターン開始 |
| `Rejected` | 企業から不合格 |
| `Withdrawn` | 学生が辞退 |
| `Not Accepted` | 内部でプロフィール不承認（企業に送らず）|

---

## 応募一覧

| # | Student ID | 学生名 | Position ID | 企業 / ポジション | ステータス | CV送付日 | 更新日 | メモ |
|---|-----------|--------|-------------|------------------|-----------|---------|--------|------|
| 1 | martin-hussey | Martin Hussey | jurin-ai/engineering | Jurin AI / Engineering Intern | **Interview** | 2026-03-16 | 2026-03-17 | スケジューリングリンク送付済（2026-03-17）→ 日時確認待ち |
| 2 | alwin-ma | Alwin Ma | jurin-ai/marketing | Jurin AI / Marketing Intern | CV Sent | 2026-03-16 | 2026-03-16 | 返信期限: 2026-03-23 |
| 3 | felicia-tedja | Felicia Tedja | globaldeal/growth-marketing | GlobalDeal / Growth Marketing Explorer | CV Sent | 2026-03-02 | 2026-03-02 | Nahiが送付 |
| 4 | jeongmin-ha | Jeongmin Ha | globaldeal/growth-marketing | GlobalDeal / Growth Marketing Explorer | CV Sent | 2026-03-07 | 2026-03-07 | デザインポートフォリオ確認中 |
| 5 | eunseo-lim | Eunseo Lim | in-recruitment/recruitment | I&N Recruitment / Recruitment Internship | CV Sent | 2026-02-17 | 2026-02-17 | Nahiが対応 |
| 6 | dan-morales | Dan Morales Matsuzaki | jurin-ai/engineering | Jurin AI / Engineering Intern | Applied | — | 2026-02-16 | プロフィール承認済み・CV未送付 |
| 7 | ankit-yadav | Ankit Yadav | jurin-ai/engineering | Jurin AI / Engineering Intern | Applied | — | 2026-02-17 | プロフィール承認済み・CV未送付 |
| 8 | tran-le | Tran Le Khanh Ngoc | sora-tech/biz-dev | SORA Technology / Business Dev Specialist | Applied | — | 2026-02-12 | プロフィール承認済み |

---

## クローズ済み

| Student ID | 学生名 | Position ID | 企業 / ポジション | ステータス | 理由 |
|-----------|--------|-------------|------------------|-----------|------|
| tran-le | Tran Le Khanh Ngoc | jurin-ai/operations | Jurin AI / Operations Intern | Not Accepted | 内部不承認 |
| ahmed-samir | Ahmed Samir | jurin-ai/engineering | Jurin AI / Engineering Intern | Not Accepted | 内部不承認 |
| taavi-vainult | Taavi Vainult | in-recruitment/recruitment | I&N Recruitment / Recruitment Internship | Rejected | 企業から不合格 |
| eunseo-lim-2 | Eunseo Lim | globaldeal/growth-marketing | GlobalDeal / Growth Marketing Explorer | Withdrawn | 学生が辞退 |
| hind-rahali | Hind Rahali | in-recruitment/recruitment | I&N Recruitment / Recruitment Internship | Not Accepted | 選考見送り |
| timothy-chi | Timothy Chi | in-recruitment/recruitment | I&N Recruitment / Recruitment Internship | Not Accepted | 東京不在 |

---

## 更新ルール

- 企業にCVを送った → ステータスを `CV Sent` に更新・CV送付日を記入
- 企業から面談希望連絡 → `Interview` に更新・メモに詳細を記入
- マッチング成立 → `Placed` に更新・KPIファイルも更新（`dep_IB/kpi/`）
- 毎朝 `/morning` でGASから新着チェック → 新規エントリを `Applied` で追加

*更新: 2026-03-17*
