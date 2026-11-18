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

import { listEvidenceTargets, mergeAddedEvidence } from "./evidence";

describe("adding evidence to an existing entry", () => {
  const base = {
    sectionOrder: ["experience"],
    experience: [{ id: "exp_a", company: "SMCP", role: "实习生", bullets: [{ id: "b1", text: "原有条目" }] }],
    projects: [],
    customSections: [],
  };

  it("appends bullets to the chosen experience instead of creating a new one", () => {
    const next = addEvidenceToProfile(base, { targetItemId: "exp_a", suggestedType: "experience", bullets: ["新补充的一条"] });
    expect(next.experience).toHaveLength(1);
    expect(next.experience[0].bullets.map((bullet) => bullet.text)).toEqual(["原有条目", "新补充的一条"]);
  });

  it("lists existing entries as targets", () => {
    expect(listEvidenceTargets(base)).toEqual([{ id: "exp_a", label: "工作/实习：SMCP · 实习生" }]);
  });

  it("syncs appended bullets into the tailored result without touching rewritten ones", () => {
    const tailored = {
      ...base,
      experience: [{ ...base.experience[0], bullets: [{ id: "b1", text: "改写后", originalText: "原有条目" }] }],
    };
    const next = addEvidenceToProfile(base, { targetItemId: "exp_a", bullets: ["新补充的一条"] });
    const merged = mergeAddedEvidence(tailored, base, next);
    expect(merged.experience[0].bullets.map((bullet) => bullet.text)).toEqual(["改写后", "新补充的一条"]);
    expect(merged.experience[0].bullets[1].originalText).toBe("新补充的一条");
  });
});

import { mergeDuplicateEntries } from "./evidence";

describe("mergeDuplicateEntries", () => {
  const profile = {
    sectionOrder: ["experience"],
    projects: [],
    customSections: [],
    experience: [
      { id: "a", company: "SMCP Asia Limited（SANDRO / Maje）", role: "市场营销实习生", startDate: "2026.04", endDate: "2026.07", location: "香港", bullets: [{ id: "1", text: "AI 提效：原有条目" }] },
      { id: "b", company: "美团", role: "用户增长实习生", startDate: "2023.12", endDate: "2024.02", location: "上海", bullets: [{ id: "2", text: "美团条目" }] },
      { id: "c", company: "SMCP Asia Limited（SANDRO / Maje）", role: "市场营销实习生", startDate: "2026.04", endDate: "2026.07", location: "香港", bullets: [{ id: "3", text: "AI 流程搭建与人工复核：补充的条目" }, { id: "4", text: "AI 提效：原有条目" }] },
    ],
  };

  it("merges a duplicated internship into the original one and drops repeated bullets", () => {
    const merged = mergeDuplicateEntries(profile);
    expect(merged.experience.map((item) => item.id)).toEqual(["a", "b"]);
    expect(merged.experience[0].bullets.map((bullet) => bullet.text)).toEqual(["AI 提效：原有条目", "AI 流程搭建与人工复核：补充的条目"]);
  });

  it("treats an entry with blank role/dates at the same company as the same internship", () => {
    const loose = structuredClone(profile);
    loose.experience[2] = { ...loose.experience[2], role: "", startDate: "", endDate: "" };
    expect(mergeDuplicateEntries(loose).experience).toHaveLength(2);
  });

  it("keeps two different roles at the same company apart", () => {
    const twoRoles = structuredClone(profile);
    twoRoles.experience[2] = { ...twoRoles.experience[2], role: "PR 实习生", startDate: "2025.01", endDate: "2025.03" };
    expect(mergeDuplicateEntries(twoRoles).experience).toHaveLength(3);
  });
});
