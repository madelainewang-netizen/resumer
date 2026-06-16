import { describe, expect, it } from "vitest";
import { sampleProfile } from "../data/defaults";
import { addEvidenceToProfile } from "./evidence";

const baseDraft = {
  suggestedType: "project",
  title: "公益活动报名流程优化",
  organization: "校园志愿者协会",
  role: "项目负责人",
  startDate: "2024.03",
  endDate: "2024.05",
  location: "上海",
  skills: ["用户研究", "项目管理"],
  bullets: ["访谈 8 名参与者并梳理报名流程中的主要阻塞点。"],
  verificationChecklist: [],
};

describe("evidence profile mapping", () => {
  it("adds a confirmed project draft without changing existing entries", () => {
    const result = addEvidenceToProfile(sampleProfile, baseDraft);

    expect(result).not.toBe(sampleProfile);
    expect(result.projects).toHaveLength(sampleProfile.projects.length + 1);
    expect(result.projects.at(-1)).toMatchObject({
      name: baseDraft.title,
      role: baseDraft.role,
      stack: "用户研究、项目管理",
      startDate: baseDraft.startDate,
      endDate: baseDraft.endDate,
    });
    expect(result.projects.at(-1).bullets[0].text).toBe(baseDraft.bullets[0]);
  });

  it("adds work evidence to experience using only confirmed draft fields", () => {
    const result = addEvidenceToProfile(sampleProfile, {
      ...baseDraft,
      suggestedType: "experience",
      title: "",
    });

    expect(result.experience.at(-1)).toMatchObject({
      company: baseDraft.organization,
      role: baseDraft.role,
      location: baseDraft.location,
    });
  });

  it("collects other evidence in one editable custom section", () => {
    const first = addEvidenceToProfile(sampleProfile, {
      ...baseDraft,
      suggestedType: "custom",
    });
    const second = addEvidenceToProfile(first, {
      ...baseDraft,
      suggestedType: "custom",
      title: "独立内容项目",
    });

    const section = second.customSections.find(
      (item) => item.id === "evidence_additions",
    );
    expect(section.title).toBe("补充经历");
    expect(section.items).toHaveLength(2);
    expect(
      second.sectionOrder.includes("customSections") ||
        second.sectionOrder.includes("evidence_additions"),
    ).toBe(true);
  });

  it("ignores blank bullets and falls back to a valid destination", () => {
    const result = addEvidenceToProfile(sampleProfile, {
      ...baseDraft,
      suggestedType: "unexpected",
      bullets: ["", "  ", "完成可用性测试"],
    });

    expect(result.projects.at(-1).bullets).toHaveLength(1);
    expect(result.projects.at(-1).bullets[0].text).toBe("完成可用性测试");
  });

  it("makes a newly created destination visible in an uploaded resume order", () => {
    const result = addEvidenceToProfile(
      { ...sampleProfile, sectionOrder: ["education", "experience", "skills"] },
      baseDraft,
    );

    expect(result.sectionOrder).toEqual([
      "education",
      "experience",
      "skills",
      "projects",
    ]);
  });
});
