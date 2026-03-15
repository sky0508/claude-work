#!/usr/bin/env node
/**
 * upload-to-drive.js — Google Drive アップロード
 *
 * Usage: node upload-to-drive.js <pptx-file> [folder-id]
 *
 * 初回実行前に: node auth-drive.js で認証が必要
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("credentials.json が見つかりません。node auth-drive.js を先に実行してください");
  }
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("token.json が見つかりません。node auth-drive.js を先に実行してください");
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000");
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
}

async function uploadFile(filePath, folderId) {
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const fileName = path.basename(filePath);

  // 同名ファイルが存在するか確認
  const existingFiles = await drive.files.list({
    q: `name='${fileName}' and trashed=false${folderId ? ` and '${folderId}' in parents` : ""}`,
    fields: "files(id, name)",
  });

  const mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

  if (existingFiles.data.files.length > 0) {
    // 上書き更新（URLが変わらない）
    const fileId = existingFiles.data.files[0].id;
    await drive.files.update({
      fileId,
      media: {
        mimeType,
        body: fs.createReadStream(filePath),
      },
    });
    console.log(`✅ 更新完了: https://docs.google.com/presentation/d/${fileId}`);
    return fileId;
  } else {
    // 新規アップロード
    const fileMetadata = {
      name: fileName,
      mimeType: "application/vnd.google-apps.presentation",
      ...(folderId ? { parents: [folderId] } : {}),
    };
    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: fs.createReadStream(filePath),
      },
      fields: "id",
    });
    const fileId = res.data.id;
    console.log(`✅ アップロード完了: https://docs.google.com/presentation/d/${fileId}`);
    return fileId;
  }
}

// CLI 実行
if (require.main === module) {
  const filePath = process.argv[2];
  const folderId = process.argv[3];

  if (!filePath) {
    console.error("Usage: node upload-to-drive.js <pptx-file> [folder-id]");
    process.exit(1);
  }

  uploadFile(filePath, folderId).catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
  });
}

module.exports = { uploadFile };
