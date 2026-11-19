/**
 * 排版检查（纯函数，便于测试）：从 pdf.js 的文字坐标里还原每一行，
 * 找出"孤行"——段落最后一行只剩一两个字的情况——并估算页面剩余空间。
 */

const VISIBLE = /[^\s•·|｜]/g;
// 最后一行不超过 4 个字（含标点）就算孤行，例如"等工作。"
const ORPHAN_MAX_CHARS = 4;

/** 把 pdf.js textContent.items 合并成行（同一 y 视为一行，可能包含左右两栏）。 */
export function groupLines(items, pageHeight) {
  const rows = [];
  for (const item of items) {
    const text = item.str || "";
    if (!text.trim()) continue;
    const x = item.transform[4];
    const top = pageHeight - item.transform[5];
    const width = item.width || 0;
    let row = rows.find((candidate) => Math.abs(candidate.top - top) < 1.2);
    if (!row) {
      row = { top, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, width, text });
  }
  return rows
    .map((row) => {
      row.parts.sort((a, b) => a.x - b.x);
      const x0 = row.parts[0].x;
      const x1 = Math.max(...row.parts.map((part) => part.x + part.width));
      return { top: row.top, x0, x1, text: row.parts.map((part) => part.text).join("") };
    })
    .sort((a, b) => a.top - b.top);
}

/**
 * 找孤行：上一行是同一段落（行距一致、左缘对齐或是带圆点的首行）且已排满，
 * 而这一行只有不超过 3 个可见字符。
 */
export function findOrphans(lines, { linePitch }) {
  const orphans = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const previous = lines[index - 1];
    // 带圆点的是新一条的首行，不是孤行
    if (/^\s*•/.test(line.text)) continue;
    const sameParagraph =
      Math.abs(line.top - previous.top - linePitch) < 1.5 &&
      line.x0 >= previous.x0 - 1 &&
      line.x0 <= previous.x0 + 14;
    const visible = (line.text.match(VISIBLE) || []).length;
    // 不再要求上一行排满：上一行因为英文长单词提前换行时，剩下的一两个字同样难看
    if (sameParagraph && visible <= ORPHAN_MAX_CHARS) {
      orphans.push({ text: line.text.trim(), previousText: previous.text.replace(/^•\s*/, "").trim() });
    }
  }
  return orphans;
}

const normalize = (value) => String(value || "").replace(/\s+/g, "");

/** 把孤行对应回简历里的段落 key（bullet id、summary 等）。 */
export function matchOrphansToBlocks(orphans, blocks) {
  const keys = [];
  for (const orphan of orphans) {
    const tail = normalize(orphan.text);
    const before = normalize(orphan.previousText).slice(-8);
    const block = blocks.find((candidate) => {
      const text = normalize(candidate.text);
      return text.endsWith(tail) && (!before || text.includes(before));
    });
    if (block && !keys.includes(block.key)) keys.push(block.key);
  }
  return keys;
}

/** 从简历模型里列出所有会换行的段落，供孤行回查。 */
export function listTextBlocks(model) {
  const blocks = [];
  for (const section of model.sections) {
    if (section.kind === "paragraph") {
      blocks.push({ key: section.key, text: section.text, label: section.title });
      continue;
    }
    for (const entry of section.entries) {
      if (entry.title || entry.subtitle) {
        blocks.push({
          key: `${entry.id}:head`,
          text: [entry.title, entry.subtitle].filter(Boolean).join(entry.separator || " | "),
          label: entry.title || section.title,
        });
      }
      if (entry.secondary) {
        blocks.push({ key: `${entry.id}:secondary`, text: entry.secondary, label: entry.title || section.title });
      }
      for (const bullet of entry.bullets) {
        blocks.push({
          key: bullet.id,
          text: `${bullet.lead || ""}${bullet.text}`,
          label: entry.title || section.title,
        });
      }
    }
  }
  return blocks;
}

/** 最后一页正文剩余可写的行数（按正文行距估算）。 */
export function remainingLines(lines, { pageHeight, paddingBottom, linePitch, footerTop }) {
  const body = lines.filter((line) => line.top < footerTop - 2);
  if (!body.length) return 0;
  const lastBottom = Math.max(...body.map((line) => line.top)) + linePitch;
  return Math.max(0, Math.floor((pageHeight - paddingBottom - lastBottom) / linePitch));
}
