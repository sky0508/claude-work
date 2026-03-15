/**
 * render-engine.js — JSON → PPTX テンプレートエンジン
 *
 * deckDef (JSON) を受け取り、PptxGenJS インスタンスを生成・返却する。
 * レイアウトは registerLayout() で拡張可能。47 種の組み込みレイアウトを同梱。
 */

const pptxgen = require("pptxgenjs");
const {
  COLORS,
  FONTS,
  LAYOUT,
  CHART_COLORS,
  PageCounter,
  assetPath,
  assetPathIfExists,
  addContentSlide,
  addSectionSlide,
  addCoverSlide,
  addEndingSlide,
  hCell,
  lCell,
  dCell,
  defaultBarConfig,
  defaultDoughnutConfig,
  topBorderCard,
} = require("./shared");

// ============================================================
// レイアウトレジストリ
// ============================================================

const layoutRenderers = {};

/**
 * レイアウトレンダラーを登録する。
 * @param {string} name - レイアウト名
 * @param {function} renderFn - (pres, slide, content, slideDef) => void
 */
function registerLayout(name, renderFn) {
  layoutRenderers[name] = renderFn;
}

// ============================================================
// コア API
// ============================================================

/**
 * デッキ定義 (JSON) から PptxGenJS プレゼンテーションを生成する。
 * @param {object} deckDef - デッキ定義オブジェクト
 * @param {object} [opts={}] - オプション
 * @returns {object} pres - PptxGenJS インスタンス（caller が writeFile 可能）
 */
function renderDeck(deckDef, opts = {}) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = deckDef.author || "JVA";

  const pg = new PageCounter();

  if (Array.isArray(deckDef.slides)) {
    for (const slideDef of deckDef.slides) {
      renderSlide(pres, slideDef, pg, opts);
    }
  }

  return pres;
}

/**
 * 単一スライドをレンダリングする。slideDef.type に応じてディスパッチ。
 */
function renderSlide(pres, slideDef, pg, opts = {}) {
  switch (slideDef.type) {
    case "cover":
      return renderCover(pres, slideDef);
    case "section":
      return addSectionSlide(pres, slideDef.title, {
        subtitle: slideDef.subtitle,
      });
    case "content":
      return renderContent(pres, slideDef, pg, opts);
    case "case-study":
      return renderContent(pres, slideDef, pg, opts);
    case "ending":
      return renderEnding(pres, slideDef);
    default:
      return renderContent(pres, slideDef, pg, opts);
  }
}

// ============================================================
// スライドレンダラー
// ============================================================

function renderCover(pres, def) {
  return addCoverSlide(pres, {
    title: def.title,
    subtitle: def.subtitle,
    catchphrase: def.catchphrase,
    version: def.version,
  });
}

function renderContent(pres, def, pg, opts) {
  const slide = addContentSlide(pres, def.sectionName || "", pg.next(), opts);

  if (def.title) {
    slide.addText(def.title, {
      x: 0.3, y: 0.44, w: 9.0, h: 0.5,
      fontSize: 22, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true, valign: "middle",
    });
  }

  if (def.type === "case-study" && def.title) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.08, w: 2.0, h: 0.04,
      fill: { color: COLORS.brandRed },
    });
  }

  if (def.layout && layoutRenderers[def.layout]) {
    layoutRenderers[def.layout](pres, slide, def.content || {}, def);
  }

  if (def.source) {
    slide.addText(def.source, {
      x: 0.3, y: 4.95, w: 9.4, h: 0.25,
      fontSize: 8, fontFace: FONTS.caption,
      color: COLORS.textMuted, align: "right", valign: "bottom",
    });
  }

  return slide;
}

function renderEnding(pres, def) {
  return addEndingSlide(pres, def);
}

// ============================================================
// 組み込みレイアウトレンダラー (47 種)
// ============================================================

// ─── 1. kpi-three-col ───
registerLayout("kpi-three-col", (pres, slide, content) => {
  const items = content.items || [];
  items.forEach((kpi, i) => {
    if (i >= 3) return;
    const x = LAYOUT.threeCol.colX(i);
    const cardW = LAYOUT.threeCol.colWidth;
    slide.addText(kpi.value, {
      x, y: 1.8, w: cardW, h: 1.0,
      fontSize: 52, fontFace: FONTS.accent,
      color: COLORS.brandRed, bold: true,
      align: "center", valign: "middle",
    });
    slide.addText(kpi.label, {
      x, y: 2.8, w: cardW, h: 0.4,
      fontSize: 14, fontFace: FONTS.body,
      color: COLORS.textMuted, align: "center",
    });
  });
});

// ─── 2. doughnut-three-col ───
registerLayout("doughnut-three-col", (pres, slide, content) => {
  const charts = content.charts || [];
  charts.forEach((chart, i) => {
    if (i >= 3) return;
    const x = LAYOUT.threeCol.colX(i);
    const colW = LAYOUT.threeCol.colWidth;

    if (chart.title) {
      slide.addText(chart.title, {
        x, y: 1.3, w: colW, h: 0.4,
        fontSize: 12, fontFace: FONTS.body,
        color: COLORS.textDark, bold: true, align: "center",
      });
    }

    const chartData = [{
      name: chart.title || "",
      labels: chart.labels || [],
      values: chart.values || [],
    }];
    const colorSlice = CHART_COLORS.sequence.slice(0, (chart.labels || []).length);
    slide.addChart(pres.charts.DOUGHNUT, chartData, {
      x: x + (colW - 2.8) / 2, y: 1.8, w: 2.8, h: 2.8,
      holeSize: 55, chartColors: colorSlice,
      showValue: true, valueFontSize: 8,
      valueFontFace: FONTS.body, showLegend: false,
    });
  });
});

// ─── 3. two-col-text-chart ───
registerLayout("two-col-text-chart", (pres, slide, content) => {
  const left = content.left || {};
  const right = content.right || {};
  let leftY = 1.2;

  if (left.heading) {
    slide.addText(left.heading, {
      x: 0.5, y: leftY, w: 4.0, h: 0.4,
      fontSize: 16, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true,
    });
    leftY += 0.5;
  }

  if (left.body) {
    slide.addText(left.body, {
      x: 0.5, y: leftY, w: 4.0, h: 1.5,
      fontSize: 11, fontFace: FONTS.body,
      color: COLORS.textBlack, lineSpacingMultiple: 1.4, valign: "top",
    });
    leftY += 1.6;
  }

  if (left.callout) {
    slide.addText(left.callout.value, {
      x: 0.5, y: leftY, w: 3.0, h: 1.0,
      fontSize: 48, fontFace: FONTS.accent,
      color: COLORS.brandRed, bold: true, valign: "bottom",
    });
    if (left.callout.unit) {
      slide.addText(left.callout.unit, {
        x: 0.5, y: leftY + 1.0, w: 3.0, h: 0.4,
        fontSize: 14, fontFace: FONTS.body, color: COLORS.textMuted,
      });
    }
  }

  if (right.data) {
    const chartData = [{
      name: right.data.name || "",
      labels: right.data.labels || [],
      values: right.data.values || [],
    }];

    if (right.chartType === "doughnut") {
      slide.addChart(pres.charts.DOUGHNUT, chartData,
        defaultDoughnutConfig({
          x: 4.8, y: 1.0, w: 5.0, h: 4.0,
          ...(right.config || {}),
        })
      );
    } else {
      slide.addChart(pres.charts.BAR, chartData,
        defaultBarConfig({
          x: 4.8, y: 1.0, w: 5.0, h: 4.0,
          ...(right.config || {}),
        })
      );
    }
  }
});

// ─── 4. case-two-col ───
registerLayout("case-two-col", (pres, slide, content) => {
  const leftX = 0.3;
  const rightX = 5.0;
  const leftW = 4.4;
  const rightW = 4.7;
  let leftY = 1.3;
  let rightY = 1.3;

  if (content.companyName) {
    slide.addText(content.companyName, {
      x: leftX, y: leftY, w: leftW, h: 0.45,
      fontSize: 16, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true,
    });
    leftY += 0.55;
  }

  if (Array.isArray(content.info) && content.info.length > 0) {
    const infoRows = content.info.map((item) => [
      lCell(item.key, { align: "left" }),
      dCell(item.value),
    ]);
    slide.addTable(infoRows, {
      x: leftX, y: leftY, w: leftW,
      colW: [1.4, 3.0], rowH: 0.35,
      border: { type: "solid", color: COLORS.divider, pt: 0.5 },
      margin: [3, 5, 3, 5],
    });
    leftY += content.info.length * 0.35 + 0.15;
  }

  if (Array.isArray(content.metrics) && content.metrics.length > 0) {
    const metricRows = content.metrics.map((item) => [
      lCell(item.key, { align: "left" }),
      dCell(item.value, { bold: true, align: "center" }),
    ]);
    slide.addTable(metricRows, {
      x: rightX, y: rightY, w: rightW,
      colW: [2.0, 2.7], rowH: 0.35,
      border: { type: "solid", color: COLORS.divider, pt: 0.5 },
      margin: [3, 5, 3, 5],
    });
    rightY += content.metrics.length * 0.35 + 0.2;
  }

  if (Array.isArray(content.highlights) && content.highlights.length > 0) {
    const hlRows = content.highlights.map((item) => [
      lCell(item.label, { align: "left" }),
      dCell(item.content),
    ]);
    slide.addTable(hlRows, {
      x: rightX, y: rightY, w: rightW,
      colW: [1.5, 3.2], rowH: 0.4,
      border: { type: "solid", color: COLORS.divider, pt: 0.5 },
      margin: [3, 5, 3, 5],
    });
  }
});

