import { describe, expect, it } from "vitest";
import {
  calculateMatchScore,
  evaluateRequirementEvidence,
  normalizeKeyword,
  profileToText,
} from "./matchScore";
import { sampleAnalysis, sampleProfile } from "../data/defaults";

describe("match score", () => {
  it("normalizes common keyword aliases", () => {
    expect(normalizeKeyword("React.js")).toBe("react");
    expect(normalizeKeyword("项目推进")).toBe("项目管理");
  });

  it("flattens structured profile content", () => {
    const text = profileToText(sampleProfile);
    expect(text).toContain("云帆科技");
    expect(text).toContain("sql");
  });

  it("returns an explainable weighted score", () => {
    const score = calculateMatchScore(sampleProfile, sampleAnalysis);
    expect(score.overallScore).toBeGreaterThan(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(score.matchedKeywords).toContain("sql");
    expect(score.hardSkillScore).toBeGreaterThan(0);
  });

  it("recognizes Chinese concept evidence inside longer requirements", () => {
    expect(
      evaluateRequirementEvidence(
        sampleProfile,
        "数据驱动的产品迭代",
        sampleAnalysis,
      ),
    ).toBe("strong");
  });

  it("returns an empty score without analysis", () => {
    expect(calculateMatchScore(sampleProfile, null).overallScore).toBe(0);
  });
});
