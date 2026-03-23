/**
 * createForm.gs
 * JVA IB 学生応募フォームを自動作成するセットアップスクリプト
 *
 * 使い方:
 *   1. JVAアカウントのApps Scriptにこのファイルを追加
 *   2. createApplicationForm() を手動実行
 *   3. ログに出力されたフォームURLとスプレッドシートIDをメモ
 *   4. スプレッドシートに Code.gs / email.gs / discord.gs / utils.gs を追加
 *   5. onFormSubmit トリガーを設定
 */
function createApplicationForm() {
  // ── フォーム作成 ──────────────────────────────────────────
  var form = FormApp.create('JVA Internship Board — Application Form');
  form.setDescription('Apply for internship opportunities listed on JVA Internship Board.');
  form.setCollectEmail(false);

  // ── セクション1: Internship you are applying for ──────────
  form.addSectionHeaderItem()
    .setTitle('Internship you are applying for');

  form.addTextItem()
    .setTitle('Company Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Position Title')
    .setRequired(true);

  // ── セクション2: Your Information ────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Your Information');

  form.addTextItem()
    .setTitle('First Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Last Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Nationality')
    .setRequired(true);

  form.addTextItem()
    .setTitle('University')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Email address')
    .setRequired(true);

  form.addTextItem()
    .setTitle('LINE User Name')
    .setRequired(false);

  form.addTextItem()
    .setTitle('LinkedIn Account')
    .setRequired(false);

  // ── CV リンク（Gmailアカウントはファイルアップロード不可のためURLで代替）──
  form.addTextItem()
    .setTitle('Please upload your latest resume')
    .setHelpText('Share your CV as a Google Drive link (make sure it is accessible to anyone with the link)')
    .setRequired(true);

  // ── Response Spreadsheet を新規作成してリンク ─────────────
  var ss = SpreadsheetApp.create('JVA IB - Student Applications');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ── 結果をログ出力 ────────────────────────────────────────
  Logger.log('✅ フォーム作成完了');
  Logger.log('フォーム編集URL: ' + form.getEditUrl());
  Logger.log('フォーム回答URL: ' + form.getPublishedUrl());
  Logger.log('Response Spreadsheet ID: ' + ss.getId());
  Logger.log('Response Spreadsheet URL: ' + ss.getUrl());
}
