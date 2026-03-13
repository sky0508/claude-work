// ============================================================
// JVA Internship Board — 応募自動メール送信スクリプト
// 設置場所: Google スプレッドシート（フォーム回答シート）の
//           「拡張機能 > Apps Script」に貼り付けて使う
// ============================================================

// ============================================================
// ★ 設定エリア（ここだけ編集する）
// ============================================================
const CONFIG = {

  // --- 学生フォーム回答シート ---
  FORM_SHEET_NAME: "Student Application", // 学生フォームの回答シートタブ名

  // フォームの列番号（A=1, B=2, C=3 … の順）
  COL_STUDENT_NAME:  4,   // D列: 学生の First Name
  COL_STUDENT_EMAIL: 6,   // F列: 学生のメールアドレス
  COL_COMPANY_NAME:  19,  // S列: 応募企業名
  COL_POSITION:      20,  // T列: 応募ポジション名
  COL_RESUME:        11,  // K列: CV/レジュメのGoogle Driveリンク（PDF）

  // --- 企業スプレッドシート（自動参照・手動管理不要）---
  // companies フォームのGASエンドポイント（sheets.jsonより）
  STARTUPS_API_URL: "https://script.google.com/macros/s/AKfycbzR8L_XcaaXCgfDaKq66d1QlYjjPfv0WAQ89ScW54Z41q1dvT-ga-asekZJ5dViVdsn/exec",
  STARTUPS_API_TOKEN: "jva_secret_token_2026",

  // --- メール送信設定 ---
  SENDER_NAME:  "Nahi from JVA Internship Board",
  REPLY_TO:     "nahi@example.com",  // ← JVAの返信先メールアドレスに変更

  // 返信期限（営業日）
  DEADLINE_BUSINESS_DAYS: 5,
};

// ============================================================
// メイン処理（フォーム送信時に自動実行）
// ============================================================
function onFormSubmit(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.FORM_SHEET_NAME);
    if (!sheet) throw new Error(`シート "${CONFIG.FORM_SHEET_NAME}" が見つかりません`);

    // フォーム送信イベントから正確な行番号を取得
    // e.range.getRow() が最も確実（sheet.getLastRow()は空行で誤検知する）
    const rowNum = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    const row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`処理行: ${rowNum}行目`);

    const studentName = row[CONFIG.COL_STUDENT_NAME  - 1];
    const companyName = row[CONFIG.COL_COMPANY_NAME  - 1];
    const position    = row[CONFIG.COL_POSITION      - 1];
    const resumeUrl   = row[CONFIG.COL_RESUME        - 1];

    Logger.log(`新規応募: ${studentName} → ${companyName} / ${position}`);

    // 企業スプレッドシートから担当者情報を自動取得
    const companyInfo = findCompanyFromSpreadsheet(companyName);
    if (!companyInfo) {
      Logger.log(`⚠️ 企業が見つかりません: "${companyName}"`);
      notifyError(`企業が見つかりません: "${companyName}"`, studentName);
      return;
    }

    // CV ファイルを Google Drive から取得
    const cvBlob = fetchCvBlob(resumeUrl, studentName);

    // 返信期限を計算
    const deadline = calcDeadline(CONFIG.DEADLINE_BUSINESS_DAYS);

    // メール送信
    sendEmail({
      to:          companyInfo.email,
      contactName: companyInfo.contactName,
      companyName: companyName,
      position:    position,
      studentName: studentName,
      cvBlob:      cvBlob,
      cvUrl:       resumeUrl,
      deadline:    deadline,
    });

    // シートに「送信済み」を記録
    const logCol = sheet.getLastColumn() + 1;
    sheet.getRange(rowNum, logCol).setValue(`Sent → ${companyInfo.email} at ${new Date().toLocaleString("ja-JP")}`);

    Logger.log(`✅ 送信完了: ${companyInfo.email}`);

  } catch (err) {
    Logger.log(`❌ エラー: ${err.message}`);
    notifyError(err.message);
  }
}

// ============================================================
// 企業スプレッドシートから担当者情報を直接検索
//
// 実際の構造（debugListCompanies で確認済み）:
//   全行を総なめ。col[5]=CompanyName、col[4]=CompanyName(legacy)
//   col[1]=FirstName, col[2]=LastName, col[3]=Email
// ============================================================
function findCompanyFromSpreadsheet(companyName) {
  const response = UrlFetchApp.fetch(
    `${CONFIG.STARTUPS_API_URL}?token=${CONFIG.STARTUPS_API_TOKEN}`,
    { followRedirects: true, muteHttpExceptions: true }
  );

  if (response.getResponseCode() !== 200) {
    throw new Error(`企業スプレッドシートの取得失敗 (HTTP ${response.getResponseCode()})`);
  }

  const rows  = Utilities.parseCsv(response.getContentText());
  const query = companyName.toLowerCase().trim();

  // 行0はヘッダーなのでスキップ。全行を総なめで検索
  for (let i = 1; i < rows.length; i++) {
    const row  = rows[i];
    // col[5] = Company Name（新フォーム）、col[4] = Company Name（旧フォーム）
    const name5 = String(row[5] || "").toLowerCase().trim();
    const name4 = String(row[4] || "").toLowerCase().trim();
    const name  = name5 || name4;

    if (!name) continue;

    if (name === query || name.includes(query) || query.includes(name)) {
      const email = String(row[3] || "").trim();
      if (!email) {
        // メールアドレスが空の行はスキップして次を探す
        Logger.log(`⚠️ 行${i+1}「${name}」はメールアドレスが空のためスキップ`);
        continue;
      }
      return {
        contactName: `${row[1] || ""} ${row[2] || ""}`.trim(),
        email:       email,
      };
    }
  }

  return null;
}