// ─── 5. qa-grid ───
registerLayout("qa-grid", (pres, slide, content) => {
  const items = content.items || [];
  const positions = [
    { x: 0.3, y: 1.2 }, { x: 5.1, y: 1.2 },
    { x: 0.3, y: 3.2 }, { x: 5.1, y: 3.2 },
  ];
  const cardW = 4.6;
  const cardH = 1.8;

  items.forEach((item, i) => {
    if (i >= 4) return;
    const pos = positions[i];

    slide.addShape(pres.shapes.RECTANGLE, {
      x: pos.x, y: pos.y, w: cardW, h: cardH,
      fill: { color: COLORS.offWhite }, rectRadius: 0.05,
    });
    slide.addText(`Q${i + 1}`, {
      x: pos.x + 0.1, y: pos.y + 0.1, w: 0.4, h: 0.3,
      fontSize: 11, fontFace: FONTS.accent,
      color: COLORS.white, bold: true,
      align: "center", valign: "middle",
      fill: { color: COLORS.brandRed }, rectRadius: 0.03,
    });
    slide.addText(item.q, {
      x: pos.x + 0.6, y: pos.y + 0.1, w: cardW - 0.8, h: 0.35,
      fontSize: 12, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true, valign: "middle",
    });
    slide.addText(item.a, {
      x: pos.x + 0.2, y: pos.y + 0.55, w: cardW - 0.4, h: cardH - 0.7,
      fontSize: 10, fontFace: FONTS.body,
      color: COLORS.textBlack, lineSpacingMultiple: 1.3, valign: "top",
    });
  });
});

// ─── 6. pricing-table ───
registerLayout("pricing-table", (pres, slide, content) => {
  const headers = content.headers || [];
  const rows = content.rows || [];

  const STYLE_MAP = {
    blueHeader: {
      bold: true, fontSize: 11, fontFace: FONTS.body,
      color: "FFFFFF", fill: { color: COLORS.brandRed },
      align: "center", valign: "middle",
    },
    darkHeader: {
      bold: true, fontSize: 11, fontFace: FONTS.body,
      color: "FFFFFF", fill: { color: COLORS.headerDark },
      align: "center", valign: "middle",
    },
    labelCell: {
      bold: true, fontSize: 10, fontFace: FONTS.body,
      color: "FFFFFF", fill: { color: COLORS.tableLabelGray },
      valign: "middle",
    },
    dataCell: {
      fontSize: 10, fontFace: FONTS.body,
      color: COLORS.textBlack, valign: "middle",
    },
  };

  const headerRow = headers.map((h) => {
    const style = STYLE_MAP[h.style] || STYLE_MAP.darkHeader;
    return { text: h.text, options: { ...style, colspan: h.colspan || 1 } };
  });

  const dataRows = rows.map((row) =>
    row.map((cell) => {
      const style = STYLE_MAP[cell.style] || STYLE_MAP.dataCell;
      return { text: cell.text, options: { ...style } };
    })
  );

  const allRows = [headerRow, ...dataRows];
  const colCount = Math.max(
    ...allRows.map((r) => r.reduce((sum, c) => sum + (c.options.colspan || 1), 0))
  );
  const tableW = 9.4;
  const colW = Array(colCount).fill(tableW / colCount);

  slide.addTable(allRows, {
    x: 0.3, y: 1.2, w: tableW, colW, rowH: 0.4,
    border: { type: "solid", color: COLORS.divider, pt: 0.5 },
    margin: [3, 6, 3, 6],
  });
});

// ─── 7. step-flow ───
registerLayout("step-flow", (pres, slide, content) => {
  const steps = content.steps || [];
  const count = Math.min(steps.length, 6);
  if (count === 0) return;

  const startX = 0.3;
  const gap = 0.15;
  const totalW = 9.4;
  const colW = (totalW - gap * (count - 1)) / count;

  const circleY = 1.15;
  const circleD = 0.4;
  const labelY = circleY + circleD + 0.12;
  const cardY = labelY + 0.55;
  const cardH = count <= 4 ? 2.6 : 2.2;
  const durationY = cardY + cardH + 0.12;

  const labelFs = count <= 4 ? 14 : 12;
  const descFs = count <= 4 ? 10 : 9;
  const numFs = count <= 4 ? 14 : 12;

  steps.forEach((step, i) => {
    if (i >= count) return;
    const x = startX + i * (colW + gap);
    const centerX = x + colW / 2;

    slide.addShape(pres.shapes.OVAL, {
      x: centerX - circleD / 2, y: circleY, w: circleD, h: circleD,
      fill: { color: COLORS.brandAccent },
    });
    slide.addText(String(i + 1), {
      x: centerX - circleD / 2, y: circleY, w: circleD, h: circleD,
      fontSize: numFs, fontFace: FONTS.accent, color: COLORS.white,
      bold: true, align: "center", valign: "middle",
    });

    if (i < count - 1) {
      const lineStartX = centerX + circleD / 2 + 0.02;
      const nextCenterX = startX + (i + 1) * (colW + gap) + colW / 2;
      const lineEndX = nextCenterX - circleD / 2 - 0.02;
      const lineY = circleY + circleD / 2;
      slide.addShape(pres.shapes.LINE, {
        x: lineStartX, y: lineY, w: lineEndX - lineStartX, h: 0,
        line: { color: COLORS.brandAccent, width: 1.5 },
      });
      slide.addText("▶", {
        x: lineEndX - 0.15, y: lineY - 0.12, w: 0.2, h: 0.24,
        fontSize: 8, fontFace: FONTS.body, color: COLORS.brandAccent,
        align: "center", valign: "middle",
      });
    }

    slide.addText(step.label || "", {
      x, y: labelY, w: colW, h: 0.45,
      fontSize: labelFs, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: cardY, w: colW, h: cardH,
      fill: { color: COLORS.offWhite }, rectRadius: 0.06,
    });
    if (step.description) {
      slide.addText(step.description, {
        x: x + 0.1, y: cardY + 0.1, w: colW - 0.2, h: cardH - 0.2,
        fontSize: descFs, fontFace: FONTS.body, color: COLORS.textBlack,
        lineSpacingMultiple: 1.35, valign: "top", align: "left",
      });
    }

    if (step.duration) {
      const badgeW = Math.min(colW - 0.2, 1.2);
      slide.addText(step.duration, {
        x: centerX - badgeW / 2, y: durationY, w: badgeW, h: 0.3,
        fontSize: 9, fontFace: FONTS.body, color: COLORS.brandAccent,
        bold: true, align: "center", valign: "middle",
        border: { type: "solid", color: COLORS.brandAccent, pt: 0.75 },
        rectRadius: 0.04,
      });
    }
  });
});

// ─── 8. logo-wall ───
registerLayout("logo-wall", (pres, slide, content) => {
  const logos = content.logos || [];
  const cols = 4;
  const cellW = 2.2;
  const cellH = 1.2;
  const startX = 0.5;
  const startY = 1.3;
  const gapX = 0.2;
  const gapY = 0.15;

  logos.forEach((logo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cellW + gapX);
    const y = startY + row * (cellH + gapY);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cellW, h: cellH,
      fill: { color: COLORS.offWhite }, rectRadius: 0.05,
    });

    const imgPath = logo.path ? assetPathIfExists(logo.path) : null;
    if (imgPath) {
      slide.addImage({
        path: imgPath,
        x: x + 0.3, y: y + 0.15, w: cellW - 0.6, h: cellH - 0.3,
        sizing: { type: "contain" },
      });
    } else {
      slide.addText(logo.name, {
        x, y, w: cellW, h: cellH,
        fontSize: 12, fontFace: FONTS.body,
        color: COLORS.textDark, bold: true,
        align: "center", valign: "middle",
      });
    }
  });
});

// ─── 9. comparison-table ───
registerLayout("comparison-table", (pres, slide, content) => {
  const rows = content.rows || [];
  const beforeTitle = content.beforeTitle || "Before";
  const afterTitle = content.afterTitle || "After";

  // 行数に応じてrowHを自動調整（スライド全体を埋める）
  const tableStartY = 1.1;
  const tableMaxH = 4.4; // タイトル下から下端まで
  const totalRows = rows.length + 1; // データ行 + ヘッダー行
  const rowH = Math.min(0.75, tableMaxH / totalRows);

  const headerRow = [
    hCell("", { fill: { color: COLORS.tableLabelGray } }),
    hCell(beforeTitle, { fill: { color: COLORS.headerDark } }),
    hCell(afterTitle, { fill: { color: COLORS.brandRed } }),
  ];

  const dataRows = rows.map((row) => [
    lCell(row.category, { align: "left", fontSize: 12 }),
    dCell(row.before, { align: "center", fontSize: 12 }),
    dCell(row.after, { align: "center", bold: true, color: COLORS.brandRed, fontSize: 12 }),
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.3, y: tableStartY, w: 9.4,
    colW: [2.4, 3.5, 3.5], rowH,
    border: { type: "solid", color: COLORS.divider, pt: 0.5 },
    margin: [6, 8, 6, 8],
  });
});

// ─── 10. timeline ───
registerLayout("timeline", (pres, slide, content) => {
  // accepts both content.items[] and content.events[] for backwards compatibility
  const items = content.items || content.events || [];
  const count = Math.min(items.length, 6);
  if (count === 0) return;

  const lineStartX = 0.3;
  const lineEndX = 9.7;
  const lineW = lineEndX - lineStartX;
  const lineY = 3.1;
  // Slot-based positioning: each item owns an equal segment of the line
  const slotW = lineW / count;

  slide.addShape(pres.shapes.LINE, {
    x: lineStartX, y: lineY, w: lineW, h: 0,
    line: { color: COLORS.brandRed, width: 2 },
  });

  items.forEach((item, i) => {
    if (i >= count) return;
    const cx = lineStartX + (i + 0.5) * slotW;
    const bx = cx - slotW / 2 + 0.05;
    const bw = slotW - 0.1;

    slide.addShape(pres.shapes.OVAL, {
      x: cx - 0.12, y: lineY - 0.12, w: 0.24, h: 0.24,
      fill: { color: COLORS.brandRed },
    });
    slide.addText(item.date || "", {
      x: bx, y: lineY - 0.95, w: bw, h: 0.75,
      fontSize: 10, fontFace: FONTS.accent,
      color: COLORS.brandRed, bold: true,
      align: "center", valign: "bottom",
    });
    slide.addText(item.title || "", {
      x: bx, y: lineY + 0.2, w: bw, h: 0.45,
      fontSize: 11, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true,
      align: "center", valign: "top",
    });
    if (item.description) {
      slide.addText(item.description, {
        x: bx, y: lineY + 0.7, w: bw, h: 1.25,
        fontSize: 9, fontFace: FONTS.body,
        color: COLORS.textMuted, align: "center",
        valign: "top", lineSpacingMultiple: 1.2,
      });
    }
  });
});

