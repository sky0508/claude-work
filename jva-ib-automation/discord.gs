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
    '✅ **応募メール送信完了**\n' +
    '企業: ' + params.companyName + '\n' +
    'ポジション: ' + params.position + '\n' +
    '学生: ' + params.studentName + '（' + params.university + '）\n' +
    '送信時刻: ' + now;
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
    '🚨 **応募自動化エラー**\n' +
    'エラー種別: ' + errorType + '\n' +
    '詳細: ' + detail + '\n' +
    (context.companyName ? '企業: ' + context.companyName + '\n' : '') +
    (context.position ? 'ポジション: ' + context.position + '\n' : '') +
    (context.studentName ? '学生: ' + context.studentName + '\n' : '') +
    '発生時刻: ' + now;
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
    '⚠️ **重複送信を検知しスキップしました**\n' +
    (context.companyName ? '企業: ' + context.companyName + '\n' : '') +
    (context.position ? 'ポジション: ' + context.position + '\n' : '') +
    (context.studentName ? '学生: ' + context.studentName + '\n' : '') +
    '検知時刻: ' + now;
  notifyDiscord(message);
}