// ============================================================
// Google Drive から CV（PDF）を取得して添付用 Blob に変換
// 対応URL形式:
//   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//   https://drive.google.com/open?id=FILE_ID
// ============================================================
function fetchCvBlob(driveUrl, studentName) {
  if (!driveUrl || driveUrl.toString().trim() === "") {
    Logger.log("⚠️ CV列が空です");
    return null;
  }
  try {
    let fileId = null;
    const patternFileD   = driveUrl.match(/\/file\/d\/([-\w]{25,})/);
    const patternOpenId  = driveUrl.match(/[?&]id=([-\w]{25,})/);
    const patternFallback = driveUrl.match(/[-\w]{25,}/);

    if (patternFileD)    fileId = patternFileD[1];
    else if (patternOpenId)   fileId = patternOpenId[1];
    else if (patternFallback) fileId = patternFallback[0];
    else throw new Error(`Drive URL からFile IDを抽出できません: ${driveUrl}`);

    const file = DriveApp.getFileById(fileId);
    const ext  = file.getName().split(".").pop() || "pdf";
    return file.getBlob().setName(`CV_${studentName}.${ext}`);
  } catch (err) {
    Logger.log(`⚠️ CV取得失敗: ${err.message} | URL: ${driveUrl}`);
    return null;  // CV取得失敗でもメール送信は続行（本文にURLを記載）
  }
}

// ============================================================
// メール送信
// ============================================================
function sendEmail({ to, contactName, companyName, position, studentName, cvBlob, cvUrl, deadline }) {
  const subject = `[JVA Internship Board] New Applicant for ${position} at ${companyName}`;

  const body =
`Hi ${contactName},

This is Nahi from the JVA Internship Board.

We've identified a student who is highly interested in the ${position} at ${companyName}.
I've attached the student's CV for your review.

If the candidate passes your CV screening and you would like to proceed to an interview, could you kindly share multiple available time slots (2–3 options)? Once we receive your availability, we will coordinate with the student and confirm a time accordingly.

We would appreciate it if you could let us know your decision by ${deadline}.

Best regards,
Nahi
JVA Internship Board`;

  const options = {
    name:    CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
  };

  let finalBody = body;
  if (cvBlob) {
    options.attachments = [cvBlob];
  } else if (cvUrl) {
    finalBody += `\n\nCV/Resume link: ${cvUrl}`;
  }

  GmailApp.sendEmail(to, subject, finalBody, options);
}

// ============================================================
// 営業日ベースで返信期限を計算
// ============================================================
function calcDeadline(businessDays) {
  const d = new Date();
  let count = 0;
  while (count < businessDays) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;  // 土日スキップ
  }
  return Utilities.formatDate(d, "Asia/Tokyo", "MMMM d, yyyy");
}

// ============================================================
// エラー通知（自分のメールに届く）
// ============================================================
function notifyError(detail, studentName = "") {
  const to = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(
    to,
    `[JVA] ⚠️ 自動メール送信エラー`,
    `自動メールの送信に失敗しました。\n\n学生名: ${studentName}\n詳細: ${detail}\n\n手動で送信を確認してください。`
  );
}

// ============================================================
// 動作確認用テスト関数（本番前に手動実行して確認する）
// ============================================================
function testSendEmail() {
  sendEmail({
    to:          CONFIG.REPLY_TO,  // 自分に送って確認
    contactName: "TestContact",
    companyName: "Test Company",
    position:    "Test Intern",
    studentName: "Test Student",
    cvBlob:      null,
    cvUrl:       null,
    deadline:    calcDeadline(CONFIG.DEADLINE_BUSINESS_DAYS),
  });
  Logger.log("テストメール送信完了");
}

// ============================================================
// 企業検索のテスト（企業名を指定して担当者情報が取れるか確認）
// ============================================================
function testFindCompany() {
  const testName = "I&N Recruitment"; // ← 確認したい企業名に変更
  const result = findCompanyFromSpreadsheet(testName);
  if (result) {
    Logger.log(`✅ 見つかりました: ${result.contactName} <${result.email}>`);
  } else {
    Logger.log(`⚠️ 見つかりませんでした: "${testName}"`);
  }
}

