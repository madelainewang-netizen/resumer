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

  it("formats entries like the author's resume: degree first, location | date on the right", () => {
    const model = buildResumeModel(sampleProfile);
    const education = model.sections.find((section) => section.key === "education").entries[0];
    expect(education.title).toBe(`${sampleProfile.education[0].degree} ${sampleProfile.education[0].field}`);
    expect(education.subtitle).toBe(sampleProfile.education[0].school);
    const experience = model.sections.find((section) => section.key === "experience").entries[0];
    expect(experience.meta).toMatch(/^上海 \| /);
  });

  it("builds labeled, clickable contacts and a footer email", () => {
    const profile = structuredClone(sampleProfile);
    profile.basics.links = "github.com/someone, https://example.com/";
    const model = buildResumeModel(profile);
    expect(model.header.contacts.find((item) => item.label === "GitHub")).toMatchObject({
      href: "https://github.com/someone",
    });
    expect(model.header.contacts.find((item) => item.label === "邮箱").href).toMatch(/^mailto:/);
    expect(model.footer).toBe(profile.basics.email);
  });

  it("shows grouped skills like '产品：…' as bullet lines", () => {
    const profile = structuredClone(sampleProfile);
    profile.skills = ["产品：需求分析、PRD 撰写", "AI：Agent 工作流"];
    const skills = buildResumeModel(profile).sections.find((section) => section.key === "skills");
    expect(skills.kind).toBe("entries");
    expect(skills.entries[0].bullets[0]).toMatchObject({ lead: "产品：", text: "需求分析、PRD 撰写" });
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

import { parseLinks } from "./resumeModel";

describe("parseLinks", () => {
  it("uses the words before each URL as its label", () => {
    expect(parseLinks("GitHub github.com/madelainewang-netizen  作品集 madelainewang.me")).toEqual([
      { label: "GitHub", value: "github.com/madelainewang-netizen", href: "https://github.com/madelainewang-netizen" },
      { label: "作品集", value: "madelainewang.me", href: "https://madelainewang.me" },
    ]);
  });

  it("auto-labels bare URLs", () => {
    const items = parseLinks("github.com/a, https://example.com/");
    expect(items.map((item) => item.label)).toEqual(["GitHub", "主页"]);
    expect(items[1].value).toBe("example.com");
  });

  it("supports colons, separators and trailing non-link items", () => {
    const items = parseLinks("作品集：https://madelainewang.me | 小红书 王皮皮（累计 67 万+浏览）");
    expect(items).toEqual([
      { label: "作品集", value: "madelainewang.me", href: "https://madelainewang.me" },
      { label: "小红书", value: "王皮皮（累计 67 万+浏览）" },
    ]);
  });

  it("does not treat numbers like 6.5 or email domains as links", () => {
    expect(parseLinks("IELTS 6.5")).toEqual([{ label: "IELTS", value: "6.5" }]);
    expect(parseLinks("a@b.com")).toEqual([{ label: "主页", value: "a@b.com" }]);
  });
});

describe("extra contacts", () => {
  it("parses '名称 内容' pairs and falls back to 其他", () => {
    expect(parseLinks("小红书 王皮皮 | 可立即到岗", undefined, "其他")).toEqual([
      { label: "小红书", value: "王皮皮" },
      { label: "其他", value: "可立即到岗" },
    ]);
  });
});

describe("header name", () => {
  it("shows an English name after the Chinese name in the secondary style", () => {
    const profile = structuredClone(sampleProfile);
    profile.basics.name = "王欣培 Madelaine";
    profile.basics.targetRole = "";
    expect(buildResumeModel(profile).header).toMatchObject({ name: "王欣培", role: "Madelaine" });
  });
});
