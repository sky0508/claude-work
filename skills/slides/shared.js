/**
 * shared.js — ブランドデザイン定義
 * 色・フォント・レイアウト定数、ヘルパー関数を一元管理する
 */

const path = require("path");
const fs = require("fs");

// ============================================================
// カラーパレット — JVA ブランドカラー
// ============================================================
const COLORS = {
  // ─── JVA ブランドカラー ───────────────────────────────────
  brandRed: "BE1229",        // JVA プライマリレッド
  brandRedDark: "8C0D1E",    // ダークレッド（ヘッダー等）
  brandRedLight: "E84060",   // ライトレッド（アクセント）
  brandPurple: "6251D0",     // IBアクセントパープル
  brandAccent: "BE1229",     // デフォルトアクセント = プライマリレッド

  // ─── テキスト ──────────────────────────────────────────────
  textDark: "1A0508",        // ほぼ黒（赤みがかった）
  textBlack: "2D0A0F",       // 暗いテキスト
  textMuted: "C4A0A0",       // ダーク背景上のミュートテキスト
  textMutedLight: "9E9E9E",  // ライト背景上のミュートテキスト
  white: "FFFFFF",

  // ─── 背景・サーフェス ────────────────────────────────────
  offWhite: "FAF5F5",        // 赤みがかったオフホワイト
  lightRed: "F9ECEC",        // ライトレッド背景（カード等）
  lightGray: "E8E0E0",
  divider: "EDDFDF",

  // ─── ヘッダー・テーブル ───────────────────────────────────
  headerDark: "1A0508",      // ダークヘッダー（ほぼ黒）
  tableLabelGray: "6B3040",  // テーブルラベル（ダークレッド系）

  // ─── アクセント ───────────────────────────────────────────
  greenAccent: "27AE60",
  yellowAccent: "F59E0B",
};

// ============================================================
// フォント — JVA スタイル
// ============================================================
const FONTS = {
  heading: "Montserrat",   // JVA 風 — 太字英語タイトル
  body: "Lato",            // 読みやすいボディテキスト
  accent: "Montserrat",    // 数字・強調
  caption: "Lato",         // キャプション・注記
};

// ============================================================
// レイアウト定数
// ============================================================
const LAYOUT = {
  threeCol: {
    colWidth: 3.0,
    colX: (i) => 0.3 + i * (3.0 + 0.2),
  },
};

// ============================================================
// チャートカラーシーケンス — JVA ブランド
// ============================================================
const CHART_COLORS = {
  sequence: ["BE1229", "6251D0", "E84060", "8C0D1E", "27AE60", "F59E0B", "A93060", "4A3090"],
};

// ============================================================
// ユーティリティクラス・関数
// ============================================================

class PageCounter {
  constructor() { this.count = 0; }
  next() { return ++this.count; }
  current() { return this.count; }
}

function assetPath(p) {
  return path.resolve(__dirname, "assets", p);
}

function assetPathIfExists(p) {
  const full = assetPath(p);
  return fs.existsSync(full) ? full : null;
}

// ============================================================
// スライドビルダー
// ============================================================

