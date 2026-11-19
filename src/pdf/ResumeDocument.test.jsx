import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PDF_FONT_FILES } from "./ResumeDocument";

describe("ResumeDocument fonts", () => {
  it("ships static regular and bold font files (react-pdf cannot use variable fonts)", () => {
    for (const src of Object.values(PDF_FONT_FILES)) {
      expect(src).toMatch(/\.ttf$/);
      expect(existsSync(`public${src}`)).toBe(true);
    }
    expect(existsSync("public/fonts/NotoSansSC-VF.ttf")).toBe(false);
  });

  it("registers distinct font files for regular and bold weights", () => {
    const regular = readFileSync(`public${PDF_FONT_FILES.regular}`);
    const bold = readFileSync(`public${PDF_FONT_FILES.bold}`);
    expect(regular.equals(bold)).toBe(false);
  });

  it("lets react-pdf paginate across A4 pages", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");
    expect(source).toMatch(/<Page\s+size="A4"/);
    expect(source).not.toMatch(/<Page[^>]*wrap=\{false\}/);
  });
});
