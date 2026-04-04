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

  // 1行目はヘッダー行をスキップ
  // 列構成: A=タイムスタンプ, B=First Name, C=Last Name, D=Email address,
  //         E=LinkedIn Account, F=Company Name, G=Company Logo, ...
  for (var i = 1; i < data.length; i++) {
    var rowCompany = String(data[i][5]).trim(); // F列: Company Name
    if (rowCompany === companyName.trim()) {
      var email = String(data[i][3]).trim();    // D列: Email address
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

/**
 * マスターシートの会社名リストをフォームのプルダウン選択肢に同期する
 * スクリプトプロパティ:
 *   COMPANY_MASTER_SHEET_ID - マスタースプレッドシートのID
 *   STUDENT_FORM_ID         - 学生応募フォームのID
 */
function syncFormCompanyChoices() {
  var props = PropertiesService.getScriptProperties();
  var masterId = props.getProperty('COMPANY_MASTER_SHEET_ID');
  var formId = props.getProperty('STUDENT_FORM_ID');

  if (!masterId) {
    throw new Error('COMPANY_MASTER_SHEET_ID がスクリプトプロパティに設定されていません');
  }
  if (!formId) {
    throw new Error('STUDENT_FORM_ID がスクリプトプロパティに設定されていません');
  }

  // マスターシートからF列（Company Name）を取得
  var masterSS = SpreadsheetApp.openById(masterId);
  var sheet = masterSS.getSheets()[0];
  var data = sheet.getDataRange().getValues();

  var companies = [];
  for (var i = 1; i < data.length; i++) { // 1行目はヘッダースキップ
    var name = String(data[i][5]).trim(); // F列: Company Name
    if (name && name !== '') {
      companies.push(name);
    }
  }

  // 重複排除・ソート
  companies = companies.filter(function(v, i, a) { return a.indexOf(v) === i; });
  companies.sort();

  if (companies.length === 0) {
    Logger.log('会社名が0件のため同期をスキップしました');
    return;
  }

  // フォームの "Company Name" 質問を探して選択肢を更新
  var form = FormApp.openById(formId);
  var items = form.getItems();
  var targetItem = null;

  for (var j = 0; j < items.length; j++) {
    if (items[j].getTitle() === 'Company Name') {
      targetItem = items[j];
      break;
    }
  }

  if (!targetItem) {
    throw new Error('フォームに "Company Name" という質問が見つかりません。質問タイトルを確認してください。');
  }

  targetItem.asListItem().setChoiceValues(companies);
  Logger.log('同期完了: ' + companies.length + '社の選択肢を更新しました');
}
