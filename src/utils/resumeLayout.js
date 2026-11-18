/**
 * 简历版式的唯一来源。所有数值单位都是 pt（A4 = 595 × 842 pt）。
 * PDF 直接使用这些数值；网页预览在 595px 宽的画布上按 1pt = 1px 渲染再整体缩放，
 * 所以两边的字号、行距和留白比例完全一致。
 */
export const A4 = { width: 595.28, height: 841.89 };

const layouts = [
  {
    label: "舒展",
    bodySize: 10.5,
    lineHeight: 1.6,
    nameSize: 22,
    roleSize: 11,
    contactSize: 9.5,
    sectionTitleSize: 11.5,
    paddingTop: 44,
    paddingBottom: 40,
    paddingHorizontal: 46,
    sectionGap: 14,
    sectionTitleGap: 6,
    entryGap: 9,
    bulletGap: 2.5,
    photoWidth: 62,
    photoHeight: 82,
  },
  {
    label: "紧凑",
    bodySize: 10,
    lineHeight: 1.55,
    nameSize: 21,
    roleSize: 10.5,
    contactSize: 9,
    sectionTitleSize: 11,
    paddingTop: 38,
    paddingBottom: 36,
    paddingHorizontal: 42,
    sectionGap: 12,
    sectionTitleGap: 5,
    entryGap: 7.5,
    bulletGap: 2,
    photoWidth: 58,
    photoHeight: 77,
  },
  {
    label: "更紧凑",
    bodySize: 9.5,
    lineHeight: 1.5,
    nameSize: 20,
    roleSize: 10,
    contactSize: 8.8,
    sectionTitleSize: 10.5,
    paddingTop: 32,
    paddingBottom: 30,
    paddingHorizontal: 38,
    sectionGap: 10,
    sectionTitleGap: 4.5,
    entryGap: 6,
    bulletGap: 1.5,
    photoWidth: 54,
    photoHeight: 72,
  },
  {
    label: "最小可读",
    bodySize: 9,
    lineHeight: 1.42,
    nameSize: 18,
    roleSize: 9.5,
    contactSize: 8.4,
    sectionTitleSize: 10,
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 32,
    sectionGap: 7.5,
    sectionTitleGap: 3.5,
    entryGap: 4.5,
    bulletGap: 1,
    photoWidth: 48,
    photoHeight: 64,
  },
].map((layout) => ({
  ...layout,
  photoReserve: layout.photoWidth + 16,
  headerMinHeight: layout.photoHeight,
}));

export const COMPACT_LEVELS = layouts.map((layout, value) => ({ value, label: layout.label }));

export const RESUME_COLORS = {
  text: "#1a1a1a",
  muted: "#555555",
  rule: "#1a1a1a",
};

export function normalizeCompactLevel(level, fallback = 0) {
  const parsed = Number(level);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed < layouts.length) {
    return parsed;
  }
  return fallback;
}

export function getResumeLayout(level = 0) {
  return layouts[normalizeCompactLevel(level)];
}
