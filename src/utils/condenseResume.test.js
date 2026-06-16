import { describe, expect, it } from "vitest";
import { sampleProfile } from "../data/defaults";
import {
  applyCondenseRecommendation,
  indexCondenseRecommendations,
  removeSummary,
  removeResumeItem,
  restoreRemovedBullet,
  restoreResumeItem,
  restoreSummary,
  removeSkill,
  restoreSkill,
  removeCustomItem,
  removeCustomSection,
  restoreCustomItem,
  restoreCustomSection,
} from "./condenseResume";

const profile = {
  ...sampleProfile,
  experience: sampleProfile.experience.map((item) => ({
    ...item,
    bullets: item.bullets.map((bullet) => ({
      ...bullet,
      originalText: bullet.text,
      verificationRequired: false,
    })),
  })),
};

describe("condense resume recommendations", () => {
  it("indexes recommendations by section, item and bullet", () => {
    const recommendation = {
      section: "experience",
      itemId: "exp_sample_1",
      bulletId: "bullet_sample_1",
      action: "condense",
      reason: "内容偏长",
      suggestedText: "精简后的描述",
    };

    expect(indexCondenseRecommendations([recommendation])).toEqual({
      "experience:exp_sample_1:bullet_sample_1": recommendation,
    });
  });

  it("applies a condensed sentence without changing other bullets", () => {
    const result = applyCondenseRecommendation(profile, {
      section: "experience",
      itemId: "exp_sample_1",
      bulletId: "bullet_sample_1",
      action: "condense",
      reason: "内容偏长",
      suggestedText: "负责企业协作产品需求规划并推动跨团队交付。",
    });

    expect(result.experience[0].bullets[0].text).toBe(
      "负责企业协作产品需求规划并推动跨团队交付。",
    );
    expect(result.experience[0].bullets[1]).toEqual(
      profile.experience[0].bullets[1],
    );
  });

  it("removes only the recommended bullet", () => {
    const result = applyCondenseRecommendation(profile, {
      section: "experience",
      itemId: "exp_sample_1",
      bulletId: "bullet_sample_1",
      action: "remove",
      reason: "与目标岗位相关度低",
      suggestedText: "",
    });

    expect(result.experience[0].bullets).toHaveLength(1);
    expect(result.experience[0].bullets[0].id).toBe("bullet_sample_2");
  });

  it("ignores recommendations that do not point to editable resume content", () => {
    expect(
      applyCondenseRecommendation(profile, {
        section: "education",
        itemId: "missing",
        bulletId: "missing",
        action: "remove",
        reason: "",
        suggestedText: "",
      }),
    ).toBe(profile);
  });

  it("restores a removed bullet to its original position", () => {
    const removed = profile.experience[0].bullets[0];
    const afterRemoval = applyCondenseRecommendation(profile, {
      section: "experience",
      itemId: "exp_sample_1",
      bulletId: removed.id,
      action: "remove",
      reason: "",
      suggestedText: "",
    });
    const restored = restoreRemovedBullet(afterRemoval, {
      section: "experience",
      itemId: "exp_sample_1",
      bullet: removed,
      index: 0,
    });

    expect(restored.experience[0].bullets).toEqual(
      profile.experience[0].bullets,
    );
  });

  it("removes and restores an entire experience at its original position", () => {
    const removed = removeResumeItem(profile, "experience", "exp_sample_1");

    expect(removed.profile.experience).toHaveLength(
      profile.experience.length - 1,
    );
    expect(removed.removed.item.id).toBe("exp_sample_1");
    expect(removed.removed.index).toBe(0);

    const restored = restoreResumeItem(removed.profile, removed.removed);
    expect(restored.experience).toEqual(profile.experience);
  });

  it("does not change the profile when an entire experience cannot be found", () => {
    const result = removeResumeItem(profile, "experience", "missing");
    expect(result.profile).toBe(profile);
    expect(result.removed).toBeNull();
  });

  it("removes and restores the professional summary", () => {
    const removed = removeSummary(profile);

    expect(removed.profile.basics.summary).toBe("");
    expect(removed.summary).toBe(profile.basics.summary);
    expect(restoreSummary(removed.profile, removed.summary).basics.summary).toBe(
      profile.basics.summary,
    );
  });

  it("does not create a removal record for an empty summary", () => {
    const emptySummaryProfile = {
      ...profile,
      basics: { ...profile.basics, summary: "" },
    };
    const result = removeSummary(emptySummaryProfile);

    expect(result.profile).toBe(emptySummaryProfile);
    expect(result.summary).toBe("");
  });

  it("removes and restores education entries with the generic item operation", () => {
    const removed = removeResumeItem(profile, "education", "edu_sample");
    expect(removed.profile.education).toHaveLength(0);
    expect(restoreResumeItem(removed.profile, removed.removed).education).toEqual(
      profile.education,
    );
  });

  it("removes and restores an individual skill at its original position", () => {
    const removed = removeSkill(profile, 1);
    expect(removed.profile.skills).not.toContain(profile.skills[1]);
    expect(restoreSkill(removed.profile, removed.removed).skills).toEqual(
      profile.skills,
    );
  });

  it("removes and restores a custom section item", () => {
    const customProfile = {
      ...profile,
      customSections: [
        {
          id: "custom_1",
          title: "内容创作",
          items: [
            {
              id: "custom_item_1",
              title: "Newsletter",
              subtitle: "",
              date: "",
              location: "",
              bullets: [],
            },
          ],
        },
      ],
    };
    const removed = removeCustomItem(customProfile, "custom_1", "custom_item_1");
    expect(removed.profile.customSections[0].items).toHaveLength(0);
    expect(
      restoreCustomItem(removed.profile, removed.removed).customSections[0].items,
    ).toEqual(customProfile.customSections[0].items);
  });

  it("removes and restores an entire custom section", () => {
    const customProfile = {
      ...profile,
      customSections: [{ id: "custom_1", title: "证书", items: [] }],
    };
    const removed = removeCustomSection(customProfile, "custom_1");
    expect(removed.profile.customSections).toHaveLength(0);
    expect(
      restoreCustomSection(removed.profile, removed.removed).customSections,
    ).toEqual(customProfile.customSections);
  });
});
