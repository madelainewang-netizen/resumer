/**
 * 网页预览里的孤行处理（Safari 不支持 text-wrap: pretty，所以用脚本做）。
 * 规则和 PDF 一致：段落最后一行不超过约 4 个字时，依次尝试微调字距，
 * 让最后几个字收回上一行，或者多带几个字下来。
 */
const SPACING_STEPS = [0, -0.2, -0.4, -0.6, 0.3, 0.6];

function measureLines(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  if (typeof range.getClientRects !== "function") return [];
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0.5);
  const lines = [];
  for (const rect of rects) {
    const line = lines.find((candidate) => Math.abs(candidate.top - rect.top) < rect.height * 0.5);
    if (line) {
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
    } else {
      lines.push({ top: rect.top, left: rect.left, right: rect.right });
    }
  }
  return lines.sort((a, b) => a.top - b.top);
}

function hasOrphan(element, maxWidth) {
  const lines = measureLines(element);
  if (lines.length < 2) return false;
  const last = lines[lines.length - 1];
  return last.right - last.left < maxWidth;
}

/**
 * @param root 简历画布
 * @param fontSize 正文字号（pt，等于画布上的 px）
 * @param scale 画布当前的缩放比例
 */
export function fixHtmlOrphans(root, { fontSize, scale = 1 }) {
  if (!root || typeof document === "undefined" || !document.createRange) return;
  const maxWidth = fontSize * 4.5 * scale;
  for (const element of root.querySelectorAll("[data-orphan-guard]")) {
    element.style.letterSpacing = "";
    for (const step of SPACING_STEPS) {
      element.style.letterSpacing = step ? `${step}px` : "";
      if (!hasOrphan(element, maxWidth)) break;
    }
    if (hasOrphan(element, maxWidth)) element.style.letterSpacing = "";
  }
}