// ─── 11. quote ───
registerLayout("quote", (pres, slide, content) => {
  slide.addText("\u201C", {
    x: 0.8, y: 1.2, w: 1.0, h: 1.0,
    fontSize: 80, fontFace: FONTS.heading,
    color: COLORS.brandRed, bold: true, valign: "top",
  });
  slide.addText(content.text || "", {
    x: 1.2, y: 1.8, w: 7.6, h: 1.8,
    fontSize: 18, fontFace: FONTS.body,
    color: COLORS.textDark, italic: true,
    lineSpacingMultiple: 1.5, valign: "top",
  });
  slide.addShape(pres.shapes.LINE, {
    x: 1.2, y: 3.8, w: 2.5, h: 0,
    line: { color: COLORS.brandRed, width: 2 },
  });

  let roleCompany = "";
  if (content.role) roleCompany += content.role;
  if (content.company) {
    roleCompany += roleCompany ? ` / ${content.company}` : content.company;
  }

  slide.addText(content.author || "", {
    x: 1.2, y: 4.0, w: 7.6, h: 0.4,
    fontSize: 14, fontFace: FONTS.heading,
    color: COLORS.textDark, bold: true,
  });
  if (roleCompany) {
    slide.addText(roleCompany, {
      x: 1.2, y: 4.4, w: 7.6, h: 0.35,
      fontSize: 12, fontFace: FONTS.body, color: COLORS.textMuted,
    });
  }
});

// ─── 12. before-after-split ───
registerLayout("before-after-split", (pres, slide, content) => {
  const before = content.before || {};
  const after = content.after || {};
  const panelY = 1.2;
  const panelH = 3.8;
  const panelW = 4.6;
  const leftX = 0.3;
  const rightX = 5.1;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: leftX, y: panelY, w: panelW, h: panelH,
    fill: { color: COLORS.headerDark }, rectRadius: 0.08,
  });
  slide.addText(before.title || "Before", {
    x: leftX + 0.3, y: panelY + 0.2, w: panelW - 0.6, h: 0.45,
    fontSize: 16, fontFace: FONTS.heading,
    color: COLORS.white, bold: true,
  });
  if (Array.isArray(before.points)) {
    const bulletText = before.points.map((p) => `•  ${p}`).join("\n");
    slide.addText(bulletText, {
      x: leftX + 0.3, y: panelY + 0.8, w: panelW - 0.6, h: panelH - 1.1,
      fontSize: 11, fontFace: FONTS.body,
      color: COLORS.white, lineSpacingMultiple: 1.5, valign: "top",
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: rightX, y: panelY, w: panelW, h: panelH,
    fill: { color: COLORS.lightRed }, rectRadius: 0.08,
  });
  slide.addText(after.title || "After", {
    x: rightX + 0.3, y: panelY + 0.2, w: panelW - 0.6, h: 0.45,
    fontSize: 16, fontFace: FONTS.heading,
    color: COLORS.textDark, bold: true,
  });
  if (Array.isArray(after.points)) {
    const bulletText = after.points.map((p) => `•  ${p}`).join("\n");
    slide.addText(bulletText, {
      x: rightX + 0.3, y: panelY + 0.8, w: panelW - 0.6, h: panelH - 1.1,
      fontSize: 11, fontFace: FONTS.body,
      color: COLORS.textDark, lineSpacingMultiple: 1.5, valign: "top",
    });
  }
});

// ─── 13. text-data-emphasis ───
registerLayout("text-data-emphasis", (pres, slide, content) => {
  if (content.narrative) {
    slide.addText(content.narrative, {
      x: 0.5, y: 1.0, w: 4.5, h: 3.5,
      fontSize: 16, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.5, valign: "top",
    });
  }
  slide.addShape(pres.shapes.LINE, {
    x: 5.2, y: 1.0, w: 0, h: 3.5,
    line: { color: COLORS.divider, width: 1 },
  });
  if (content.bigNumber) {
    slide.addText(content.bigNumber, {
      x: 5.5, y: 1.5, w: 4.0, h: 2.0,
      fontSize: 96, fontFace: FONTS.accent, color: COLORS.textBlack,
      bold: true, align: "center", valign: "middle",
    });
  }
  if (content.bigNumberLabel) {
    slide.addText(content.bigNumberLabel, {
      x: 5.5, y: 3.5, w: 4.0, h: 0.5,
      fontSize: 14, fontFace: FONTS.body, color: COLORS.textMuted,
      align: "center",
    });
  }
});

// ─── 14. vertical-timeline ───
registerLayout("vertical-timeline", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 6);
  if (count === 0) return;

  const lineX = 5.0;
  const startY = 1.2;
  const endY = 4.8;
  const totalH = endY - startY;

  slide.addShape(pres.shapes.LINE, {
    x: lineX, y: startY, w: 0, h: totalH,
    line: { color: COLORS.brandRed, width: 2 },
  });

  items.forEach((item, i) => {
    if (i >= count) return;
    const y = count > 1
      ? startY + i * (totalH / (count - 1))
      : startY + totalH / 2;
    const isLeft = i % 2 === 0;

    slide.addShape(pres.shapes.OVAL, {
      x: lineX - 0.12, y: y - 0.12, w: 0.24, h: 0.24,
      fill: { color: COLORS.brandRed },
    });

    const textX = isLeft ? 0.3 : 5.4;
    const textW = 4.3;
    const textAlign = isLeft ? "right" : "left";

    if (item.date) {
      slide.addText(item.date, {
        x: textX, y: y - 0.35, w: textW, h: 0.3,
        fontSize: 10, fontFace: FONTS.accent,
        color: COLORS.brandRed, bold: true, align: textAlign,
      });
    }
    slide.addText(item.title || "", {
      x: textX, y: y - 0.05, w: textW, h: 0.3,
      fontSize: 12, fontFace: FONTS.heading,
      color: COLORS.textDark, bold: true, align: textAlign,
    });
    if (item.description) {
      slide.addText(item.description, {
        x: textX, y: y + 0.25, w: textW, h: 0.35,
        fontSize: 9, fontFace: FONTS.body,
        color: COLORS.textMuted, align: textAlign, valign: "top",
      });
    }
  });
});

// ─── 15. venn-diagram ───
registerLayout("venn-diagram", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 3);
  if (count === 0) return;

  const positions = count === 2
    ? [{ x: 3.5, y: 2.0 }, { x: 5.3, y: 2.0 }]
    : [{ x: 3.8, y: 1.5 }, { x: 5.5, y: 1.5 }, { x: 4.65, y: 3.0 }];
  const circleSize = 2.5;
  const colors = [COLORS.brandRed, COLORS.brandRedDark, COLORS.brandPurple];

  positions.forEach((pos, i) => {
    if (i >= count) return;
    slide.addShape(pres.shapes.OVAL, {
      x: pos.x, y: pos.y, w: circleSize, h: circleSize,
      fill: { color: colors[i], transparency: 60 },
      line: { color: colors[i], width: 1.5 },
    });
    slide.addText(items[i].label || "", {
      x: pos.x, y: pos.y + circleSize * 0.35, w: circleSize, h: 0.5,
      fontSize: 12, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
  });

  if (content.overlapText) {
    const cx = count === 2 ? 4.6 : 4.9;
    const cy = count === 2 ? 2.8 : 2.6;
    slide.addText(content.overlapText, {
      x: cx - 0.8, y: cy, w: 1.6, h: 0.5,
      fontSize: 11, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
  }
});

// ─── 16. chat-dialogue ───
registerLayout("chat-dialogue", (pres, slide, content) => {
  const messages = content.messages || [];
  const count = Math.min(messages.length, 4);
  let curY = 1.2;

  messages.forEach((msg, i) => {
    if (i >= count) return;
    const isLeft = i % 2 === 0;
    const x = isLeft ? 0.5 : 4.0;
    const w = 5.5;
    const bgColor = isLeft ? COLORS.offWhite : COLORS.lightRed;

    slide.addText(msg.speaker || "", {
      x, y: curY, w, h: 0.3,
      fontSize: 10, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: isLeft ? "left" : "right",
    });
    curY += 0.3;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: curY, w, h: 0.55,
      fill: { color: bgColor }, rectRadius: 0.05,
    });
    slide.addText(msg.text || "", {
      x: x + 0.15, y: curY, w: w - 0.3, h: 0.55,
      fontSize: 11, fontFace: FONTS.body, color: COLORS.textBlack,
      valign: "middle",
    });
    curY += 0.7;
  });
});

// ─── 17. year-list ───
registerLayout("year-list", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 6);
  const startY = 1.2;
  const rowH = 0.65;

  items.forEach((item, i) => {
    if (i >= count) return;
    const y = startY + i * rowH;

    slide.addText(item.year || "", {
      x: 0.3, y, w: 2.5, h: rowH,
      fontSize: 32, fontFace: FONTS.accent, color: COLORS.brandRed,
      bold: true, valign: "middle",
    });
    slide.addText(item.description || "", {
      x: 3.0, y, w: 6.5, h: rowH,
      fontSize: 13, fontFace: FONTS.body, color: COLORS.textBlack,
      valign: "middle",
    });
    if (i < count - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: 0.3, y: y + rowH, w: 9.4, h: 0,
        line: { color: COLORS.divider, width: 0.5 },
      });
    }
  });
});

