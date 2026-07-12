import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ResumeDocument pagination", () => {
  it("allows react-pdf to wrap content across A4 pages with the shared page margins", () => {
    const source = readFileSync("src/pdf/ResumeDocument.jsx", "utf8");

    expect(source).toMatch(/<Page\s+size="A4"\s+style=\{\[styles\.page,\s*density\.page\]\}/);
    expect(source).not.toMatch(/wrap=\{false\}/);
  });
});
