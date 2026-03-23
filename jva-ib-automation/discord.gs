/**
 * discord.gs
 * Discord Webhook 通知
 */

/**
 * Discord Webhook に通知を送信する
 * @param {string} message - 送信するメッセージ（Markdown対応）
 */
function notifyDiscord(message) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('DISCORD_WEBHOOK_URL');

  if (!webhookUrl) {
    Logger.log('警告: DISCORD_WEBHOOK_URL が未設定のため Discord 通知をスキップします');
    return;
  }

  var payload = JSON.stringify({ content: message });

  var options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(webhookUrl, options);
  var code = response.getResponseCode();

  if (code !== 200 && code !== 204) {
    Logger.log('Discord 通知失敗 HTTP ' + code + ': ' + response.getContentText());
  }
}

/**
 * 成功通知を送信する
 * @param {Object} params
 * @param {string} params.companyName
 * @param {string} params.position
 * @param {string} params.studentName
 * @param {string} params.university
 */
function notifySuccess(params) {
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  var message =
    '✅ **Application Email Sent**\n' +
    'Company: ' + params.companyName + '\n' +
    'Position: ' + params.position + '\n' +
    'Student: ' + params.studentName + ' (' + params.university + ')\n' +
    'Sent at: ' + now;
  notifyDiscord(message);
}

/**
 * エラー通知を送信する
 * @param {string} errorType - エラー種別の説明
 * @param {string} detail - 詳細メッセージ
 * @param {Object} context - 応募情報（判明している範囲）
 */
function notifyError(errorType, detail, context) {
  context = context || {};
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  var message =
    '🚨 **Automation Error**\n' +
    'Error: ' + errorType + '\n' +
    'Detail: ' + detail + '\n' +
    (context.companyName ? 'Company: ' + context.companyName + '\n' : '') +
    (context.position ? 'Position: ' + context.position + '\n' : '') +
    (context.studentName ? 'Student: ' + context.studentName + '\n' : '') +
    'Occurred at: ' + now;
  notifyDiscord(message);
}

/**
 * 重複送信警告を送信する
 * @param {Object} context
 */
function notifyDuplicate(context) {
  context = context || {};
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
  var message =
    '⚠️ **Duplicate submission detected — skipped**\n' +
    (context.companyName ? 'Company: ' + context.companyName + '\n' : '') +
    (context.position ? 'Position: ' + context.position + '\n' : '') +
    (context.studentName ? 'Student: ' + context.studentName + '\n' : '') +
    'Detected at: ' + now;
  notifyDiscord(message);
}
