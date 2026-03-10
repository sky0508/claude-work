# Personal — 個人レベル管理

> **全カンパニー共通の基盤。どのプロジェクトを開いても常に参照される。**
> JVA固有の情報は `.company_jva/` へ。ここには「人としての好み・スタイル・習慣」を置く。

---

## 起動時の読み込み順

`/company` または `/fin_s` 実行時、必ずこの順で読む:

1. `context/ai-preferences.md` — AIへの要望（最重要）
2. `context/owner-profile.md` — 作業スタイル・性格
3. `tasks/recurring.md` — 定期タスクの確認
4. `secretary/sessions/` — 直近の個人セッションログ（最新1件）
5. → その後、カンパニー固有ファイルへ

---

## 登録済みカンパニー

| カンパニー名 | ディレクトリ | ステータス |
|------------|------------|-----------|
| JVA / IB | `.company_jva/`（/420_JVA/内）| アクティブ |
| Alphadrive | `.company_alphadrive/`（未作成）| 未開始 |
| CHRO業務 | `.company_chro/`（未作成）| 未開始 |

---

## このディレクトリに置くもの

| 内容 | ファイル |
|------|---------|
| AIへの要望・振る舞い設定 | `context/ai-preferences.md` |
| 作業スタイル・好み・性格 | `context/owner-profile.md` |
| 作業タイプ別ナレッジ | `context/work-knowledge/{type}.md` |
| 定期タスク（習慣・ルーティン）| `tasks/recurring.md` |
| カンパニー横断バックログ | `tasks/backlog.md` |
| 個人セッションログ | `secretary/sessions/YYYY-MM-DD.md` |

## このディレクトリに置かないもの

- JVA/IBの業務詳細 → `.company_jva/`
- Alphadrive業務 → `.company_alphadrive/`（将来）
- 特定カンパニーのクライアント・学生情報 → 各カンパニーディレクトリ

---

## オーナー基本情報

- **拠点**: 東京
- **現在の活動**: JVA IB運営 / Alphadrive 営業インターン / CHRO
- **詳細**: `context/owner-profile.md` を参照
