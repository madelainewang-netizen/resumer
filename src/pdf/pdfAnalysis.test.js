import { describe, expect, it } from "vitest";
import { findOrphans, groupLines, matchOrphansToBlocks, remainingLines } from "./pdfAnalysis";

const PAGE = 841.89;
const item = (str, x, top, width) => ({ str, width, transform: [1, 0, 0, 1, x, PAGE - top] });

describe("pdf layout checks", () => {
  const items = [
    item("• ", 38, 100, 6),
    item("产品定义：针对求职者难回忆经历细节的痛点，把流程设计为先找回证据再判断匹配", 48, 100, 510),
    item("内容", 48, 115, 19),
    item("• 第二条很短", 38, 130.75, 80),
  ];
  const lines = groupLines(items, PAGE);

  it("groups text items into lines from top to bottom", () => {
    expect(lines).toHaveLength(3);
    expect(lines[0].text.startsWith("•")).toBe(true);
  });

  it("flags a paragraph whose last line holds only a couple of characters", () => {
    const orphans = findOrphans(lines, { contentRight: 559, linePitch: 15 });
    expect(orphans).toHaveLength(1);
    expect(orphans[0].text).toBe("内容");
  });

  it("does not flag short single-line bullets", () => {
    const orphans = findOrphans(lines, { contentRight: 559, linePitch: 15 });
    expect(orphans.some((orphan) => orphan.text.includes("第二条"))).toBe(false);
  });

  it("maps an orphan back to the bullet it belongs to", () => {
    const keys = matchOrphansToBlocks(
      [{ text: "内容", previousText: "把流程设计为先找回证据再判断匹配" }],
      [
        { key: "a", text: "另一条内容" },
        { key: "b", text: "产品定义：针对求职者难回忆经历细节的痛点，把流程设计为先找回证据再判断匹配内容" },
      ],
    );
    expect(keys).toEqual(["b"]);
  });

  it("estimates the free lines left at the bottom of the page", () => {
    expect(remainingLines(lines, { pageHeight: PAGE, paddingBottom: 31, linePitch: 15, footerTop: PAGE - 24 })).toBe(
      Math.floor((PAGE - 31 - (130.75 + 15)) / 15),
    );
  });
});
