#!/usr/bin/env node
/**
 * generate.js — スライド生成メインエントリーポイント
 *
 * Usage:
 *   node generate.js <deck-json-file> [output-name]
 *
 * Example:
 *   node generate.js deck.json "JVA-IB紹介"
 *   → JVA-IB紹介.pptx が生成される
 */

const fs = require("fs");
const path = require("path");
const { renderDeck } = require("./render-engine");
const { validateDeck } = require("./validate-slide");

// 生成済みスライドの保存先（ここを変更すれば保存先が変わる）
const OUTPUT_DIR = path.resolve(__dirname, "../../company_jva/strategy/slides");

async function main() {
  const deckFile = process.argv[2];
  const outputName = process.argv[3] || "output";

  if (!deckFile) {
    console.error("Usage: node generate.js <deck-json-file> [output-name]");
    console.error("Example: node generate.js deck.json 'JVA事業説明'");
    process.exit(1);
  }

  if (!fs.existsSync(deckFile)) {
    console.error(`❌ ファイルが見つかりません: ${deckFile}`);
    process.exit(1);
  }

  let deckDef;
  try {
    deckDef = JSON.parse(fs.readFileSync(deckFile, "utf-8"));
  } catch (e) {
    console.error(`❌ JSON パースエラー: ${e.message}`);
    process.exit(1);
  }

  // 品質チェック（事前）
  const issues = validateDeck(deckDef);
  if (issues.length > 0) {
    console.log(`⚠️ 品質チェック警告 (${issues.length} 件):`);
    issues.forEach((issue) => console.log(`  - ${issue}`));
    console.log("");
  }

  // スライド生成
  console.log(`🎨 スライド生成中... (${deckDef.slides?.length || 0} スライド)`);
  const pres = renderDeck(deckDef);

  // 出力先: company_jva/strategy/slides/ に保存
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `${outputName}.pptx`);
  await pres.writeFile({ fileName: outputPath });

  console.log(`✅ 生成完了: ${outputPath}`);
  console.log("");
  console.log("次のステップ:");
  console.log("  1. ファイルを開いて確認: open " + JSON.stringify(outputPath));
  console.log("  2. Google Driveにアップロード: node upload-to-drive.js " + JSON.stringify(outputPath));
  console.log("  3. 修正が必要な場合はJSONを編集して再実行");
}

main().catch((err) => {
  console.error("❌ エラー:", err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
