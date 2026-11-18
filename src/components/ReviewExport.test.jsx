import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ReviewExport", () => {
  const source = readFileSync("src/components/ReviewExport.jsx", "utf8");

  it("previews the real PDF instead of a separate HTML approximation", () => {
    expect(source).toContain("<PdfPreview");
    expect(source).not.toContain("<ResumePaper");
  });

  it("surfaces layout checks: orphan lines and unused space", () => {
    expect(source).toContain("pdfInfo.orphans");
    expect(source).toContain("pdfInfo.remainingLines");
  });

  it("downloads the same PDF blob that was previewed when nothing changed", () => {
    expect(source).toContain("latestPdf.current");
    expect(source).toContain("generateResumePdf(profile, compactLevel)");
  });

  it("never blocks multi-page export", () => {
    expect(source).not.toMatch(/disabled=\{exporting\s*\|\|\s*likelyOverflow\}/);
  });

  it("can use a shared preview density from the workspace", () => {
    expect(source).toContain("controlledCompactLevel ?? localCompactLevel");
    expect(source).toContain("normalizeCompactLevel");
  });
});
