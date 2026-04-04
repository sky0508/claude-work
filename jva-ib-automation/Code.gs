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
  company:    'Company Name',
  position:   'Position Title',
  firstName:  'First Name',
  lastName:   'Last Name',
  nationality: 'Nationality',
  university: 'University',
  email:      'Email address',
  lineUser:   'LINE User Name',
  linkedin:   'LinkedIn Account',
  cvFile:     'Please upload your latest resume',
  major:      'What is your major? (e.g., Economics, Computer Science, Business)',
  clFile:     ''  // カバーレター別項目なし
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
    var firstName    = getFormValue(namedValues, FIELD_NAMES.firstName);
    var lastName     = getFormValue(namedValues, FIELD_NAMES.lastName);
    var studentName  = (firstName + ' ' + lastName).trim();
    var nationality  = getFormValue(namedValues, FIELD_NAMES.nationality);
    var university   = getFormValue(namedValues, FIELD_NAMES.university);
    var studentEmail = getFormValue(namedValues, FIELD_NAMES.email);
    var lineUser     = getFormValue(namedValues, FIELD_NAMES.lineUser);
    var linkedin     = getFormValue(namedValues, FIELD_NAMES.linkedin);
    var cvFile       = getFormValue(namedValues, FIELD_NAMES.cvFile);
    var major        = getFormValue(namedValues, FIELD_NAMES.major);
    var clFile       = getFormValue(namedValues, FIELD_NAMES.clFile);

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

    // ── 4. ファイル確認 ──────────────────────────────────
    if (!cvFile) {
      Logger.log('警告: CV ファイルが未添付です（学生: ' + studentName + '）');
    }

    // ── 5. メール送信 ────────────────────────────────────
    sendApplicationEmail({
      companyEmail:  companyEmail,
      companyName:   companyName,
      position:      position,
      studentName:   studentName,
      university:    university,
      major:         major,
      cvFile:        cvFile,
      clFile:        clFile
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