function addCoverSlide(pres, opts = {}) {
  const slide = pres.addSlide();

  // 背景: cover-bg.png があれば使用、なければ JVA ダークレッド
  const coverBg = assetPathIfExists("cover-bg.png");
  if (coverBg) {
    slide.background = { path: coverBg };
    // 可読性のための半透明オーバーレイ
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: "000000", transparency: 30 },
    });
  } else {
    slide.background = { color: COLORS.headerDark };
  }

  // JVA レッドアクセントライン（下部）
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.45, w: 10, h: 0.175,
    fill: { color: COLORS.brandRed },
  });

  if (opts.title) {
    slide.addText(opts.title, {
      x: 0.7, y: 1.3, w: 8.6, h: 1.9,
      fontSize: 38, fontFace: FONTS.heading,
      color: COLORS.white, bold: true,
      lineSpacingMultiple: 1.2, valign: "middle",
    });
  }
  if (opts.subtitle) {
    slide.addText(opts.subtitle, {
      x: 0.7, y: 3.2, w: 8.6, h: 0.65,
      fontSize: 18, fontFace: FONTS.body,
      color: "F5C0C8",
    });
  }
  if (opts.catchphrase) {
    slide.addText(opts.catchphrase, {
      x: 0.7, y: 3.9, w: 8.6, h: 0.5,
      fontSize: 13, fontFace: FONTS.body,
      color: COLORS.textMuted,
    });
  }
  if (opts.version) {
    slide.addText(opts.version, {
      x: 8.3, y: 5.0, w: 1.5, h: 0.3,
      fontSize: 9, fontFace: FONTS.caption,
      color: COLORS.textMuted, align: "right",
    });
  }

  // JVA ロゴ（右上）
  const logoPath = assetPathIfExists("logo.png");
  if (logoPath) {
    slide.addImage({ path: logoPath, x: 8.6, y: 0.15, w: 1.1, h: 0.88,
      sizing: { type: "contain" } });
  }

  return slide;
}

function addSectionSlide(pres, title, opts = {}) {
  const slide = pres.addSlide();

  // 背景: section-bg.png があれば使用、なければ JVA レッド
  const sectionBg = assetPathIfExists("section-bg.png");
  if (sectionBg) {
    slide.background = { path: sectionBg };
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: "000000", transparency: 35 },
    });
  } else {
    slide.background = { color: COLORS.brandRed };
  }

  // セクション番号バッジ
  if (opts.number) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: 1.5, w: 0.7, h: 0.38,
      fill: { color: COLORS.brandRedLight },
      rectRadius: 0.06,
    });
    slide.addText(opts.number, {
      x: 0.7, y: 1.5, w: 0.7, h: 0.38,
      fontSize: 13, fontFace: FONTS.accent,
      color: COLORS.white, bold: true, align: "center", valign: "middle",
    });
  }

  if (title) {
    slide.addText(title, {
      x: 0.7, y: 1.9, w: 8.6, h: 1.6,
      fontSize: 32, fontFace: FONTS.heading,
      color: COLORS.white, bold: true,
      align: "center", valign: "middle",
    });
  }
  if (opts.subtitle) {
    slide.addText(opts.subtitle, {
      x: 0.7, y: 3.55, w: 8.6, h: 0.65,
      fontSize: 16, fontFace: FONTS.body,
      color: "F5C0C8", align: "center",
    });
  }

  // ロゴ（右上、小さく）
  const logoPath = assetPathIfExists("logo.png");
  if (logoPath) {
    slide.addImage({ path: logoPath, x: 8.6, y: 0.15, w: 1.1, h: 0.88,
      sizing: { type: "contain" } });
  }

  return slide;
}

function addContentSlide(pres, sectionName, pageNum, opts = {}) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.offWhite };

  // JVA ダークヘッダーバー
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.46,
    fill: { color: COLORS.headerDark },
  });
  // ヘッダー下部のレッドアクセントライン
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.44, w: 10, h: 0.05,
    fill: { color: COLORS.brandRed },
  });

  // セクション名
  if (sectionName) {
    slide.addText(sectionName, {
      x: 0.35, y: 0.04, w: 8.2, h: 0.38,
      fontSize: 13, fontFace: FONTS.body,
      color: COLORS.white, valign: "middle", bold: true,
    });
  }

  // ページ番号
  slide.addText(String(pageNum), {
    x: 9.0, y: 0.04, w: 0.75, h: 0.38,
    fontSize: 10, fontFace: FONTS.accent,
    color: "F5C0C8", align: "right", valign: "middle",
  });

  // JVA ロゴ（右下）— ダーク背景なので別途描画エリアを作成
  const logoPath = assetPathIfExists("logo.png");
  if (logoPath) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 8.7, y: 5.1, w: 1.1, h: 0.42,
      fill: { color: COLORS.headerDark },
    });
    slide.addImage({ path: logoPath, x: 8.72, y: 5.12, w: 1.06, h: 0.38,
      sizing: { type: "contain" } });
  }

  return slide;
}

