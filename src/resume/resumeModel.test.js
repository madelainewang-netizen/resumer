import { describe, expect, it } from "vitest";
import { sampleProfile } from "../data/defaults";
import { buildResumeModel, detectResumeLanguage } from "./resumeModel";

describe("buildResumeModel", () => {
  it("uses Chinese section titles for Chinese resumes", () => {
    const model = buildResumeModel(sampleProfile);
    expect(model.language).toBe("zh");
    expect(model.sections.map((section) => section.title)).toContain("工作经历");
  });

  it("uses English titles for English resumes", () => {
    const profile = structuredClone(sampleProfile);
    profile.basics.name = "Lin Xiao";
    profile.basics.summary = "Product manager focused on B2B SaaS and growth products.";
    profile.experience = profile.experience.map((item) => ({
      ...item,
      company: "Cloudsail",
      role: "Product Manager",
      bullets: [{ id: "b", text: "Led roadmap planning and shipped three releases with design and engineering." }],
    }));
    profile.projects = [];
    expect(detectResumeLanguage(profile)).toBe("en");
    expect(buildResumeModel(profile).sections[0].title).toBe("Summary");
  });

  it("splits bold lead-ins from bullet text", () => {
    const profile = structuredClone(sampleProfile);
    profile.experience[0].bullets = [{ id: "b1", text: "需求规划：推动 3 个版本上线" }];
    const experience = buildResumeModel(profile).sections.find((section) => section.key === "experience");
    expect(experience.entries[0].bullets[0]).toEqual({ id: "b1", lead: "需求规划：", text: "推动 3 个版本上线" });
  });

  it("does not render a custom section twice when it is listed both individually and as a group", () => {
    const profile = structuredClone(sampleProfile);
    profile.customSections = [
      { id: "awards", title: "荣誉奖项", items: [{ id: "a", title: "一等奖学金", subtitle: "", date: "2020", location: "", bullets: [] }] },
    ];
    profile.sectionOrder = ["awards", "customSections"];
    const titles = buildResumeModel(profile).sections.map((section) => section.title);
    expect(titles.filter((title) => title === "荣誉奖项")).toHaveLength(1);
  });

  it("drops empty entries", () => {
    const profile = structuredClone(sampleProfile);
    profile.education.push({ id: "empty", school: "", degree: "", field: "", startDate: "", endDate: "", details: "" });
    const education = buildResumeModel(profile).sections.find((section) => section.key === "education");
    expect(education.entries.every((entry) => entry.title || entry.subtitle)).toBe(true);
  });
});
