import { describe, expect, it } from "vitest";
import { splitBulletSummary } from "./bulletSummary";

describe("bullet summary formatting", () => {
  it("splits a Chinese summary prefix from the bullet body", () => {
    expect(
      splitBulletSummary("跨市场KOL资源建设：独立搭建新加坡市场资源库"),
    ).toEqual({
      summary: "跨市场KOL资源建设：",
      body: "独立搭建新加坡市场资源库",
    });
  });

  it("supports an English colon and leaves ordinary text unchanged", () => {
    expect(splitBulletSummary("User research: Interviewed 12 users")).toEqual({
      summary: "User research:",
      body: "Interviewed 12 users",
    });
    expect(splitBulletSummary("推动报名流程优化")).toEqual({
      summary: "",
      body: "推动报名流程优化",
    });
  });

  it("does not treat a long sentence prefix as a summary", () => {
    expect(
      splitBulletSummary(
        "负责从用户研究到产品交付并与多个业务部门持续合作：推动项目上线",
      ).summary,
    ).toBe("");
  });
});