// ============================================================
// 企業スプレッドシートから企業名一覧を取得して
// 学生フォームのプルダウン選択肢を自動更新する
//
// 設定:
//   STUDENT_FORM_ID  : 学生フォームのID（URLの /d/XXXXX/edit の XXXXX 部分）
//   COMPANY_QUESTION : フォーム内の企業名質問のタイトル（完全一致）
// ============================================================
const FORM_CONFIG = {
  STUDENT_FORM_ID:  "★ここにフォームIDを入れる★",  // 要設定
  COMPANY_QUESTION: "Company Name",               // フォームの質問タイトル（要確認）
};

function syncCompaniesToForm() {
  // 企業スプレッドシートから企業名一覧を取得
  const response = UrlFetchApp.fetch(
    `${CONFIG.STARTUPS_API_URL}?token=${CONFIG.STARTUPS_API_TOKEN}`,
    { followRedirects: true, muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) {
    throw new Error(`企業スプレッドシートの取得失敗 (HTTP ${response.getResponseCode()})`);
  }

  const rows = Utilities.parseCsv(response.getContentText());
  const companies = [];

  for (let i = 1; i < rows.length; i++) {
    const name5 = String(rows[i][5] || "").trim();
    const name4 = String(rows[i][4] || "").trim();
    const name  = name5 || name4;
    if (name && !companies.includes(name)) {
      companies.push(name);
    }
  }

  Logger.log(`企業一覧 (${companies.length}社): ${companies.join(", ")}`);

  // 学生フォームのプルダウンを更新
  const form = FormApp.openById(FORM_CONFIG.STUDENT_FORM_ID);
  const items = form.getItems();

  let updated = false;
  for (const item of items) {
    if (item.getTitle() === FORM_CONFIG.COMPANY_QUESTION) {
      item.asListItem().setChoiceValues(companies);
      updated = true;
      Logger.log(`✅ フォームのプルダウン「${FORM_CONFIG.COMPANY_QUESTION}」を更新しました`);
      break;
    }
  }

  if (!updated) {
    Logger.log(`⚠️ 質問「${FORM_CONFIG.COMPANY_QUESTION}」が見つかりません。FORM_CONFIGのCOMPANY_QUESTIONを確認してください`);
  }
}

// ============================================================
// デバッグ: 最終行の全列を番号付きで表示する
// → 「新規応募: → /」が出たときにまずこれを実行する
// ============================================================
function debugLastRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.FORM_SHEET_NAME);
  if (!sheet) {
    Logger.log(`❌ シート "${CONFIG.FORM_SHEET_NAME}" が見つかりません`);
    return;
  }

  const lastRow = sheet.getLastRow();
  const totalCols = sheet.getLastColumn();
  Logger.log(`シート: ${CONFIG.FORM_SHEET_NAME} / 最終行: ${lastRow} / 総列数: ${totalCols}`);

  // 下から最大10行を確認し、データが3列以上ある行を探す
  Logger.log("--- 下から10行のデータ確認 ---");
  const startRow = Math.max(1, lastRow - 9);
  const allRows = sheet.getRange(startRow, 1, lastRow - startRow + 1, totalCols).getValues();

  allRows.forEach((row, offset) => {
    const rowNum = startRow + offset;
    const nonEmpty = row.filter(v => v !== "" && v !== " " && v !== null);
    if (nonEmpty.length > 0) {
      Logger.log(`\n★ 行${rowNum} (${nonEmpty.length}列にデータあり):`);
      row.forEach((val, i) => {
        if (val !== "" && val !== " " && val !== null) {
          Logger.log(`  列${i+1}(${columnLetter(i+1)}): "${val}"`);
        }
      });
    } else {
      Logger.log(`行${rowNum}: 空`);
    }
  });
}

function columnLetter(n) {
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// ============================================================
// デバッグ: APIが何を返しているか生データで全確認
// ============================================================
function debugListCompanies() {
  const url = `${CONFIG.STARTUPS_API_URL}?token=${CONFIG.STARTUPS_API_TOKEN}`;
  Logger.log(`🔗 リクエストURL: ${url}`);

  const response = UrlFetchApp.fetch(url, { followRedirects: true, muteHttpExceptions: true });
  const code = response.getResponseCode();
  const body = response.getContentText();

  Logger.log(`📡 HTTPステータス: ${code}`);
  Logger.log(`📄 レスポンス先頭500文字:\n${body.substring(0, 500)}`);

  if (code !== 200) {
    Logger.log("❌ 200以外のレスポンス。URLかトークンが間違っている可能性があります");
    return;
  }

  const rows = Utilities.parseCsv(body);
  Logger.log(`📊 総行数: ${rows.length} / 総列数（1行目）: ${rows[0] ? rows[0].length : 0}`);

  Logger.log("--- 全行のdump（行番号: 列0 | 列1 | 列2 | 列3 | 列4 | 列5）---");
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    Logger.log(`行${i+1}: ${r[0]||""} | ${r[1]||""} | ${r[2]||""} | ${r[3]||""} | ${r[4]||""} | ${r[5]||""}`);
  }
}
