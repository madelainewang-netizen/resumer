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

describe("to-confirm list", () => {
  it("passes questions the user must confirm through to the UI", () => {
    const merged = mergeTailorRewrite(sampleProfile, { summary: "", bullets: [], gaps: [], toConfirm: ["资源库是你独立搭建的吗？", ""] });
    expect(merged.tailorToConfirm).toEqual(["资源库是你独立搭建的吗？"]);
  });
});

import { findWeakRewrites } from "./tailor";

describe("colloquial rewrite check", () => {
  const input = { experiences: [{ bullets: [{ id: "a", text: "选题复盘：复盘 33 篇历史稿件的收录情况" }] }] };
  it("flags rewrites that slip into spoken Chinese", () => {
    const flagged = findWeakRewrites(input, {
      bullets: [{ id: "a", action: "rewrite", text: "选题复盘：我帮团队把 33 篇稿件整理了一下，然后调整方向" }],
    });
    expect(flagged).toEqual([expect.objectContaining({ id: "a", issue: "colloquial" })]);
  });
  it("accepts resume-style rewrites", () => {
    expect(
      findWeakRewrites(input, {
        bullets: [{ id: "a", action: "rewrite", text: "内容数据复盘：复盘 33 篇历史稿件收录情况，识别高收录选题并调整投稿方向" }],
      }),
    ).toEqual([]);
  });
});

import { composeBullet, materializeBullets, stripFirstPerson } from "./tailor";

describe("STAR assembly", () => {
  it("assembles title, situation, action and result in a fixed order", () => {
    expect(
      composeBullet({
        title: "流程拆解与 AI 提效",
        situation: "Clipping Report 需逐条查原帖，单份约 2 小时。",
        act: "拆解重复步骤后用 Trae 搭建素材处理 Agent，保留人工复核",
        result: "单份降至约 30 分钟，节省 75%",
      }),
    ).toBe("流程拆解与 AI 提效：Clipping Report 需逐条查原帖，单份约 2 小时，拆解重复步骤后用 Trae 搭建素材处理 Agent，保留人工复核；单份降至约 30 分钟，节省 75%");
  });

  it("skips empty parts cleanly", () => {
    expect(composeBullet({ title: "选题复盘", situation: "", act: "复盘 33 篇历史稿件", result: "" })).toBe("选题复盘：复盘 33 篇历史稿件");
  });

  it("removes first-person pronouns", () => {
    expect(stripFirstPerson("下载结果由我人工复核后再使用")).toBe("下载结果人工复核后再使用");
    expect(stripFirstPerson("我搭建了素材库，我们团队负责执行")).toBe("搭建了素材库，团队负责执行");
    expect(stripFirstPerson("准备自我介绍")).toBe("准备自我介绍");
  });

  it("keeps the original text for keep actions", () => {
    const [bullet] = materializeBullets([{ id: "a", action: "keep", title: "", situation: "", act: "", result: "" }], new Map([["a", "原文"]]));
    expect(bullet.text).toBe("原文");
  });
});

describe("entry removal advice and 本人", () => {
  it("passes remove suggestions through", () => {
    const merged = mergeTailorRewrite(sampleProfile, {
      summary: "", bullets: [], gaps: [], toConfirm: [],
      entries: [{ entryId: "exp_1", decision: "remove", reason: "与岗位关联弱" }, { entryId: "exp_2", decision: "keep", reason: "" }],
    });
    expect(merged.tailorRemovals).toEqual([{ entryId: "exp_1", reason: "与岗位关联弱" }]);
  });

  it("removes 由本人 / 本人 as well", () => {
    expect(stripFirstPerson("下载完成部分由本人逐张人工复核后再投入使用")).toBe("下载完成部分逐张人工复核后再投入使用");
    expect(stripFirstPerson("本人负责数据整理")).toBe("负责数据整理");
  });

  it("gives every experience group its entry id", () => {
    expect(buildTailorInput(sampleProfile).experiences[0].entryId).toBe(sampleProfile.experience[0].id);
  });
});