// ─── 18. three-column ───
registerLayout("three-column", (pres, slide, content) => {
  const columns = content.columns || [];
  const count = Math.min(columns.length, 3);
  const colW = 2.9;
  const startX = 0.3;
  const gap = 0.3;
  const cardY = 1.85;
  const cardH = 3.3;

  columns.forEach((col, i) => {
    if (i >= count) return;
    const x = startX + i * (colW + gap);

    // Heading
    slide.addText(col.heading || "", {
      x, y: 1.15, w: colW, h: 0.5,
      fontSize: 16, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center",
    });
    // Red underline
    slide.addShape(pres.shapes.LINE, {
      x: x + 0.1, y: 1.68, w: colW - 0.2, h: 0,
      line: { color: COLORS.brandRed, width: 2 },
    });
    // Card background
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: cardY, w: colW, h: cardH,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.divider, width: 0.5 },
      rectRadius: 0.06,
    });

    // Bullets array or fallback to body
    if (Array.isArray(col.bullets) && col.bullets.length > 0) {
      const bulletH = cardH / col.bullets.length;
      col.bullets.forEach((bullet, j) => {
        slide.addText(`•  ${bullet}`, {
          x: x + 0.2, y: cardY + j * bulletH, w: colW - 0.3, h: bulletH,
          fontSize: 13, fontFace: FONTS.body, color: COLORS.textBlack,
          align: "left", valign: "middle", lineSpacingMultiple: 1.3,
        });
        if (j < col.bullets.length - 1) {
          slide.addShape(pres.shapes.LINE, {
            x: x + 0.15, y: cardY + (j + 1) * bulletH, w: colW - 0.3, h: 0,
            line: { color: COLORS.divider, width: 0.5 },
          });
        }
      });
    } else {
      slide.addText(col.body || "", {
        x: x + 0.2, y: cardY + 0.2, w: colW - 0.3, h: cardH - 0.3,
        fontSize: 13, fontFace: FONTS.body, color: COLORS.textBlack,
        lineSpacingMultiple: 1.5, valign: "top", align: "left",
      });
    }
  });
});

// ─── 19. three-step-column ───
registerLayout("three-step-column", (pres, slide, content) => {
  const steps = content.steps || [];
  const count = Math.min(steps.length, 4);
  const startX = 0.2;
  const gap = 0.25;
  const totalW = 9.6;
  const colW = (totalW - gap * (count - 1)) / count;

  // Distribute vertically across the full safe area (1.15 – 5.05 = 3.9")
  const topY    = 1.15;
  const bottomY = 5.05;
  const totalH  = bottomY - topY;          // 3.9"
  const numH    = totalH * 0.28;           // ~1.09" — decorative number
  const titleH  = totalH * 0.14;          // ~0.55" — step title
  const divGap  = 0.08;
  const descY   = topY + numH + titleH + divGap * 2 + 0.05;
  const descH   = bottomY - descY - 0.05;

  steps.forEach((step, i) => {
    if (i >= count) return;
    const x = startX + i * (colW + gap);
    const num = String(i + 1).padStart(2, "0");

    slide.addText(num, {
      x, y: topY, w: colW, h: numH,
      fontSize: count <= 3 ? 56 : 44,
      fontFace: FONTS.accent, color: COLORS.lightRed,
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(step.title || "", {
      x, y: topY + numH, w: colW, h: titleH,
      fontSize: count <= 3 ? 16 : 14,
      fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
    // Divider line under title
    slide.addShape(pres.shapes.LINE, {
      x: x + colW * 0.1, y: topY + numH + titleH + divGap, w: colW * 0.8, h: 0,
      line: { color: COLORS.divider, width: 1 },
    });
    slide.addText(step.description || "", {
      x, y: descY, w: colW, h: descH,
      fontSize: count <= 3 ? 11 : 10,
      fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.4, valign: "top", align: "center",
    });
  });
});

// ─── 20. matrix-quadrant ───
registerLayout("matrix-quadrant", (pres, slide, content) => {
  const quadrants = content.quadrants || [];
  const axisX = content.axisX || { low: "", high: "" };
  const axisY = content.axisY || { low: "", high: "" };

  slide.addShape(pres.shapes.LINE, {
    x: 5.0, y: 1.2, w: 0, h: 3.5,
    line: { color: COLORS.lightGray, width: 1 },
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 2.95, w: 9.0, h: 0,
    line: { color: COLORS.lightGray, width: 1 },
  });

  slide.addText(axisX.high || "", {
    x: 8.5, y: 2.95, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: FONTS.caption, color: COLORS.textMuted, align: "right",
  });
  slide.addText(axisX.low || "", {
    x: 0.5, y: 2.95, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: FONTS.caption, color: COLORS.textMuted, align: "left",
  });
  slide.addText(axisY.high || "", {
    x: 4.5, y: 1.0, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: FONTS.caption, color: COLORS.textMuted, align: "center",
  });
  slide.addText(axisY.low || "", {
    x: 4.5, y: 4.6, w: 1.0, h: 0.3,
    fontSize: 9, fontFace: FONTS.caption, color: COLORS.textMuted, align: "center",
  });

  const positions = [
    { x: 0.8, y: 1.4 }, { x: 5.3, y: 1.4 },
    { x: 0.8, y: 3.2 }, { x: 5.3, y: 3.2 },
  ];

  quadrants.forEach((q, i) => {
    if (i >= 4) return;
    const pos = positions[i];
    slide.addText(q.title || "", {
      x: pos.x, y: pos.y, w: 3.8, h: 0.35,
      fontSize: 14, fontFace: FONTS.heading, color: COLORS.textDark, bold: true,
    });
    if (q.description) {
      slide.addText(q.description, {
        x: pos.x, y: pos.y + 0.4, w: 3.8, h: 1.0,
        fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
        lineSpacingMultiple: 1.3, valign: "top",
      });
    }
  });
});

// ─── 21. ceo-message ───
registerLayout("ceo-message", (pres, slide, content) => {
  slide.addShape(pres.shapes.OVAL, {
    x: 0.5, y: 1.0, w: 1.4, h: 1.4,
    fill: { color: COLORS.offWhite },
    line: { color: COLORS.divider, width: 1 },
  });
  if (content.photoPath) {
    slide.addImage({
      path: content.photoPath,
      x: 0.5, y: 1.0, w: 1.4, h: 1.4, rounding: true,
    });
  }

  slide.addText(content.name || "", {
    x: 2.2, y: 1.0, w: 5.0, h: 0.45,
    fontSize: 18, fontFace: FONTS.heading, color: COLORS.textDark, bold: true,
  });
  slide.addText(content.role || "", {
    x: 2.2, y: 1.45, w: 5.0, h: 0.35,
    fontSize: 12, fontFace: FONTS.body, color: COLORS.textMuted,
  });
  if (content.bio) {
    slide.addText(content.bio, {
      x: 2.2, y: 1.85, w: 7.0, h: 0.5,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.7, w: 9.0, h: 2.3,
    fill: { color: COLORS.lightRed }, rectRadius: 0.08,
  });
  slide.addText(content.message || "", {
    x: 0.8, y: 2.9, w: 8.4, h: 1.9,
    fontSize: 13, fontFace: FONTS.body, color: COLORS.textBlack,
    lineSpacingMultiple: 1.5, valign: "top",
  });
});

// ─── 22. member-grid ───
registerLayout("member-grid", (pres, slide, content) => {
  const members = content.members || [];
  const positions = [
    { x: 0.3, y: 1.2 }, { x: 5.1, y: 1.2 },
    { x: 0.3, y: 3.2 }, { x: 5.1, y: 3.2 },
  ];
  const cardW = 4.5;
  const cardH = 1.8;

  members.forEach((m, i) => {
    if (i >= 4) return;
    const pos = positions[i];

    slide.addShape(pres.shapes.RECTANGLE, {
      x: pos.x, y: pos.y, w: cardW, h: cardH,
      fill: { color: COLORS.offWhite }, rectRadius: 0.05,
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: pos.x + 0.15, y: pos.y + 0.15, w: 1.2, h: 1.5,
      fill: { color: COLORS.lightGray }, rectRadius: 0.05,
    });
    slide.addText(m.name || "", {
      x: pos.x + 1.5, y: pos.y + 0.15, w: cardW - 1.8, h: 0.35,
      fontSize: 14, fontFace: FONTS.heading, color: COLORS.textDark, bold: true,
    });
    slide.addText(m.role || "", {
      x: pos.x + 1.5, y: pos.y + 0.5, w: cardW - 1.8, h: 0.3,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textMuted,
    });
    slide.addText(m.bio || "", {
      x: pos.x + 1.5, y: pos.y + 0.8, w: cardW - 1.8, h: 0.85,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.3, valign: "top",
    });
  });
});

// ─── 23. member-three-col ───
registerLayout("member-three-col", (pres, slide, content) => {
  const members = content.members || [];
  const count = Math.min(members.length, 3);
  const colW = 2.9;
  const startX = 0.3;
  const gap = 0.3;

  members.forEach((m, i) => {
    if (i >= count) return;
    const x = startX + i * (colW + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.35, y: 1.0, w: 2.2, h: 2.0,
      fill: { color: COLORS.lightGray }, rectRadius: 0.05,
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 2.7, w: 2.5, h: 0.5,
      fill: { color: COLORS.headerDark },
    });
    slide.addText(m.name || "", {
      x: x + 0.2, y: 2.7, w: 2.5, h: 0.5,
      fontSize: 13, fontFace: FONTS.heading, color: COLORS.white,
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(m.role || "", {
      x, y: 3.3, w: colW, h: 0.3,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textMuted, align: "center",
    });
    slide.addText(m.bio || "", {
      x, y: 3.65, w: colW, h: 1.3,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.3, valign: "top", align: "center",
    });
  });
});

// ─── 24. funnel ───
registerLayout("funnel", (pres, slide, content) => {
  const steps = content.steps || [];
  const count = Math.min(steps.length, 5);
  const funnelColors = ["BE1229", "A01020", "8C0D1E", "6B0818", "4A0510"];

  // Subheading — small red label, clearly subordinate to slide title
  if (content.heading) {
    slide.addText(content.heading.toUpperCase(), {
      x: 0.5, y: 1.05, w: 4.2, h: 0.35,
      fontSize: 11, fontFace: FONTS.accent, color: COLORS.brandRed, bold: true,
    });
  }

  // Bullets or body
  const textStartY = content.heading ? 1.45 : 1.1;
  const textH = 3.4;
  if (Array.isArray(content.bullets) && content.bullets.length > 0) {
    const bulletH = textH / content.bullets.length;
    content.bullets.forEach((bullet, j) => {
      slide.addText(`•  ${bullet}`, {
        x: 0.5, y: textStartY + j * bulletH, w: 4.2, h: bulletH,
        fontSize: 14, fontFace: FONTS.body, color: COLORS.textBlack,
        align: "left", valign: "middle", lineSpacingMultiple: 1.3,
      });
      if (j < content.bullets.length - 1) {
        slide.addShape(pres.shapes.LINE, {
          x: 0.5, y: textStartY + (j + 1) * bulletH, w: 4.0, h: 0,
          line: { color: COLORS.divider, width: 0.5 },
        });
      }
    });
  } else if (content.body) {
    slide.addText(content.body, {
      x: 0.5, y: textStartY, w: 4.2, h: textH,
      fontSize: 14, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.5, valign: "top",
    });
  }

  const cx = 7.2;
  const funnelStartY = 0.95;
  const stepH = count > 0 ? 4.2 / count : 0.9;

  steps.forEach((step, i) => {
    if (i >= count) return;
    const maxW = 4.8;
    const w = maxW - i * (maxW / (count + 1));
    const y = funnelStartY + i * stepH;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx - w / 2, y, w, h: stepH * 0.88,
      fill: { color: funnelColors[i % funnelColors.length] },
    });
    slide.addText(step.label || "", {
      x: cx - w / 2, y, w, h: stepH * 0.88,
      fontSize: 13, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  });
});

// ─── 25. pyramid ───
registerLayout("pyramid", (pres, slide, content) => {
  const levels = content.levels || [];
  const count = Math.min(levels.length, 4);
  const pyramidColors = ["4A0510", "8C0D1E", "BE1229", "E84060"];
  const cx = 5.0;
  const startY = 1.2;
  const totalH = 3.6;
  const maxW = 8.0;

  levels.forEach((level, i) => {
    if (i >= count) return;
    const w = maxW * ((i + 1) / count);
    const h = totalH / count;
    const y = startY + i * h;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx - w / 2, y, w, h: h * 0.9,
      fill: { color: pyramidColors[i % pyramidColors.length] },
    });
    slide.addText(level.label || "", {
      x: cx - w / 2, y, w, h: h * 0.5,
      fontSize: 13, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center", valign: "bottom",
    });
    if (level.description) {
      slide.addText(level.description, {
        x: cx - w / 2, y: y + h * 0.45, w, h: h * 0.4,
        fontSize: 9, fontFace: FONTS.body, color: "FFFFFF",
        align: "center", valign: "top",
      });
    }
  });
});

// ─── 26. parallel-items ───
registerLayout("parallel-items", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 4);
  if (count === 0) return;
  const totalW = 9.4;
  const gap = 0.2;
  const boxW = (totalW - gap * (count - 1)) / count;

  items.forEach((item, i) => {
    if (i >= count) return;
    const x = 0.3 + i * (boxW + gap);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: boxW, h: 3.6,
      fill: { color: COLORS.offWhite }, rectRadius: 0.05,
    });
    slide.addShape(pres.shapes.OVAL, {
      x: x + boxW / 2 - 0.3, y: 1.5, w: 0.6, h: 0.6,
      fill: { color: COLORS.brandRed },
    });
    if (item.icon) {
      slide.addText(item.icon, {
        x: x + boxW / 2 - 0.3, y: 1.5, w: 0.6, h: 0.6,
        fontSize: 16, fontFace: FONTS.body, color: "FFFFFF",
        align: "center", valign: "middle",
      });
    }
    slide.addText(item.heading || "", {
      x, y: 2.3, w: boxW, h: 0.4,
      fontSize: 14, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center",
    });
    slide.addText(item.description || "", {
      x: x + 0.15, y: 2.8, w: boxW - 0.3, h: 1.8,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.3, valign: "top", align: "center",
    });
  });
});

