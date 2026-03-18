# JVA IB — 学生 DB

> **ソース**: Google Sheets（GAS）row 74以降（プラットフォーム更新後の有効データ）
> **最終更新**: 2026-03-17
> 各学生のプロフィール一覧。応募進捗は `applications.md` を参照。

---

## ステータス凡例（Owner列のColumn 25）

| 値 | 意味 |
|----|------|
| ✅ | プロフィール承認済み |
| `sent` | CV送付済み（企業に紹介済み）|
| `not accepted` | プロフィール不承認 |
| `not proceed` | 選考見送り |
| `rejected` | 企業から不合格 |
| `she withdrawl` | 学生が辞退 |
| `not in tokyo so` | 在住地問題で見送り |
| (空白) | 未審査 |

---

## 学生一覧

| ID | 名前 | 大学 | 国籍 | English | Japanese | Status | CV | LinkedIn | LINE | Email |
|----|------|------|------|---------|----------|--------|-----|---------|------|-------|
| zixiang-zhao | Zixiang Zhao | Waseda | China | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1BBFMIuM0mCepA_i7k8_CtGagByjyH6Wq) | [LinkedIn](https://www.linkedin.com/in/自翔-赵-b02773399) | — | zizhuxingyijian@gmail.com |
| salina-porteous | Salina Porteous | Doshisha | Japanese | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1GJ1dzGfCRf0fn6ce8KU3qQKRfItoEW_a) | [LinkedIn](https://www.linkedin.com/in/salina-porteous/) | — | salinaporteous2003@gmail.com |
| tran-le | Tran Le Khanh Ngoc | Waseda | Vietnam | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1Z9q-A4r51tghfDSlZnQUqkqAZatrwMoz) | [LinkedIn](https://www.linkedin.com/in/tran-le-khanh-ngoc-b46536272/) | Khanh Ngoc | khanhngocpse2910@asagi.waseda.jp |
| fico-fernando | Fico Fernando | Sophia | Indonesia | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1caLbNw0YExCOUVmx6tF-tO3SkMkeMA16) | [LinkedIn](https://www.linkedin.com/in/fico-edward-johan-fernando-965051290) | — | edwardjohan34@gmail.com |
| dan-morales | Dan Morales Matsuzaki | Temple Univ Japan | Mexican/Japanese | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1u0DqFuH_beK7-8HzR9hPyi-5pe4fjjQm) | [LinkedIn](https://www.linkedin.com/in/dan-morales-matsuzaki/) | danmoralesmatsuzaki | dan.morales.m@gmail.com |
| ankit-yadav | Ankit Yadav | SRH University | India | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1smWKL11CFFThFtGhYQrptNguYQRtEpas) | [LinkedIn](https://www.linkedin.com/in/ankit02yadav) | Aniit02_yadav | ankit02062005yadav@gmail.com |
| eunseo-lim | Eunseo Lim | Northwestern | South Korea | — | — | ✅ Profile | [CV](https://drive.google.com/open?id=1LuABSTzTCaecubll3XBjLTOB16_eTW87) | [LinkedIn](https://www.linkedin.com/in/eunseo-lim-1b0a73207) | eunpi_chan | eunseolim2029@u.northwestern.edu |
| amal-francis | Amal Francis | — | India | — | — | (未審査) | [CV](https://drive.google.com/open?id=1u46Y4Zhe2SkV3WolbJtU_MyT8r9OWa0A) | [LinkedIn](https://www.linkedin.com/in/amalfrancis370) | amalfrancis370 | amalfrancis370@gmail.com |
| felicia-tedja | Felicia Tedja | Waseda | Indonesia | — | — | CV Sent | [CV](https://drive.google.com/open?id=1waiBy1sCvd_D2I5JraB50ptzZiKQ3zKa) | [LinkedIn](http://linkedin.com/in/felicia-tedja-a00b48323) | feliciatedja15 | felicia_tedja@toki.waseda.jp |
| jeongmin-ha | Jeongmin Ha | Waseda | Korean | — | — | CV Sent | [CV](https://drive.google.com/open?id=1dVsS3L3nxikhJ2rJDxgQrFEI1Ow-Nx28) | [LinkedIn](https://www.linkedin.com/in/jackie-ha1004) | jackieha1004 | jha021004@gmail.com |
| martin-hussey | Martin Hussey | Univ of Waterloo | Japanese | — | — | **Interview** | [CV](https://drive.google.com/open?id=1oqZjgV8e49qrLKeAUNmHEqDEZ6CrGi4q) | [LinkedIn](https://www.linkedin.com/in/marhuss/) | martinirokawa | mhussey@uwaterloo.ca |
| alwin-ma | Alwin Ma | Bates College | USA | — | — | CV Sent | [CV](https://drive.google.com/open?id=1ZLWDW2mx1_s23i-dKcHkggM5LvY8BF4F) | [LinkedIn](https://www.linkedin.com/in/alwinma) | alwin0615 | Alwinma74@gmail.com |

---

## 不承認・クローズ済み（参考）

| 名前 | 大学 | 理由 | Email |
|------|------|------|-------|
| Ahmed Samir | Cairo University | not accepted | ahmedsamir1598@gmail.com |
| Hind Rahali | Yamanashi Gakuin | not proceed | hind.rahali28@gmail.com |
| Eunseo Lim (2nd entry) | Northwestern | withdrawn | eunseolime@gmail.com |
| Taavi Vainult | Univ of Groningen | rejected by company | taavi.vainult7@gmail.com |
| Timothy Chi | UNC Chapel Hill | not in Tokyo | tim4.chi@gmail.com |

---

*取得元: GAS students endpoint row 74+ / 更新: 2026-03-17*