function addEndingSlide(pres, def = {}) {
  const slide = pres.addSlide();

  // 背景: ending-bg.png → cover-bg.png → JVA ダークカラー
  const endingBg = assetPathIfExists("ending-bg.png") || assetPathIfExists("cover-bg.png");
  if (endingBg) {
    slide.background = { path: endingBg };
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: "000000", transparency: 30 },
    });
  } else {
    slide.background = { color: COLORS.headerDark };
  }

  // レッドアクセントライン（下部）
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.45, w: 10, h: 0.175,
    fill: { color: COLORS.brandRed },
  });

  slide.addText(def.message || "Thank you", {
    x: 0.8, y: 1.5, w: 8.4, h: 2.0,
    fontSize: 40, fontFace: FONTS.heading,
    color: COLORS.white, bold: true,
    align: "center", valign: "middle",
  });

  if (def.contact) {
    slide.addText(def.contact, {
      x: 0.8, y: 3.8, w: 8.4, h: 0.5,
      fontSize: 14, fontFace: FONTS.body,
      color: "F5C0C8", align: "center",
    });
  }

  // JVA ロゴ（右上）
  const logoPath = assetPathIfExists("logo.png");
  if (logoPath) {
    slide.addImage({ path: logoPath, x: 8.6, y: 0.15, w: 1.1, h: 0.88,
      sizing: { type: "contain" } });
  }

  return slide;
}

// ============================================================
// テーブルセルヘルパー
// ============================================================

function hCell(text, opts = {}) {
  return {
    text,
    options: {
      bold: true, fontSize: 10, fontFace: FONTS.body,
      color: "FFFFFF", fill: { color: COLORS.brandRed },
      align: "center", valign: "middle",
      ...opts,
    },
  };
}

function lCell(text, opts = {}) {
  return {
    text,
    options: {
      bold: true, fontSize: 10, fontFace: FONTS.body,
      color: "FFFFFF", fill: { color: COLORS.tableLabelGray },
      valign: "middle",
      ...opts,
    },
  };
}

function dCell(text, opts = {}) {
  return {
    text,
    options: {
      fontSize: 10, fontFace: FONTS.body,
      color: COLORS.textBlack, valign: "middle",
      ...opts,
    },
  };
}

// ============================================================
// チャート設定ヘルパー
// ============================================================

function defaultBarConfig(opts = {}) {
  return {
    barDir: "col",
    chartColors: CHART_COLORS.sequence,
    showValue: true, valueFontSize: 9, valueFontFace: FONTS.body,
    catAxisLabelFontSize: 9, catAxisLabelFontFace: FONTS.body,
    catAxisLabelColor: COLORS.textBlack,
    valAxisLabelFontSize: 8, valAxisLabelColor: COLORS.textMuted,
    showLegend: true, legendFontSize: 9,
    legendFontFace: FONTS.body, legendPos: "b",
    ...opts,
  };
}

function defaultDoughnutConfig(opts = {}) {
  return {
    holeSize: 55,
    chartColors: CHART_COLORS.sequence,
    showValue: true, valueFontSize: 9, valueFontFace: FONTS.body,
    showLegend: true, legendFontSize: 9,
    legendFontFace: FONTS.body, legendPos: "b",
    ...opts,
  };
}

function topBorderCard(slide, pres, opts = {}) {
  const { x, y, w, h, borderColor = COLORS.brandRed } = opts;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: COLORS.white },
    line: { color: COLORS.divider, width: 0.5 },
    rectRadius: 0.06,
  });
  // 上部レッドボーダー（JVA カードスタイル）
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h: 0.1,
    fill: { color: borderColor },
    rectRadius: 0.06,
  });
}

module.exports = {
  COLORS, FONTS, LAYOUT, CHART_COLORS,
  PageCounter, assetPath, assetPathIfExists,
  addCoverSlide, addSectionSlide, addContentSlide, addEndingSlide,
  hCell, lCell, dCell,
  defaultBarConfig, defaultDoughnutConfig,
  topBorderCard,
};