// ─── 27. containment ───
registerLayout("containment", (pres, slide, content) => {
  const outer = content.outer || {};
  const inner = content.inner || [];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 9.0, h: 3.8,
    fill: { color: COLORS.offWhite },
    line: { color: COLORS.brandRed, width: 2 },
    rectRadius: 0.08,
  });
  slide.addText(outer.label || "", {
    x: 0.7, y: 1.3, w: 4.0, h: 0.4,
    fontSize: 14, fontFace: FONTS.heading, color: COLORS.brandRed, bold: true,
  });

  const count = Math.min(inner.length, 3);
  const innerW = count > 0 ? (8.2 - 0.2 * (count - 1)) / count : 8.2;

  inner.forEach((item, i) => {
    if (i >= count) return;
    const x = 0.9 + i * (innerW + 0.2);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.0, w: innerW, h: 2.6,
      fill: { color: COLORS.white },
      line: { color: COLORS.divider, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText(item.label || "", {
      x, y: 2.1, w: innerW, h: 0.4,
      fontSize: 12, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center",
    });
    slide.addText(item.description || "", {
      x: x + 0.1, y: 2.5, w: innerW - 0.2, h: 1.9,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.3, valign: "top", align: "center",
    });
  });
});

// ─── 28. cycle ───
registerLayout("cycle", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 5);
  if (count === 0) return;
  const cx = 5.0;
  const cy = 2.8;
  const r = 1.8;

  const ellipseW = r * 2 + 0.4;
  const ellipseH = r * 2 + 0.0;
  slide.addShape(pres.shapes.OVAL, {
    x: cx - ellipseW / 2, y: cy - ellipseH / 2,
    w: ellipseW, h: ellipseH,
    fill: { color: "FFFFFF", transparency: 100 },
    line: { color: COLORS.lightGray, width: 1.5 },
  });

  items.forEach((item, i) => {
    if (i >= count) return;
    const angle = (i * Math.PI * 2) / count - Math.PI / 2;
    const nx = cx + r * Math.cos(angle) - 0.6;
    const ny = cy + r * Math.sin(angle) - 0.35;

    slide.addShape(pres.shapes.OVAL, {
      x: nx, y: ny, w: 1.2, h: 0.7,
      fill: { color: COLORS.brandRed },
    });
    slide.addText(item.label || "", {
      x: nx, y: ny, w: 1.2, h: 0.7,
      fontSize: 11, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });

    if (count > 1) {
      const nextAngle = ((i + 0.5) * Math.PI * 2) / count - Math.PI / 2;
      const ax = cx + (r * 0.65) * Math.cos(nextAngle) - 0.1;
      const ay = cy + (r * 0.65) * Math.sin(nextAngle) - 0.1;
      slide.addText("▶", {
        x: ax, y: ay, w: 0.2, h: 0.2,
        fontSize: 10, fontFace: FONTS.body, color: COLORS.brandRed,
        align: "center", valign: "middle",
        rotate: (((i + 0.5) * 360) / count),
      });
    }
  });

  if (content.centerText) {
    slide.addText(content.centerText, {
      x: cx - 1.0, y: cy - 0.25, w: 2.0, h: 0.5,
      fontSize: 13, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
  }
});

