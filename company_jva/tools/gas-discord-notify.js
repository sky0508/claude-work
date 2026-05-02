// ===== Google Form → Discord通知スクリプト =====
// 対象: スタートアップ登録フォームのスプレッドシート
// 設定手順:
//   1. DISCORD_WEBHOOK_URL に実際のWebhook URLを貼る
//   2. トリガー設定: onStartupFormSubmit → スプレッドシートから → フォーム送信時

// ===== CONFIG =====
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1496849680875782326/zehO4JpyG1Gd9H0uFUTWm-Eanobi3oYRGGbYd2Rx9MM4SyotTZexbqvQXGkEwejET7J_";
const COL_COMPANY_NAME = 6;  // F列: Company Name
const COLS_INTERNSHIP = [12, 27, 42]; // L, AA, AP列: Internship Role

// "Business Internship (...)" → "Business" のように先頭ワードだけ抽出
function simplifyInternshipType(value) {
  if (!value) return null;
  const match = value.match(/^(\w+)/);
  return match ? match[1].toLowerCase() : null;
}

// ===== MAIN =====
function onStartupFormSubmit() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const row = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const companyName = row[COL_COMPANY_NAME - 1]; // F列: Company Name

  // L/AA/AP列から internship type を収集（重複除去）
  const types = [...new Set(
    COLS_INTERNSHIP
      .map(col => simplifyInternshipType(row[col - 1]))
      .filter(Boolean)
  )];
  const typesStr = types.length > 0 ? types.join(" / ") : "n/a";

  const formattedDate = Utilities.formatDate(
    new Date(),
    "Asia/Tokyo",
    "yyyy-MM-dd HH:mm"
  );

  const message = {
    content: `🚀 New startup application just came in!\n\n**Company**: ${companyName}\n**Wants**: ${typesStr}\n**Submitted**: ${formattedDate}`
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
}
