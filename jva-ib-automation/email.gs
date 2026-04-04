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
 * @param {string} params.nationality     - 国籍
 * @param {string} params.university      - 大学名
 * @param {string} params.studentEmail    - 学生メールアドレス
 * @param {string} params.lineUser        - LINE ユーザー名
 * @param {string} params.linkedin        - LinkedIn URL
 * @param {string} params.cvFile          - CV の Drive URL（フォームのファイルアップロード値）
 * @param {string} params.clFile          - カバーレターの Drive URL（あれば）
 */
function sendApplicationEmail(params) {
  var props = PropertiesService.getScriptProperties();
  var senderName = props.getProperty('SENDER_NAME') || 'JVA Internship Board';

  // 件名
  var subject = 'Introduction of a student interested in your ' + params.position + ' Position [' + params.studentName + ']';

  // 本文
  var body = buildEmailBody(params);

  // 添付ファイル取得（Google Forms のファイルアップロードは Drive URL で渡される）
  var attachments = [];

  if (params.cvFile && params.cvFile.trim() !== '') {
    try {
      var cvId = extractDriveFileId(params.cvFile);
      var cvBlob = DriveApp.getFileById(cvId).getBlob();
      attachments.push(cvBlob);
    } catch (err) {
      throw new Error('CV ファイルの取得に失敗しました: ' + err.message);
    }
  }

  if (params.clFile && params.clFile.trim() !== '') {
    try {
      var clId = extractDriveFileId(params.clFile);
      var clBlob = DriveApp.getFileById(clId).getBlob();
      attachments.push(clBlob);
    } catch (err) {
      Logger.log('カバーレター取得失敗（スキップ）: ' + err.message);
    }
  }

  // メール送信
  var options = {
    name: senderName,
    attachments: attachments,
    replyTo: params.studentEmail || '',
    htmlBody: body
  };

  GmailApp.sendEmail(params.companyEmail, subject, buildPlainBody(params), options);
}

/**
 * メール本文をHTML形式で構築する
 * @param {Object} params
 * @returns {string} HTML文字列
 */
function buildEmailBody(params) {
  var deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  var deadlineStr = Utilities.formatDate(deadline, 'Asia/Tokyo', 'MMMM d, yyyy');

  // 候補者プロフィール箇条書き（空項目はスキップ）
  var profileItems = [];
  profileItems.push('<li><b>Name:</b> ' + params.studentName + '</li>');
  if (params.university && params.university.trim() !== '') {
    profileItems.push('<li><b>University:</b> ' + params.university + '</li>');
  }
  if (params.major && params.major.trim() !== '') {
    profileItems.push('<li><b>Major:</b> ' + params.major + '</li>');
  }

  var html = [
    '<p>Hi ' + params.companyName + ' Team,</p>',
    '<p>We\'d like to introduce ' + params.studentName + ', who is highly interested in ' + params.companyName + '\'s ' + params.position + ' internship. Please find their resume attached for your review.</p>',
    '<p><b>--- Candidate Profile ---</b></p>',
    '<ul>' + profileItems.join('') + '</ul>',
    '<p>If they pass your initial screening and you\'d like to move forward, <strong>could you share 2–3 available interview slots?</strong> We\'ll coordinate on our end and confirm.</p>',
    '<p>We\'d appreciate your decision by <strong>' + deadlineStr + '</strong>.</p>',
    '<p>Best regards,<br>JVA Internship Board</p>'
  ];

  return html.join('\n');
}

/**
 * メール本文をプレーンテキストで構築する（HTMLメールのフォールバック用）
 * @param {Object} params
 * @returns {string}
 */
function buildPlainBody(params) {
  var deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  var deadlineStr = Utilities.formatDate(deadline, 'Asia/Tokyo', 'MMMM d, yyyy');

  var lines = [
    'Hi ' + params.companyName + ' Team,',
    '',
    'We\'d like to introduce ' + params.studentName + ', who is highly interested in ' + params.companyName + '\'s ' + params.position + ' internship. Please find their resume attached for your review.',
    '',
    '--- Candidate Profile ---',
    '  Name:        ' + params.studentName
  ];

  if (params.university && params.university.trim() !== '') {
    lines.push('  University:  ' + params.university);
  }
  if (params.major && params.major.trim() !== '') {
    lines.push('  Major:       ' + params.major);
  }

  lines = lines.concat([
    '',
    'If they pass your initial screening and you\'d like to move forward,',
    'could you share 2\u20133 available interview slots? We\'ll coordinate on our end and confirm.',
    '',
    'We\'d appreciate your decision by ' + deadlineStr + '.',
    '',
    'Best regards,',
    'JVA Internship Board'
  ]);

  return lines.join('\n');
}