// ─── 29. radial-spread ───
registerLayout("radial-spread", (pres, slide, content) => {
  const center = content.center || {};
  const items = content.items || [];
  const count = Math.min(items.length, 6);
  const cx = 5.0;
  const cy = 2.8;

  slide.addShape(pres.shapes.OVAL, {
    x: cx - 0.8, y: cy - 0.5, w: 1.6, h: 1.0,
    fill: { color: COLORS.brandRed },
  });
  slide.addText(center.label || "", {
    x: cx - 0.8, y: cy - 0.5, w: 1.6, h: 1.0,
    fontSize: 12, fontFace: FONTS.heading, color: "FFFFFF",
    bold: true, align: "center", valign: "middle",
  });

  const r = 2.2;
  items.forEach((item, i) => {
    if (i >= count) return;
    const angle = (i * Math.PI * 2) / count - Math.PI / 2;
    const nx = cx + r * Math.cos(angle);
    const ny = cy + r * Math.sin(angle);

    const midX = cx + 0.9 * Math.cos(angle);
    const midY = cy + 0.9 * Math.sin(angle);
    slide.addShape(pres.shapes.LINE, {
      x: midX, y: midY,
      w: (nx - midX) * 0.6, h: (ny - midY) * 0.6,
      line: { color: COLORS.brandRed, width: 1.5 },
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: nx - 0.8, y: ny - 0.35, w: 1.6, h: 0.7,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.brandRed, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText(item.label || "", {
      x: nx - 0.8, y: ny - 0.35, w: 1.6, h: 0.7,
      fontSize: 10, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
  });
});

// ─── 30. convergence ───
registerLayout("convergence", (pres, slide, content) => {
  const target = content.target || {};
  const items = content.items || [];
  const count = Math.min(items.length, 6);
  const cx = 5.0;
  const cy = 3.3;

  const r = 1.7;
  items.forEach((item, i) => {
    if (i >= count) return;
    const angle = (i * Math.PI * 2) / count - Math.PI / 2;
    const nx = cx + r * Math.cos(angle);
    const ny = cy + r * Math.sin(angle);

    slide.addShape(pres.shapes.RECTANGLE, {
      x: nx - 0.8, y: ny - 0.35, w: 1.6, h: 0.7,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.brandRed, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText(item.label || "", {
      x: nx - 0.8, y: ny - 0.35, w: 1.6, h: 0.7,
      fontSize: 10, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });

    const midX = cx + 0.9 * Math.cos(angle);
    const midY = cy + 0.9 * Math.sin(angle);
    slide.addShape(pres.shapes.LINE, {
      x: nx - (nx - midX) * 0.4, y: ny - (ny - midY) * 0.4,
      w: (midX - nx) * 0.6, h: (midY - ny) * 0.6,
      line: { color: COLORS.brandRed, width: 1.5 },
    });
  });

  slide.addShape(pres.shapes.OVAL, {
    x: cx - 0.8, y: cy - 0.5, w: 1.6, h: 1.0,
    fill: { color: COLORS.brandRed },
  });
  slide.addText(target.label || "", {
    x: cx - 0.8, y: cy - 0.5, w: 1.6, h: 1.0,
    fontSize: 12, fontFace: FONTS.heading, color: "FFFFFF",
    bold: true, align: "center", valign: "middle",
  });
});

// ─── 31. three-way-relation ───
registerLayout("three-way-relation", (pres, slide, content) => {
  const nodes = content.nodes || [];
  const relations = content.relations || [];
  const positions = [
    { x: 4.25, y: 1.0 },
    { x: 1.5, y: 3.5 },
    { x: 7.0, y: 3.5 },
  ];

  nodes.forEach((node, i) => {
    if (i >= 3) return;
    const pos = positions[i];
    slide.addShape(pres.shapes.OVAL, {
      x: pos.x, y: pos.y, w: 1.5, h: 1.0,
      fill: { color: COLORS.brandRed },
    });
    slide.addText(node.label || "", {
      x: pos.x, y: pos.y, w: 1.5, h: 1.0,
      fontSize: 11, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  });

  const edges = [
    { from: 0, to: 1, midX: 2.5, midY: 2.2 },
    { from: 1, to: 2, midX: 4.75, midY: 4.2 },
    { from: 0, to: 2, midX: 7.0, midY: 2.2 },
  ];

  edges.forEach((edge, i) => {
    if (i >= relations.length) return;
    const rel = relations[i];
    slide.addText(rel.label || "", {
      x: edge.midX - 0.8, y: edge.midY - 0.15, w: 1.6, h: 0.3,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textMuted,
      align: "center", valign: "middle",
    });
  });
});

// ─── 32. kpi-formula ───
registerLayout("kpi-formula", (pres, slide, content) => {
  slide.addText(content.kpiName || "", {
    x: 0.3, y: 2.0, w: 2.5, h: 0.8,
    fontSize: 22, fontFace: FONTS.heading, color: COLORS.textDark,
    bold: true, align: "center", valign: "middle",
  });
  slide.addText("=", {
    x: 2.8, y: 2.0, w: 0.8, h: 0.8,
    fontSize: 36, fontFace: FONTS.accent, color: COLORS.textDark,
    bold: true, align: "center", valign: "middle",
  });
  slide.addText(content.numerator || "", {
    x: 4.0, y: 1.6, w: 3.5, h: 0.5,
    fontSize: 18, fontFace: FONTS.heading, color: COLORS.brandRed,
    bold: true, align: "center", valign: "bottom",
  });
  slide.addShape(pres.shapes.LINE, {
    x: 4.0, y: 2.3, w: 3.5, h: 0,
    line: { color: COLORS.textDark, width: 2 },
  });
  slide.addText(content.denominator || "", {
    x: 4.0, y: 2.4, w: 3.5, h: 0.5,
    fontSize: 18, fontFace: FONTS.heading, color: COLORS.textDark,
    bold: true, align: "center", valign: "top",
  });

  if (Array.isArray(content.annotations)) {
    const annCount = Math.min(content.annotations.length, 3);
    content.annotations.slice(0, annCount).forEach((ann, i) => {
      const y = 3.3 + i * 0.6;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 4.0, y, w: 5.5, h: 0.45,
        fill: { color: COLORS.lightRed }, rectRadius: 0.05,
      });
      slide.addText(ann, {
        x: 4.2, y, w: 5.1, h: 0.45,
        fontSize: 11, fontFace: FONTS.body, color: COLORS.textDark,
        valign: "middle",
      });
    });
  }
});

// ─── 33. kpi-logic-tree ───
registerLayout("kpi-logic-tree", (pres, slide, content) => {
  const root = content.root || {};
  const branches = content.branches || [];
  const branchCount = Math.min(branches.length, 4);

  // Column positions (spread 0.2 → 9.6)
  const rootX = 0.2,  rootW = 2.0;
  const branchX = 3.3, branchW = 2.4;
  const leafX = 6.7,   leafW = 2.9;
  const conn1MidX = (rootX + rootW + branchX) / 2;   // ~2.75
  const conn2MidX = (branchX + branchW + leafX) / 2; // ~6.2

  // Vertical bounds
  const topY = 1.15, bottomY = 5.05;
  const totalH = bottomY - topY;

  // Count total leaves for even vertical distribution
  const totalLeaves = branches.slice(0, branchCount).reduce(
    (sum, b) => sum + Math.min((b.children || []).length, 3), 0
  ) || branchCount;
  const leafH = totalH / totalLeaves;
  const leafBoxH = Math.min(leafH * 0.72, 0.52);
  const branchBoxH = 0.62;

  // Root — vertically centered
  const rootCY = (topY + bottomY) / 2;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rootX, y: rootCY - 0.42, w: rootW, h: 0.84,
    fill: { color: COLORS.brandRed }, rectRadius: 0.05,
  });
  slide.addText(root.label || "", {
    x: rootX, y: rootCY - 0.42, w: rootW, h: 0.84,
    fontSize: 14, fontFace: FONTS.heading, color: "FFFFFF",
    bold: true, align: "center", valign: "middle",
  });

  let leafIndex = 0;
  branches.forEach((branch, i) => {
    if (i >= branchCount) return;
    const childCount = Math.min((branch.children || []).length, 3);
    const groupStartY = topY + leafIndex * leafH;
    const groupEndY   = topY + (leafIndex + childCount) * leafH;
    const branchCY    = (groupStartY + groupEndY) / 2;

    // Connector root → branch (right-angle)
    slide.addShape(pres.shapes.LINE, {
      x: rootX + rootW, y: rootCY, w: conn1MidX - (rootX + rootW), h: 0,
      line: { color: COLORS.divider, width: 1 },
    });
    slide.addShape(pres.shapes.LINE, {
      x: conn1MidX, y: Math.min(rootCY, branchCY),
      w: 0, h: Math.abs(branchCY - rootCY),
      line: { color: COLORS.divider, width: 1 },
    });
    slide.addShape(pres.shapes.LINE, {
      x: conn1MidX, y: branchCY, w: branchX - conn1MidX, h: 0,
      line: { color: COLORS.divider, width: 1 },
    });

    // Branch box
    slide.addShape(pres.shapes.RECTANGLE, {
      x: branchX, y: branchCY - branchBoxH / 2, w: branchW, h: branchBoxH,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.brandRed, width: 1.5 },
      rectRadius: 0.05,
    });
    slide.addText(branch.label || "", {
      x: branchX, y: branchCY - branchBoxH / 2, w: branchW, h: branchBoxH,
      fontSize: 12, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });

    // Children
    (branch.children || []).forEach((child, j) => {
      if (j >= 3) return;
      const childCY = topY + (leafIndex + j) * leafH + leafH / 2;

      // Connector branch → leaf (right-angle)
      slide.addShape(pres.shapes.LINE, {
        x: branchX + branchW, y: branchCY, w: conn2MidX - (branchX + branchW), h: 0,
        line: { color: COLORS.divider, width: 0.75 },
      });
      slide.addShape(pres.shapes.LINE, {
        x: conn2MidX, y: Math.min(branchCY, childCY),
        w: 0, h: Math.abs(childCY - branchCY),
        line: { color: COLORS.divider, width: 0.75 },
      });
      slide.addShape(pres.shapes.LINE, {
        x: conn2MidX, y: childCY, w: leafX - conn2MidX, h: 0,
        line: { color: COLORS.divider, width: 0.75 },
      });

      // Leaf box
      slide.addShape(pres.shapes.RECTANGLE, {
        x: leafX, y: childCY - leafBoxH / 2, w: leafW, h: leafBoxH,
        fill: { color: COLORS.white },
        line: { color: COLORS.divider, width: 0.75 },
        rectRadius: 0.04,
      });
      slide.addText(child.label || child || "", {
        x: leafX + 0.12, y: childCY - leafBoxH / 2, w: leafW - 0.18, h: leafBoxH,
        fontSize: 11, fontFace: FONTS.body, color: COLORS.textBlack,
        align: "left", valign: "middle",
      });
    });

    leafIndex += childCount;
  });
});

// ─── 34. business-concept ───
registerLayout("business-concept", (pres, slide, content) => {
  // Accept both {a, b} and {left, right, center}
  const a = content.a || content.left || {};
  const b = content.b || content.right || {};
  const c = content.center || {};

  const topY    = 1.15;
  const bottomY = 5.05;
  const circleSize = 1.75;
  const circleTopY = topY + 0.1;
  const labelY  = circleTopY + circleSize + 0.2;
  const labelH  = 0.45;
  const descY   = labelY + labelH + 0.1;
  const descH   = bottomY - descY - 0.05;

  const colW   = 3.2;
  const leftX  = 0.2;
  const rightX = 9.8 - colW;  // 6.6
  const lcx    = leftX  + colW / 2 - circleSize / 2;  // circle x: 0.2 + 1.6 - 0.875 = 0.925
  const rcx    = rightX + colW / 2 - circleSize / 2;  // circle x: 6.6 + 1.6 - 0.875 = 7.325

  // Left circle + label + description
  slide.addShape(pres.shapes.OVAL, {
    x: lcx, y: circleTopY, w: circleSize, h: circleSize,
    fill: { color: COLORS.brandRed, transparency: 20 },
    line: { color: COLORS.brandRed, width: 2 },
  });
  slide.addText(a.label || a.title || "", {
    x: leftX, y: labelY, w: colW, h: labelH,
    fontSize: 16, fontFace: FONTS.heading, color: COLORS.textDark,
    bold: true, align: "center", valign: "middle",
  });
  if (a.description) {
    slide.addText(a.description, {
      x: leftX, y: descY, w: colW, h: descH,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
      align: "center", valign: "top", lineSpacingMultiple: 1.4,
    });
  }

  // Center connector
  const centerX  = 3.5;
  const centerW  = 3.0;
  const cLabel   = c.label || "×";
  const cFontSize = cLabel.length <= 3 ? 40 : 20;
  const connectorY = topY + (circleSize / 2); // vertically align with circle center
  slide.addText(cLabel, {
    x: centerX, y: connectorY, w: centerW, h: 0.65,
    fontSize: cFontSize, fontFace: FONTS.accent, color: COLORS.textDark,
    bold: true, align: "center", valign: "middle",
  });
  if (c.description) {
    slide.addText(c.description, {
      x: centerX, y: connectorY + 0.7, w: centerW, h: 0.5,
      fontSize: 11, fontFace: FONTS.body, color: COLORS.textMuted,
      align: "center", valign: "middle",
    });
  }

  // Right circle + label + description
  slide.addShape(pres.shapes.OVAL, {
    x: rcx, y: circleTopY, w: circleSize, h: circleSize,
    fill: { color: COLORS.brandRedDark, transparency: 20 },
    line: { color: COLORS.brandRedDark, width: 2 },
  });
  slide.addText(b.label || b.title || "", {
    x: rightX, y: labelY, w: colW, h: labelH,
    fontSize: 16, fontFace: FONTS.heading, color: COLORS.textDark,
    bold: true, align: "center", valign: "middle",
  });
  if (b.description) {
    slide.addText(b.description, {
      x: rightX, y: descY, w: colW, h: descH,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
      align: "center", valign: "top", lineSpacingMultiple: 1.4,
    });
  }
});

// ─── 35. step-up ───
registerLayout("step-up", (pres, slide, content) => {
  const steps = content.steps || [];
  const count = Math.min(steps.length, 5);
  if (count === 0) return;

  const startX = 0.5;
  const startY = 4.5;
  const totalW = 9.0;
  const totalH = 3.0;
  const stepW = totalW / count;
  const stepH = totalH / count;

  steps.forEach((step, i) => {
    if (i >= count) return;
    const x = startX + i * stepW;
    const y = startY - (i + 1) * stepH;
    const h = (i + 1) * stepH;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: stepW * 0.9, h,
      fill: { color: COLORS.brandRed, transparency: 80 - i * 15 },
    });
    slide.addText(step.label || "", {
      x, y: y + 0.1, w: stepW * 0.9, h: 0.35,
      fontSize: 11, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center",
    });
    if (step.description) {
      slide.addText(step.description, {
        x, y: y + 0.45, w: stepW * 0.9, h: 0.5,
        fontSize: 8, fontFace: FONTS.body, color: COLORS.textBlack,
        align: "center", valign: "top",
      });
    }
  });
});

// ─── 36. channel-mapping ───
registerLayout("channel-mapping", (pres, slide, content) => {
  const phases = content.phases || [];
  const channels = content.channels || [];
  const phaseCount = Math.min(phases.length, 6);

  const phaseW = phaseCount > 0 ? 9.0 / phaseCount : 1.5;
  phases.forEach((phase, i) => {
    if (i >= phaseCount) return;
    const x = 0.5 + i * phaseW;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.0, w: phaseW * 0.9, h: 0.5,
      fill: { color: COLORS.brandRed },
    });
    slide.addText(phase, {
      x, y: 1.0, w: phaseW * 0.9, h: 0.5,
      fontSize: 10, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  });

  const chCount = Math.min(channels.length, 6);
  channels.slice(0, chCount).forEach((ch, i) => {
    const y = 1.8 + i * 0.55;
    const startCol = ch.startPhase || 0;
    const endCol = ch.endPhase || phaseCount - 1;
    const x = 0.5 + startCol * phaseW;
    const w = (endCol - startCol + 1) * phaseW * 0.9
            + (endCol - startCol) * phaseW * 0.1;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.4,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.brandRed, width: 1 },
      rectRadius: 0.03,
    });
    slide.addText(ch.label || "", {
      x, y, w, h: 0.4,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
  });
});

