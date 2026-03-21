/**
 * utils.gs
 * 共通ユーティリティ関数
 */

/**
 * 会社マスタースプレッドシートからメールアドレスを検索する
 * @param {string} companyName - 会社名（フォームのプルダウン値と完全一致）
 * @returns {string|null} メールアドレス、見つからない場合は null
 */
function lookupCompanyEmail(companyName) {
  var props = PropertiesService.getScriptProperties();
  var masterId = props.getProperty('COMPANY_MASTER_SHEET_ID');

  if (!masterId) {
    throw new Error('COMPANY_MASTER_SHEET_ID がスクリプトプロパティに設定されていません');
  }

  var masterSS = SpreadsheetApp.openById(masterId);
  var sheet = masterSS.getSheets()[0]; // 最初のシートを使用
  var data = sheet.getDataRange().getValues();

  // 1行目はヘッダー行をスキップ（あれば）
  for (var i = 0; i < data.length; i++) {
    var rowCompany = String(data[i][0]).trim();
    if (rowCompany === companyName.trim()) {
      var email = String(data[i][1]).trim();
      return email || null;
    }
  }

  return null;
}

/**
 * Google Drive の共有URLからファイルIDを抽出する
 * 対応形式:
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://docs.google.com/...
 * @param {string} url - Drive URL
 * @returns {string} ファイルID
 */
function extractDriveFileId(url) {
  if (!url || url.trim() === '') {
    throw new Error('ファイルURLが空です');
  }

  var patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,          // ?id=FILE_ID 形式
    /\/d\/([a-zA-Z0-9_-]+)/,             // /d/FILE_ID/ 形式
    /open\?id=([a-zA-Z0-9_-]+)/          // open?id=FILE_ID 形式
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error('URLからファイルIDを抽出できませんでした: ' + url);
}

/**
 * namedValues から指定フィールドの値を取得（配列の最初の要素）
 * @param {Object} namedValues - e.namedValues
 * @param {string} key - フィールド名
 * @returns {string}
 */
function getFormValue(namedValues, key) {
  var arr = namedValues[key];
  if (!arr || arr.length === 0) return '';
  return String(arr[0]).trim();
}
