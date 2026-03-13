#!/usr/bin/env node
/**
 * auth-drive.js — Google Drive OAuth2 認証（初回のみ実行）
 *
 * 実行方法: node auth-drive.js
 * → ブラウザが開くので Google アカウントを認証する
 * → token.json が生成される（2回目以降は自動接続）
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const http = require("http");
const url = require("url");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

async function main() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error("❌ credentials.json が見つかりません");
    console.error("");
    console.error("セットアップ手順:");
    console.error("  1. https://console.cloud.google.com/ にアクセス");
    console.error("  2. 新しいプロジェクトを作成（または既存を選択）");
    console.error("  3. 「APIとサービス」→「認証情報」→「OAuthクライアントID」を作成");
    console.error("  4. アプリケーション種別: デスクトップアプリ");
    console.error("  5. credentials.json をダウンロードしてこのフォルダに配置");
    console.error("  6. Google Drive API を有効化");
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, "http://localhost:3000");

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("🔐 ブラウザで認証してください:");
  console.log(authUrl);
  console.log("");

  // ローカルサーバーでコールバック受信
  const server = http.createServer(async (req, res) => {
    const qs = new url.URL(req.url, "http://localhost:3000").searchParams;
    const code = qs.get("code");

    if (!code) {
      res.end("認証コードが見つかりません");
      return;
    }

    res.end("✅ 認証成功！このタブを閉じてください。");
    server.close();

    const { tokens } = await oAuth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`✅ token.json を保存しました: ${TOKEN_PATH}`);
    console.log("次回からは自動的に認証されます。");
  });

  server.listen(3000, () => {
    console.log("認証待機中 (http://localhost:3000)...");
    // macOS でブラウザを開く
    const { exec } = require("child_process");
    exec(`open "${authUrl}"`, (err) => {
      if (err) console.log("手動でURLをブラウザに貼り付けてください");
    });
  });
}

main().catch(console.error);