// ─── 37. tam-concentric ───
registerLayout("tam-concentric", (pres, slide, content) => {
  const rings = content.rings || [];
  const count = Math.min(rings.length, 3);
  const cx = 5.0;
  const cy = 2.8;
  const sizes = [4.0, 2.8, 1.6];
  const colors = [COLORS.lightRed, COLORS.brandRed, COLORS.brandRedDark];
  const textColors = [COLORS.textDark, "FFFFFF", "FFFFFF"];

  rings.forEach((ring, i) => {
    if (i >= count) return;
    const s = sizes[i];
    slide.addShape(pres.shapes.OVAL, {
      x: cx - s / 2, y: cy - s / 2, w: s, h: s,
      fill: { color: colors[i] },
    });
  });

  for (let i = count - 1; i >= 0; i--) {
    const s = sizes[i];
    slide.addText(rings[i].label || "", {
      x: i === 0 ? cx - s / 2 + 0.3 : cx - 0.7,
      y: cy - s / 2 + 0.2 + i * 0.1,
      w: 1.5, h: 0.3,
      fontSize: 11, fontFace: FONTS.heading, color: textColors[i],
      bold: true, align: "center",
    });
    if (rings[i].value) {
      slide.addText(rings[i].value, {
        x: i === 0 ? cx - s / 2 + 0.3 : cx - 0.7,
        y: cy - s / 2 + 0.5 + i * 0.1,
        w: 1.5, h: 0.35,
        fontSize: 16, fontFace: FONTS.accent, color: textColors[i],
        bold: true, align: "center",
      });
    }
  }
});

// ─── 38. tam-parallel ───
registerLayout("tam-parallel", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 3);
  const maxSize = 3.5;
  const minSize = 1.5;
  const startX = 1.0;
  const gap = 0.8;
  const colors = [COLORS.brandRed, COLORS.brandRedDark, COLORS.brandPurple];

  items.forEach((item, i) => {
    if (i >= count) return;
    const size = maxSize - i * ((maxSize - minSize) / (count - 1 || 1));
    const prevX = i > 0
      ? startX + items.slice(0, i).reduce((sum, _, j) => {
          const s = maxSize - j * ((maxSize - minSize) / (count - 1 || 1));
          return sum + s + gap;
        }, 0)
      : startX;
    const x = prevX;
    const y = 2.8 - size / 2;

    slide.addShape(pres.shapes.OVAL, {
      x, y, w: size, h: size,
      fill: { color: colors[i % colors.length] },
    });
    slide.addText(item.label || "", {
      x, y: y + size * 0.3, w: size, h: 0.3,
      fontSize: 11, fontFace: FONTS.heading, color: "FFFFFF",
      bold: true, align: "center",
    });
    if (item.value) {
      slide.addText(item.value, {
        x, y: y + size * 0.45, w: size, h: 0.4,
        fontSize: 18, fontFace: FONTS.accent, color: "FFFFFF",
        bold: true, align: "center",
      });
    }
  });
});

// ─── 39. schedule-list ───
// Accepts content.items[] with { time, title, description }
// Also accepts legacy content.phases[] with { phase, period, owner, details }
registerLayout("schedule-list", (pres, slide, content) => {
  const topY    = 1.15;
  const bottomY = 5.05;
  const totalH  = bottomY - topY; // 3.9"
  const headerH = 0.42;

  // Normalise: support both new items[] and legacy phases[]
  let rows;
  if (content.items && content.items.length > 0) {
    rows = content.items.map((p) => ({
      col1: p.time || "",
      col2: p.title || "",
      col3: p.description || "",
    }));
  } else {
    const phases = content.phases || [];
    rows = phases.map((p) => ({
      col1: p.phase || p.period || "",
      col2: p.owner || "",
      col3: p.details || "",
    }));
  }
  const count = Math.min(rows.length, 7);
  if (count === 0) return;

  const rowH = (totalH - headerH) / count;

  const headerRow = [hCell("Timing"), hCell("Action"), hCell("Details")];

  const dataRows = rows.slice(0, count).map((r) => [
    {
      text: r.col1,
      options: {
        bold: true, fontSize: 10, fontFace: FONTS.body,
        color: COLORS.brandRed, valign: "middle", align: "center",
      },
    },
    {
      text: r.col2,
      options: {
        bold: true, fontSize: 10, fontFace: FONTS.body,
        color: COLORS.textDark, valign: "middle",
      },
    },
    dCell(r.col3),
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.2, y: topY, w: 9.6,
    colW: [1.9, 2.5, 5.2],
    rowH: [headerH, ...Array(count).fill(rowH)],
    border: { type: "solid", color: COLORS.divider, pt: 0.5 },
    margin: [3, 6, 3, 6],
  });
});

// ─── 40. pie-chart-highlight ───
registerLayout("pie-chart-highlight", (pres, slide, content) => {
  const chartData = content.data || {};

  if (chartData.labels && chartData.values) {
    slide.addChart(pres.charts.PIE, [{
      name: chartData.name || "",
      labels: chartData.labels,
      values: chartData.values,
    }], {
      x: 1.5, y: 1.0, w: 3.5, h: 3.5,
      chartColors: CHART_COLORS.sequence.slice(0, chartData.labels.length),
      showLegend: true, legendFontSize: 9,
      legendFontFace: FONTS.body, legendColor: COLORS.textBlack,
      legendPos: "b", showPercent: true,
    });
  }

  if (content.highlight) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.5, y: 1.5, w: 4.0, h: 2.5,
      fill: { color: COLORS.lightRed }, rectRadius: 0.08,
    });
    slide.addText(content.highlight.value || "", {
      x: 5.5, y: 1.7, w: 4.0, h: 1.0,
      fontSize: 36, fontFace: FONTS.accent, color: COLORS.brandRed,
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(content.highlight.message || "", {
      x: 5.7, y: 2.8, w: 3.6, h: 1.0,
      fontSize: 12, fontFace: FONTS.body, color: COLORS.textDark,
      align: "center", valign: "top", lineSpacingMultiple: 1.4,
    });
  }
});

