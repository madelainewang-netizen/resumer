import { describe, expect, it } from "vitest";
import { updateTailoredBullet } from "./tailorProfile";

const profile = {
  experience: [
    { id: "exp_1", bullets: [{ id: "b_1", text: "工作原文" }] },
  ],
  projects: [
    { id: "project_1", bullets: [{ id: "b_2", text: "项目原文" }] },
  ],
  customSections: [
    {
      id: "custom_1",
      items: [
        { id: "item_1", bullets: [{ id: "b_3", text: "其他内容原文" }] },
      ],
    },
  ],
};

describe("tailored profile bullet updates", () => {
  it("updates a regular experience bullet", () => {
    const result = updateTailoredBullet(profile, {
      section: "experience",
      itemId: "exp_1",
      bulletId: "b_1",
      patch: { text: "工作优化" },
    });

    expect(result.experience[0].bullets[0].text).toBe("工作优化");
  });

  it("updates a custom section bullet", () => {
    const result = updateTailoredBullet(profile, {
      section: "customSections",
      sectionId: "custom_1",
      itemId: "item_1",
      bulletId: "b_3",
      patch: { text: "其他内容优化" },
    });

    expect(result.customSections[0].items[0].bullets[0].text).toBe(
      "其他内容优化",
    );
  });
});
