/**
 * 简历版式的唯一来源。所有数值单位都是 pt（A4 = 595 × 842 pt）。
 *
 * "标准"档完全照搬作者本人投递版简历的实测参数：
 * 正文 9.5pt、行距 15pt、左右边距 36pt、标题 11.5pt + 0.75pt 下划线、
 * 条目之间只多 0.75pt，段落间距统一、紧凑。
 * 其余档位按同一比例放大或收紧，"自动"会挑出刚好排满一页的那一档。
 */
export const A4 = { width: 595.28, height: 841.89 };

export const AUTO_LEVEL = "auto";

const presets = [
  { label: "宽松", bodySize: 10.5, lineHeight: 1.62, margin: [40, 40, 38], gap: 1.7, nameSize: 22 },
  { label: "舒展", bodySize: 10, lineHeight: 1.6, margin: [38, 38, 34], gap: 1.35, nameSize: 21 },
  { label: "标准", bodySize: 9.5, lineHeight: 1.58, margin: [36, 28, 31], gap: 1, nameSize: 20 },
  { label: "紧凑", bodySize: 9.5, lineHeight: 1.48, margin: [32, 24, 26], gap: 0.7, nameSize: 19 },
  { label: "最小可读", bodySize: 9, lineHeight: 1.42, margin: [28, 22, 24], gap: 0.5, nameSize: 18 },
];

const layouts = presets.map(({ label, bodySize, lineHeight, margin, gap, nameSize }) => {
  const [horizontal, top, bottom] = margin;
  return {
    label,
    bodySize,
    lineHeight,
    nameSize,
    subNameSize: Math.round(nameSize * 0.65 * 2) / 2,
    labelSize: bodySize - 1,
    footerSize: 8,
    sectionTitleSize: bodySize + 2,
    paddingHorizontal: horizontal,
    paddingTop: top,
    // 页脚邮箱放在底边距里（距底 14pt），不占正文空间
    paddingBottom: bottom,
    contactGap: 0.5 * gap,
    headerGap: 12 * gap,
    sectionGap: 4 * gap,
    sectionTitleGap: 2 * gap + 1,
    entryGap: 1.75 * gap,
    bulletGap: 0.75 * gap,
    bulletIndent: 12,
    bulletDotOffset: 2,
    photoWidth: Math.round(61.5 * (bodySize / 9.5)),
    photoHeight: Math.round(82 * (bodySize / 9.5)),
  };
});

export const STANDARD_LEVEL = 2;
export const COMPACT_LEVELS = [
  { value: AUTO_LEVEL, label: "自动排满一页" },
  ...layouts.map((layout, value) => ({ value, label: layout.label })),
];

export const RESUME_COLORS = {
  text: "#000000",
  label: "#7a7a7a",
  subName: "#6b6b6b",
  footer: "#8a8a8a",
  rule: "#333333",
};

export const LAYOUT_COUNT = layouts.length;

/** 规范化用户选择：允许 "auto" 或合法档位，其它值回退。 */
export function normalizeCompactLevel(level, fallback = AUTO_LEVEL) {
  if (level === AUTO_LEVEL) return AUTO_LEVEL;
  const parsed = Number(level);
  if (level !== "" && level !== null && Number.isInteger(parsed) && parsed >= 0 && parsed < layouts.length) {
    return parsed;
  }
  return fallback;
}

/** 取具体档位的参数；"auto" 在还没算出结果之前按标准档显示。 */
export function getResumeLayout(level = STANDARD_LEVEL) {
  const normalized = normalizeCompactLevel(level, STANDARD_LEVEL);
  return layouts[normalized === AUTO_LEVEL ? STANDARD_LEVEL : normalized];
}
