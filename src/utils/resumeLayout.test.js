import { describe, expect, it } from "vitest";
import { getResumeLayout, normalizeCompactLevel } from "./resumeLayout";

describe("resume layout density", () => {
  it("makes the minimum-readable preset denser than the compact preset", () => {
    const compact = getResumeLayout(2);
    const minimum = getResumeLayout(3);

    expect(minimum.bodySize).toBeLessThan(compact.bodySize);
    expect(minimum.lineHeight).toBeLessThan(compact.lineHeight);
    expect(minimum.paddingTop).toBeLessThan(compact.paddingTop);
    expect(minimum.paddingBottom).toBeLessThan(compact.paddingBottom);
    expect(minimum.sectionGap).toBeLessThan(compact.sectionGap);
    expect(minimum.entryGap).toBeLessThan(compact.entryGap);
  });

  it("scales the portrait and reserved header space with each density", () => {
    const relaxed = getResumeLayout(0);
    const minimum = getResumeLayout(3);

    expect(minimum.photoWidth).toBeLessThan(relaxed.photoWidth);
    expect(minimum.photoHeight).toBeLessThan(relaxed.photoHeight);
    expect(minimum.photoReserve).toBeLessThan(relaxed.photoReserve);
    expect(minimum.headerMinHeight).toBeLessThan(relaxed.headerMinHeight);
  });

  it("normalizes stored density values without falling back to minimum readable", () => {
    expect(normalizeCompactLevel("0", 2)).toBe(0);
    expect(normalizeCompactLevel("3", 2)).toBe(3);
    expect(normalizeCompactLevel("stale", 2)).toBe(2);
    expect(getResumeLayout("stale")).toEqual(getResumeLayout(0));
  });
});
