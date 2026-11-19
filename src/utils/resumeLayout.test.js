import { describe, expect, it } from "vitest";
import { AUTO_LEVEL, COMPACT_LEVELS, getResumeLayout, normalizeCompactLevel, STANDARD_LEVEL } from "./resumeLayout";

describe("resume layout presets", () => {
  it("uses the author's own resume metrics for the standard preset", () => {
    const standard = getResumeLayout(STANDARD_LEVEL);
    expect(standard.bodySize).toBe(9.5);
    expect(standard.bodySize * standard.lineHeight).toBeCloseTo(15, 0);
    expect(standard.paddingHorizontal).toBe(36);
  });

  it("orders presets from roomy to tight so auto-fit can search them", () => {
    const presets = [0, 1, 2, 3, 4].map(getResumeLayout);
    for (let index = 1; index < presets.length; index += 1) {
      expect(presets[index].bodySize).toBeLessThanOrEqual(presets[index - 1].bodySize);
      expect(presets[index].lineHeight).toBeLessThan(presets[index - 1].lineHeight);
      expect(presets[index].sectionGap).toBeLessThan(presets[index - 1].sectionGap);
      expect(presets[index].paddingTop).toBeLessThanOrEqual(presets[index - 1].paddingTop);
    }
  });

  it("offers auto as the first option and defaults to it", () => {
    expect(COMPACT_LEVELS[0].value).toBe(AUTO_LEVEL);
    expect(normalizeCompactLevel(undefined)).toBe(AUTO_LEVEL);
    expect(normalizeCompactLevel("stale")).toBe(AUTO_LEVEL);
  });

  it("normalizes stored values", () => {
    expect(normalizeCompactLevel("0")).toBe(0);
    expect(normalizeCompactLevel("4")).toBe(4);
    expect(normalizeCompactLevel("auto")).toBe(AUTO_LEVEL);
    expect(getResumeLayout(AUTO_LEVEL)).toEqual(getResumeLayout(STANDARD_LEVEL));
  });
});
