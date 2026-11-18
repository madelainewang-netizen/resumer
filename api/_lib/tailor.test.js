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

  it("treats whitespace/punctuation-only edits as no change", () => {
    const original = "流程拆解与AI提效：Clipping Report需逐条查原帖，单份约2小时";
    const profile = structuredClone(sampleProfile);
    profile.experience[0].bullets[0].text = original;
    const merged = mergeTailorRewrite(profile, {
      summary: "",
      bullets: [{ id: firstBullet.id, action: "rewrite", text: "流程拆解与 AI 提效：Clipping Report 需逐条查原帖，单份约 2 小时", reason: "", verificationRequired: false }],
    });
    expect(merged.experience[0].bullets[0].text).toBe(original);
    expect(merged.experience[0].bullets[0].verificationRequired).toBe(false);
  });

  it("keeps the original text when the model decides to keep, and passes the reason through", () => {
    const merged = mergeTailorRewrite(sampleProfile, {
      summary: "",
      bullets: [{ id: firstBullet.id, action: "keep", text: "随便改的", reason: "已直接体现需求规划能力", verificationRequired: false }],
    });
    expect(merged.experience[0].bullets[0]).toMatchObject({
      text: firstBullet.text,
      tailorReason: "已直接体现需求规划能力",
    });
  });

  it("passes JD gaps through so the user can add missing experience", () => {
    const merged = mergeTailorRewrite(sampleProfile, {
      summary: "",
      bullets: [],
      gaps: [{ requirement: "A/B 测试经验", reason: "简历未提及实验设计", evidenceHint: "课程或实习中的实验" }, { requirement: " ", reason: "", evidenceHint: "" }],
    });
    expect(merged.tailorGaps).toEqual([
      { requirement: "A/B 测试经验", reason: "简历未提及实验设计", evidenceHint: "课程或实习中的实验" },
    ]);
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

describe("resume SOP skill", () => {
  it("is loaded by every endpoint that writes or judges resume content", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["tailor-resume", "condense-resume", "explain-match", "evidence-coach"]) {
      expect(readFileSync(`api/${file}.js`, "utf8")).toContain("RESUME_SOP");
    }
  });
});

describe("JD tailoring skill", () => {
  it("is loaded by the tailor endpoint and no longer lets unrelated bullets be kept as-is", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("api/tailor-resume.js", "utf8")).toContain("JD_TAILORING_SKILL");
    const { JD_TAILORING_SKILL } = await import("./skills/jdTailoring.js");
    expect(JD_TAILORING_SKILL).toContain("可迁移");
    expect(JD_TAILORING_SKILL).not.toMatch(/无关.{0,10}keep/);
  });

  it("passes focus and overall strategy through to the UI", () => {
    const merged = mergeTailorRewrite(sampleProfile, { focus: ["数据分析", " "], overall: "按产品岗 改写", summary: "", bullets: [], gaps: [] });
    expect(merged.tailorFocus).toEqual(["数据分析"]);
    expect(merged.tailorOverall).toBe("按产品岗改写");
  });
});

import { bulletBody, findTitleOnlyRewrites } from "./tailor";

describe("title-only rewrite check", () => {
  const input = { experiences: [{ bullets: [{ id: "a", text: "渠道与 UGC 分析：用 SQL 将 60+ 个 UTM 来源归为 6 类入口" }] }] };

  it("extracts the body after the lead-in title", () => {
    expect(bulletBody("小标题：正文内容")).toBe("正文内容");
  });

  it("flags rewrites that only changed the title", () => {
    const flagged = findTitleOnlyRewrites(input, {
      bullets: [{ id: "a", action: "rewrite", text: "数据驱动增长分析：用SQL将60+个UTM来源归为6类入口" }],
    });
    expect(flagged.map((bullet) => bullet.id)).toEqual(["a"]);
  });

  it("does not flag real body rewrites or keeps", () => {
    expect(
      findTitleOnlyRewrites(input, {
        bullets: [{ id: "a", action: "rewrite", text: "增长数据分析：把 60+ 个 UTM 来源用 SQL 归为 6 类入口，对比各入口表现" }],
      }),
    ).toEqual([]);
    expect(findTitleOnlyRewrites(input, { bullets: [{ id: "a", action: "keep", text: "x" }] })).toEqual([]);
  });
});
