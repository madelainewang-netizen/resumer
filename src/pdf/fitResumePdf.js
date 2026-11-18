import { createElement } from "react";
import { buildResumeModel } from "../resume/resumeModel";
import { A4, AUTO_LEVEL, getResumeLayout, LAYOUT_COUNT, STANDARD_LEVEL } from "../utils/resumeLayout";
import { findOrphans, groupLines, listTextBlocks, matchOrphansToBlocks, remainingLines } from "./pdfAnalysis";

// 孤行处理依次尝试：轻微收紧 → 再收紧 → 略微放宽（把更多字带到最后一行）
const ORPHAN_SPACING_STEPS = [0, -0.25, -0.5, 0.35];

let pdfjsPromise;
export function loadPdfjs() {
  pdfjsPromise ??= Promise.all([
    import("pdfjs-dist/build/pdf"),
    import("pdfjs-dist/build/pdf.worker.min.js?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return pdfjsPromise;
}

async function renderBlob(profile, level, spacing) {
  const [{ pdf }, { default: ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumeDocument"),
  ]);
  return pdf(createElement(ResumeDocument, { profile, compactLevel: level, spacing })).toBlob();
}

async function inspect(blob, level, pdfjs) {
  const layout = getResumeLayout(level);
  const linePitch = layout.bodySize * layout.lineHeight;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const allOrphans = [];
  let lastLines = [];
  for (let index = 1; index <= doc.numPages; index += 1) {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    const lines = groupLines(content.items, A4.height);
    allOrphans.push(
      ...findOrphans(lines, { contentRight: A4.width - layout.paddingHorizontal, linePitch }),
    );
    lastLines = lines;
  }
  return {
    doc,
    pages: doc.numPages,
    orphans: allOrphans,
    remaining: remainingLines(lastLines, {
      pageHeight: A4.height,
      paddingBottom: layout.paddingBottom,
      linePitch,
      footerTop: A4.height - 24,
    }),
  };
}

/**
 * 生成最终 PDF，并执行两条排版约束：
 * 1. 自动档：从宽松到紧凑依次尝试，选出能放进一页的最宽松档位（内容少时不会下面空一大块，内容多时自动收紧）；
 * 2. 孤行：检测到段落最后一行只剩一两个字时，把该段字距收紧 0.25pt 重新排版，最多两轮。
 */
export async function fitResumePdf(profile, requestedLevel) {
  const pdfjs = await loadPdfjs();
  const attempt = async (level, spacing = {}) => {
    const blob = await renderBlob(profile, level, spacing);
    return { level, spacing, blob, ...(await inspect(blob, level, pdfjs)) };
  };

  let result;
  if (requestedLevel === AUTO_LEVEL) {
    // 先试标准档：放得下就往宽松方向找，放不下就往紧凑方向找
    result = await attempt(STANDARD_LEVEL);
    if (result.pages === 1) {
      for (let level = STANDARD_LEVEL - 1; level >= 0; level -= 1) {
        const roomier = await attempt(level);
        if (roomier.pages > 1) break;
        result = roomier;
      }
    } else {
      for (let level = STANDARD_LEVEL + 1; level < LAYOUT_COUNT; level += 1) {
        const tighter = await attempt(level);
        result = tighter;
        if (tighter.pages === 1) break;
      }
      // 最紧也放不下：退回标准档，正常分页，保证可读
      if (result.pages > 1) result = await attempt(STANDARD_LEVEL);
    }
  } else {
    result = await attempt(requestedLevel);
  }

  const blocks = listTextBlocks(buildResumeModel(profile));
  for (let round = 0; round < ORPHAN_SPACING_STEPS.length && result.orphans.length; round += 1) {
    const keys = matchOrphansToBlocks(result.orphans, blocks);
    if (!keys.length) break;
    const spacing = { ...result.spacing };
    for (const key of keys) {
      const current = ORPHAN_SPACING_STEPS.indexOf(spacing[key] ?? 0);
      const next = ORPHAN_SPACING_STEPS[current + 1];
      if (next !== undefined) spacing[key] = next;
    }
    const fixed = await attempt(result.level, spacing);
    // 只接受"孤行变少、且没有多出页数"的结果
    if (fixed.pages <= result.pages && fixed.orphans.length < result.orphans.length) {
      result = fixed;
    } else if (fixed.pages <= result.pages && fixed.orphans.length === result.orphans.length) {
      result = { ...result, spacing: fixed.spacing };
    } else {
      break;
    }
  }

  return {
    blob: result.blob,
    doc: result.doc,
    pages: result.pages,
    level: result.level,
    remainingLines: result.pages === 1 ? result.remaining : 0,
    orphans: result.orphans.map((orphan) => {
      const [key] = matchOrphansToBlocks([orphan], blocks);
      return { ...orphan, label: blocks.find((block) => block.key === key)?.label || "" };
    }),
  };
}
