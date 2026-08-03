import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ReviewExport multi-page export", () => {
  it("does not block PDF export when the preview exceeds one A4 page", () => {
    const source = readFileSync("src/components/ReviewExport.jsx", "utf8");

    expect(source).not.toContain("暂时无法导出");
    expect(source).not.toMatch(/disabled=\{exporting\s*\|\|\s*likelyOverflow\}/);
    expect(source).toContain("内容会按 A4 自动分页");
  });

  it("does not override the user's selected preview density", () => {
    const source = readFileSync("src/components/ReviewExport.jsx", "utf8");

    expect(source).not.toMatch(/setCompactLevel\(\(level\)/);
    expect(source).toContain("setIsOverflowing(overflows)");
  });

  it("can use a shared preview density from the workspace", () => {
    const source = readFileSync("src/components/ReviewExport.jsx", "utf8");

    expect(source).toContain("controlledCompactLevel ?? localCompactLevel");
    expect(source).toContain("normalizeCompactLevel");
  });
});
