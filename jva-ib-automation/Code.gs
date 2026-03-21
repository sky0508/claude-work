/**
 * Code.gs
 * JVA IB 応募自動化 — メインエントリーポイント
 *
 * =========================================================
 * フォームフィールド名の設定（要カスタマイズ）
 * =========================================================
 * 下記の FIELD_NAMES をあなたの Google Form の質問文に合わせて変更してください。
 * 「e.namedValues」のキーはフォームの質問文そのものです。
 */
var FIELD_NAMES = {
  company:    '応募先会社名',       // プルダウン選択の質問文
  position:   '応募ポジション',
  name:       '氏名',
  university: '大学名・学年',
  skills:     'スキルセット',
  linkedin:   'LinkedIn URL',
  cvUrl:      'CV（Google Drive URL）',
  clUrl:      'カバーレター（Google Drive URL）'
};

/**
 * 送信ステータス列のヘッダー名
 * Response Sheet の最終列にこのヘッダーを追加してください
 */
var STATUS_COLUMN_HEADER = '送信ステータス';

// =========================================================

/**
 * Google Form 送信時に自動実行されるハンドラー
 * インストーラブルトリガーで onFormSubmit に設定すること
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e
 */
function onFormSubmit(e) {
  var context = {}; // エラー通知用のコンテキスト情報

  try {
    // ── 1. フォームデータ取得 ──────────────────────────────
    var namedValues = e.namedValues;

    var companyName  = getFormValue(namedValues, FIELD_NAMES.company);
    var position     = getFormValue(namedValues, FIELD_NAMES.position);
    var studentName  = getFormValue(namedValues, FIELD_NAMES.name);
    var university   = getFormValue(namedValues, FIELD_NAMES.university);
    var skills       = getFormValue(namedValues, FIELD_NAMES.skills);
    var linkedin     = getFormValue(namedValues, FIELD_NAMES.linkedin);
    var cvUrl        = getFormValue(namedValues, FIELD_NAMES.cvUrl);
    var clUrl        = getFormValue(namedValues, FIELD_NAMES.clUrl);

    context = {
      companyName: companyName,
      position:    position,
      studentName: studentName
    };

    // ── 2. 重複送信チェック ───────────────────────────────
    var sheet = e.source.getActiveSheet();
    var row   = e.range.getRow();

    if (isAlreadySent(sheet, row)) {
      notifyDuplicate(context);
      return;
    }

    // ── 3. 会社メールアドレス検索 ─────────────────────────
    var companyEmail = lookupCompanyEmail(companyName);

    if (!companyEmail) {
      updateStatus(sheet, row, 'エラー: 会社未登録');
      notifyError(
        '会社メール未登録',
        '会社マスターシートに「' + companyName + '」が見つかりません',
        context
      );
      return;
    }

    // ── 4. Drive ファイルアクセス確認（事前チェック）────────
    // ファイル取得エラーは sendApplicationEmail 内で発生するが、
    // URL が空の場合は事前に警告のみ（送信は継続）
    if (!cvUrl) {
      Logger.log('警告: CV URL が未入力です（学生: ' + studentName + '）');
    }
    if (!clUrl) {
      Logger.log('警告: カバーレター URL が未入力です（学生: ' + studentName + '）');
    }

    // ── 5. メール送信 ────────────────────────────────────
    sendApplicationEmail({
      companyEmail: companyEmail,
      companyName:  companyName,
      position:     position,
      studentName:  studentName,
      university:   university,
      skills:       skills,
      linkedin:     linkedin,
      cvUrl:        cvUrl,
      clUrl:        clUrl
    });

    // ── 6. 成功処理 ──────────────────────────────────────
    updateStatus(sheet, row, '送信済み');
    notifySuccess({
      companyName: companyName,
      position:    position,
      studentName: studentName,
      university:  university
    });

  } catch (err) {
    Logger.log('onFormSubmit エラー: ' + err.message);

    // ステータスをエラーで記録（シート情報が取れている場合）
    try {
      if (e && e.source && e.range) {
        var errSheet = e.source.getActiveSheet();
        var errRow   = e.range.getRow();
        updateStatus(errSheet, errRow, 'エラー: ' + err.message.substring(0, 50));
      }
    } catch (innerErr) {
      Logger.log('ステータス更新失敗: ' + innerErr.message);
    }

    notifyError('予期しないエラー', err.message, context);
  }
}

// =========================================================
// ── プライベートヘルパー関数 ──────────────────────────────
// =========================================================

/**
 * 既に送信済みかどうかを確認する
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row - 対象行番号（1始まり）
 * @returns {boolean}
 */
function isAlreadySent(sheet, row) {
  var statusCol = findStatusColumn(sheet);
  if (statusCol === -1) return false; // ステータス列がなければ未送信扱い

  var statusValue = sheet.getRange(row, statusCol).getValue();
  return statusValue === '送信済み';
}

/**
 * ステータス列のインデックスを返す（見つからない場合は -1）
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {number} 1始まりの列番号、見つからない場合は -1
 */
function findStatusColumn(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === STATUS_COLUMN_HEADER) {
      return i + 1; // 1始まり
    }
  }
  return -1;
}

/**
 * 送信ステータスを Response Sheet に記録する
 * ステータス列が存在しない場合は末尾に自動追加する
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row
 * @param {string} status
 */
function updateStatus(sheet, row, status) {
  var statusCol = findStatusColumn(sheet);

  if (statusCol === -1) {
    // ステータス列を末尾に追加
    statusCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusCol).setValue(STATUS_COLUMN_HEADER);
  }

  var timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  sheet.getRange(row, statusCol).setValue(status + ' (' + timestamp + ')');
}
