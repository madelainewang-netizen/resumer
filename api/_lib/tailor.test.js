import { describe, expect, it } from "vitest";
import { sampleProfile } from "../../src/data/defaults";
import { buildTailorInput, findNewNumbers, mergeTailorRewrite } from "./tailor";

describe("tailor rewrite merge", () => {
  const firstBullet = sampleProfile.experience[0].bullets[0];

  it("sends only the text the model needs, without ids of companies or the photo", () => {
    const input = buildTailorInput({ ...sampleProfile, basics: { ...sampleProfile.basics, photo: "data:image/png;base64,AAA" } });
    expect(JSON.stringify(input)).not.toContain("base64");
    expect(input.experiences[0].bullets[0]).toEqual({ id: firstBullet.id, text: firstBullet.text });
  });

  it("keeps facts from the original profile and only replaces bullet text", () => {
    const merged = mergeTailorRewrite(sampleProfile, {
      summary: "",
      bullets: [{ id: firstBullet.id, text: "需求规划：新的说法", verificationRequired: false }],
    });
    expect(merged.experience[0].company).toBe(sampleProfile.experience[0].company);
    expect(merged.experience[0].bullets[0]).toMatchObject({
      text: "需求规划：新的说法",
      originalText: firstBullet.text,
    });
    expect(merged.basics.summary).toBe(sampleProfile.basics.summary);
  });

  it("keeps bullets the model skipped unchanged", () => {
    const merged = mergeTailorRewrite(sampleProfile, { summary: "", bullets: [] });
    expect(merged.experience[0].bullets[0].text).toBe(firstBullet.text);
  });

  it("flags rewrites that introduce numbers not in the original", () => {
    expect(findNewNumbers("提升完成率", "提升完成率30%")).toEqual(["30"]);
    const merged = mergeTailorRewrite(sampleProfile, {
      summary: "",
      bullets: [{ id: firstBullet.id, text: "需求规划：推进 5 个版本交付", verificationRequired: false }],
    });
    expect(merged.experience[0].bullets[0].verificationRequired).toBe(true);
  });
});