// ─── 41. location-map ───
registerLayout("location-map", (pres, slide, content) => {
  const locations = content.locations || [];

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.0, w: 9.0, h: 4.0,
    fill: { color: COLORS.offWhite },
    line: { color: COLORS.divider, width: 1 },
    rectRadius: 0.05,
  });

  locations.forEach((loc) => {
    const x = 0.5 + (loc.posX || 50) / 100 * 9.0;
    const y = 1.0 + (loc.posY || 50) / 100 * 4.0;
    const isHQ = loc.isHQ || false;

    slide.addShape(pres.shapes.OVAL, {
      x: x - 0.1, y: y - 0.1, w: 0.2, h: 0.2,
      fill: { color: isHQ ? COLORS.brandRed : COLORS.textMuted },
    });
    slide.addText(loc.name || "", {
      x: x + 0.15, y: y - 0.15, w: 1.5, h: 0.3,
      fontSize: 9, fontFace: FONTS.body,
      color: isHQ ? COLORS.brandRed : COLORS.textDark,
      bold: isHQ,
    });
  });
});

// ─── 42. user-pain-points ───
registerLayout("user-pain-points", (pres, slide, content) => {
  const painPoints = content.painPoints || [];
  const count = Math.min(painPoints.length, 6);
  const cx = 5.0;
  const cy = 3.3;

  slide.addShape(pres.shapes.OVAL, {
    x: cx - 0.5, y: cy - 0.45, w: 1.0, h: 0.9,
    fill: { color: COLORS.headerDark },
  });
  slide.addText(content.personLabel || "👤", {
    x: cx - 0.5, y: cy - 0.45, w: 1.0, h: 0.9,
    fontSize: 12, fontFace: FONTS.body, color: "FFFFFF",
    align: "center", valign: "middle",
  });

  const r = 1.6;
  painPoints.forEach((point, i) => {
    if (i >= count) return;
    const angle = (i * Math.PI * 2) / count - Math.PI / 2;
    const nx = cx + r * Math.cos(angle);
    const ny = cy + r * Math.sin(angle);

    slide.addShape(pres.shapes.RECTANGLE, {
      x: nx - 1.0, y: ny - 0.35, w: 2.0, h: 0.7,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.divider, width: 1 },
      rectRadius: 0.05,
    });
    slide.addText(point, {
      x: nx - 0.95, y: ny - 0.3, w: 1.9, h: 0.6,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textBlack,
      align: "center", valign: "middle",
    });
  });
});

// ─── 43. horizontal-bar-ranking ───
registerLayout("horizontal-bar-ranking", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 8);
  if (count === 0) return;
  const maxVal = Math.max(...items.map((it) => it.value || 0), 1);
  const barMaxW = 4.8;
  const startY = 1.2;
  const rowH = 0.45;

  items.slice(0, count).forEach((item, i) => {
    const y = startY + i * (rowH + 0.1);
    const barW = ((item.value || 0) / maxVal) * barMaxW;

    slide.addText(item.label || "", {
      x: 0.3, y, w: 3.0, h: rowH,
      fontSize: 11, fontFace: FONTS.body, color: COLORS.textDark,
      valign: "middle", align: "right",
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 3.5, y: y + 0.05, w: barW, h: rowH - 0.1,
      fill: { color: COLORS.brandRed },
    });
    const labelX = Math.min(3.5 + barW + 0.1, 8.7);
    slide.addText(`${item.value || 0}%`, {
      x: labelX, y, w: 1.0, h: rowH,
      fontSize: 11, fontFace: FONTS.accent, color: COLORS.textDark,
      bold: true, valign: "middle",
    });
  });
});

// ─── 44. stacked-bar-chart ───
registerLayout("stacked-bar-chart", (pres, slide, content) => {
  const series = content.series || [];
  const categories = content.categories || [];

  if (series.length > 0 && categories.length > 0) {
    const chartData = series.map((s) => ({
      name: s.name || "",
      labels: categories,
      values: s.values || [],
    }));

    slide.addChart(pres.charts.BAR, chartData, {
      x: 0.5, y: 1.0, w: 9.0, h: 4.0,
      barDir: "col", barGrouping: "stacked",
      chartColors: CHART_COLORS.sequence.slice(0, series.length),
      showValue: true, valueFontSize: 8, valueFontFace: FONTS.body,
      catAxisLabelFontSize: 9, catAxisLabelFontFace: FONTS.body,
      catAxisLabelColor: COLORS.textBlack,
      valAxisLabelFontSize: 8, valAxisLabelColor: COLORS.textMuted,
      catGridLine: { style: "none" },
      valGridLine: { color: COLORS.divider, width: 0.5 },
      showLegend: true, legendFontSize: 9,
      legendFontFace: FONTS.body, legendPos: "b",
    });
  }
});

// ─── 45. fullscreen-photo ───
registerLayout("fullscreen-photo", (pres, slide, content) => {
  if (content.backgroundPath) {
    slide.background = { path: content.backgroundPath };
  } else {
    slide.background = { color: COLORS.headerDark };
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: "000000", transparency: 50 },
  });
  slide.addText(content.headline || "", {
    x: 0.5, y: 1.5, w: 6.0, h: 1.5,
    fontSize: 32, fontFace: FONTS.heading, color: "FFFFFF",
    bold: true, lineSpacingMultiple: 1.3,
  });

  if (content.subMessages) {
    const text = Array.isArray(content.subMessages)
      ? content.subMessages.join("\n")
      : content.subMessages;
    slide.addText(text, {
      x: 0.5, y: 3.2, w: 6.0, h: 1.5,
      fontSize: 14, fontFace: FONTS.body, color: "FFFFFF",
      lineSpacingMultiple: 1.5, valign: "top",
    });
  }
});

// ─── 46. awards-parallel ───
registerLayout("awards-parallel", (pres, slide, content) => {
  const items = content.items || [];
  const count = Math.min(items.length, 4);
  if (count === 0) return;
  const totalW = 9.0;
  const gap = 0.3;
  const boxW = (totalW - gap * (count - 1)) / count;

  items.forEach((item, i) => {
    if (i >= count) return;
    const x = 0.5 + i * (boxW + gap);

    slide.addShape(pres.shapes.OVAL, {
      x: x + boxW / 2 - 0.4, y: 1.2, w: 0.8, h: 0.8,
      fill: { color: COLORS.brandRed },
    });
    slide.addText(item.value || "", {
      x: x + boxW / 2 - 0.4, y: 1.2, w: 0.8, h: 0.8,
      fontSize: 18, fontFace: FONTS.accent, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(item.label || "", {
      x, y: 2.2, w: boxW, h: 0.4,
      fontSize: 13, fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center",
    });
    slide.addText(item.description || "", {
      x, y: 2.7, w: boxW, h: 1.2,
      fontSize: 10, fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.3, align: "center", valign: "top",
    });
  });

  if (content.footerMessage) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.2, w: 9.0, h: 0.6,
      fill: { color: COLORS.lightRed }, rectRadius: 0.05,
    });
    slide.addText(content.footerMessage, {
      x: 0.7, y: 4.2, w: 8.6, h: 0.6,
      fontSize: 12, fontFace: FONTS.body, color: COLORS.textDark,
      align: "center", valign: "middle",
    });
  }
});

// ─── 47. checklist-table ───
registerLayout("checklist-table", (pres, slide, content) => {
  const items = content.items || [];
  const headers = content.headers || ["項目", "状態"];

  const colCount = headers.length;
  const headerRow = headers.map((h) => hCell(h));

  const dataRows = items.map((item) => {
    const cells = [dCell(item.label || "")];
    if (item.checked !== undefined) {
      cells.push({
        text: item.checked ? "✅" : "⬜",
        options: {
          fontSize: 14, fontFace: FONTS.body,
          color: item.checked ? COLORS.greenAccent : COLORS.textMuted,
          align: "center", valign: "middle",
        },
      });
    } else if (item.status) {
      cells.push(dCell(item.status, { align: "center" }));
    } else {
      cells.push(dCell(""));
    }
    if (colCount >= 3) {
      cells.push(dCell(item.note || ""));
    }
    while (cells.length < colCount) {
      cells.push(dCell(""));
    }
    return cells.slice(0, colCount);
  });

  const tableW = 9.4;
  const colW = Array(colCount).fill(tableW / colCount);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.3, y: 1.2, w: tableW, colW, rowH: 0.4,
    border: { type: "solid", color: COLORS.divider, pt: 0.5 },
    margin: [3, 6, 3, 6],
  });
});

// ─── 48. numbered-feature-cards ───
registerLayout("numbered-feature-cards", (pres, slide, content) => {
  const items = content.items || content.steps || [];
  const count = Math.min(items.length, 4);
  if (count === 0) return;

  const startX = 0.3;
  const gap = 0.25;
  const totalW = 9.4;
  const colW = (totalW - gap * (count - 1)) / count;
  const cardY = 1.1;
  const cardH = 3.8;

  items.forEach((item, i) => {
    if (i >= count) return;
    const x = startX + i * (colW + gap);
    const num = String(i + 1).padStart(2, "0");

    topBorderCard(slide, pres, {
      x, y: cardY, w: colW, h: cardH,
      borderColor: item.accentColor || COLORS.brandAccent,
    });

    const numFontSize = count <= 3 ? 40 : 32;
    slide.addText(num, {
      x, y: cardY + 0.15, w: colW, h: 0.65,
      fontSize: numFontSize,
      fontFace: FONTS.accent, color: COLORS.brandAccent,
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(item.title || item.label || "", {
      x: x + 0.15, y: cardY + 0.9, w: colW - 0.3, h: 0.5,
      fontSize: count <= 3 ? 14 : 12,
      fontFace: FONTS.heading, color: COLORS.textDark,
      bold: true, align: "center", valign: "middle",
    });
    slide.addText(item.description || "", {
      x: x + 0.15, y: cardY + 1.5, w: colW - 0.3, h: cardH - 1.8,
      fontSize: count <= 3 ? 10 : 9,
      fontFace: FONTS.body, color: COLORS.textBlack,
      lineSpacingMultiple: 1.4, valign: "top", align: "left",
    });
  });
});

// ============================================================
// エクスポート
// ============================================================

module.exports = {
  renderDeck,
  renderSlide,
  registerLayout,
};
