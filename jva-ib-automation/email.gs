/**
 * email.gs
 * 企業への応募通知メール送信
 */

/**
 * 企業に応募メールを送信する
 * @param {Object} params
 * @param {string} params.companyEmail    - 送信先メールアドレス
 * @param {string} params.companyName     - 会社名
 * @param {string} params.position        - 応募ポジション
 * @param {string} params.studentName     - 学生氏名
 * @param {string} params.university      - 大学・学年
 * @param {string} params.skills          - スキルセット
 * @param {string} params.linkedin        - LinkedIn URL
 * @param {string} params.cvUrl           - CV の Drive URL
 * @param {string} params.clUrl           - カバーレターの Drive URL
 */
function sendApplicationEmail(params) {
  var props = PropertiesService.getScriptProperties();
  var senderName = props.getProperty('SENDER_NAME') || 'JVA Internship Board';

  // 件名
  var subject = '【JVA IB】' + params.studentName + 'さんから' + params.position + 'への応募';

  // 本文
  var body = buildEmailBody(params);

  // 添付ファイル取得
  var attachments = [];

  if (params.cvUrl && params.cvUrl.trim() !== '') {
    var cvId = extractDriveFileId(params.cvUrl);
    var cvBlob = DriveApp.getFileById(cvId).getBlob();
    attachments.push(cvBlob);
  }

  if (params.clUrl && params.clUrl.trim() !== '') {
    var clId = extractDriveFileId(params.clUrl);
    var clBlob = DriveApp.getFileById(clId).getBlob();
    attachments.push(clBlob);
  }

  // メール送信
  var options = {
    name: senderName,
    attachments: attachments
  };

  GmailApp.sendEmail(params.companyEmail, subject, body, options);
}

/**
 * メール本文を構築する
 * @param {Object} params
 * @returns {string}
 */
function buildEmailBody(params) {
  var lines = [
    params.companyName + ' 採用ご担当者様',
    '',
    'JVA Internship Board を通じて、インターンシップへのご応募がありましたのでお知らせします。',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【応募者情報】',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '氏名:           ' + params.studentName,
    '大学・学年:     ' + params.university,
    '応募ポジション: ' + params.position,
    'スキルセット:   ' + params.skills,
    'LinkedIn:       ' + (params.linkedin || '未記入'),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'CV・カバーレターを添付しております。',
    'ご確認のほどよろしくお願いいたします。',
    '',
    '何かご不明な点がございましたら、本メールへ返信いただくか、',
    'JVA までお気軽にご連絡ください。',
    '',
    '──────────────────────────',
    'JVA Internship Board',
    '──────────────────────────'
  ];

  return lines.join('\n');
}
