import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ResumeDocument pagination", () => {
  it("allows react-pdf to wrap content across A4 pages with the shared page margins", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toMatch(/<Page\s+size="A4"\s+style=\{\[styles\.page,\s*density\.page\]\}/);
    expect(source).not.toMatch(/wrap=\{false\}/);
  });

  it("uses high-contrast text colors for exported PDF readability", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toContain('color: "#171717"');
    expect(source).toContain('color: "#2f2f2f"');
    expect(source).toContain("fontWeight: 500");
    expect(source).not.toContain('color: "#666666"');
  });
});
