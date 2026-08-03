import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ResumeDocument pagination", () => {
  it("allows react-pdf to wrap content across A4 pages with the shared page margins", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toMatch(/<Page\s+size="A4"\s+style=\{\[styles\.page,\s*density\.page\]\}/);
    expect(source).not.toMatch(/<Page[^>]*wrap=\{false\}/);
  });

  it("uses high-contrast text colors for exported PDF readability", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toContain('color: "#000000"');
    expect(source).toContain("fontWeight: 600");
    expect(source).not.toContain('color: "#666666"');
  });

  it("keeps exported PDF page margins from collapsing in dense layouts", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toContain("paddingTop: Math.max(layout.paddingTop, 28)");
    expect(source).toContain("paddingBottom: Math.max(layout.paddingBottom, 28)");
    expect(source).toContain("paddingHorizontal: Math.max(layout.paddingHorizontal, 42)");
  });

  it("keeps bullet markers attached to their text across page breaks", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toContain('style={[styles.bulletRow, density?.bulletRow]} wrap={false}');
  });
});
