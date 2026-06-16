import { beforeEach, describe, expect, it } from "vitest";
import { emptyProfile, sampleProfile } from "../data/defaults";
import {
  clearAllData,
  loadProfile,
  loadSession,
  loadVersions,
  saveProfile,
  saveSession,
  saveVersion,
  normalizeProfile,
} from "./resumerStorage";

describe("resumer storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and loads a valid profile", () => {
    saveProfile(sampleProfile);
    expect(loadProfile().basics.name).toBe(sampleProfile.basics.name);
  });

  it("falls back when stored data is invalid", () => {
    localStorage.setItem("resumer.profile.v1", '{"broken":true}');
    expect(loadProfile()).toEqual(emptyProfile);
  });

  it("migrates profiles created before photo and section ordering", () => {
    const oldProfile = structuredClone(sampleProfile);
    delete oldProfile.source;
    delete oldProfile.sectionOrder;
    delete oldProfile.customSections;
    delete oldProfile.basics.photo;
    const migrated = normalizeProfile(oldProfile);
    expect(migrated.basics.photo).toBe("");
    expect(migrated.sectionOrder[0]).toBe("education");
    expect(migrated.customSections).toEqual([]);
  });

  it("keeps only the latest 20 versions", () => {
    for (let index = 0; index < 22; index += 1) {
      saveVersion({ id: String(index), createdAt: new Date().toISOString() });
    }
    expect(loadVersions()).toHaveLength(20);
    expect(loadVersions()[0].id).toBe("21");
  });

  it("restores tailoring suggestions and original bullet text from the session", () => {
    const tailoredProfile = structuredClone(sampleProfile);
    tailoredProfile.experience[0].bullets[0] = {
      ...tailoredProfile.experience[0].bullets[0],
      originalText: "上一版原文",
      verificationRequired: false,
    };
    saveSession({
      tailoredProfile,
      tailorWorkspaceState: {
        condensePlan: { summary: "精简建议", recommendations: [] },
        removedSummary: "已删除摘要",
      },
    });

    const session = loadSession();
    expect(session.tailoredProfile.experience[0].bullets[0].originalText).toBe(
      "上一版原文",
    );
    expect(session.tailorWorkspaceState.removedSummary).toBe("已删除摘要");
  });

  it("clears all application data", () => {
    saveProfile(sampleProfile);
    saveVersion({ id: "v1" });
    clearAllData();
    expect(loadVersions()).toEqual([]);
    expect(loadProfile()).toEqual(emptyProfile);
  });
});
