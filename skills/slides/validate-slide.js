/**
 * validate-slide.js — スライド品質チェック
 *
 * deckDef JSON を受け取り、品質問題のリストを返す。
 * Usage: node validate-slide.js deck.json
 */

const KNOWN_LAYOUTS = [
  "kpi-three-col", "doughnut-three-col", "two-col-text-chart", "case-two-col",
  "qa-grid", "pricing-table", "step-flow", "logo-wall", "comparison-table",
  "timeline", "quote", "before-after-split", "text-data-emphasis",
  "vertical-timeline", "venn-diagram", "chat-dialogue", "year-list",
  "three-column", "three-step-column", "matrix-quadrant", "ceo-message",
  "member-grid", "member-three-col", "funnel", "pyramid", "parallel-items",
  "containment", "cycle", "radial-spread", "convergence", "three-way-relation",
  "kpi-formula", "kpi-logic-tree", "business-concept", "step-up",
  "channel-mapping", "tam-concentric", "tam-parallel", "schedule-list",
  "pie-chart-highlight", "location-map", "user-pain-points",
  "horizontal-bar-ranking", "stacked-bar-chart", "fullscreen-photo",
  "awards-parallel", "checklist-table", "numbered-feature-cards",
];

/**
 * デッキ定義の品質チェックを実行する。
 * @param {object} deckDef
 * @returns {string[]} 問題のリスト（空なら問題なし）
 */
function validateDeck(deckDef) {
  const issues = [];

  if (!deckDef.slides || !Array.isArray(deckDef.slides)) {
    issues.push("slides 配列が定義されていません");
    return issues;
  }

  const types = deckDef.slides.map((s) => s.type);

  if (!types.includes("cover")) {
    issues.push("表紙スライド (type: cover) がありません");
  }
  if (!types.includes("ending")) {
    issues.push("終了スライド (type: ending) がありません");
  }

  deckDef.slides.forEach((slide, i) => {
    const num = i + 1;

    if (slide.title && slide.title.length > 50) {
      issues.push(`スライド${num}: タイトルが長すぎます（${slide.title.length}文字 > 50文字）`);
    }

    if (slide.type === "content" || slide.type === "case-study") {
      if (!slide.layout) {
        issues.push(`スライド${num} ("${slide.title || "無題"}"): layout が未指定です`);
      } else if (!KNOWN_LAYOUTS.includes(slide.layout)) {
        issues.push(`スライド${num}: 未知のレイアウト "${slide.layout}"`);
      }

      if (!slide.content || Object.keys(slide.content).length === 0) {
        issues.push(`スライド${num} ("${slide.title || "無題"}"): content が空です`);
      }
    }
  });

  return issues;
}

// CLI 実行
if (require.main === module) {
  const fs = require("fs");
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: node validate-slide.js <deck-json-file>");
    process.exit(1);
  }

  const deckDef = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const issues = validateDeck(deckDef);

  if (issues.length === 0) {
    console.log("✅ 品質チェック: 問題なし");
  } else {
    console.log(`⚠️ 品質チェック: ${issues.length} 件の問題が見つかりました`);
    issues.forEach((issue) => console.log(`  - ${issue}`));
    process.exit(1);
  }
}

module.exports = { validateDeck };
