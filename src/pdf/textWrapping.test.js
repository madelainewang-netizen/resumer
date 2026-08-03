import { describe, expect, it } from "vitest";
import { hyphenateResumeWord, wrapResumeText } from "./textWrapping";

describe("hyphenateResumeWord", () => {
  it("keeps words intact so react-pdf does not insert visible hyphens", () => {
    expect(hyphenateResumeWord("Agent自动化工作流搭建")).toEqual([
      "Agent自动化工作流搭建",
    ]);
  });

  it("keeps ordinary English words unbroken", () => {
    expect(hyphenateResumeWord("Campaign")).toEqual(["Campaign"]);
  });

  it("wraps long CJK text without zero-width characters or visible hyphen markers", () => {
    const wrapped = wrapResumeText(
      "用户研究证据：围绕生成式AI产品体验整理访谈反馈，需求线索和使用障碍，输出可复盘的问题清单并支持产品讨论。",
      { maxUnits: 18 },
    );

    expect(wrapped).toContain("\n");
    expect(wrapped).not.toContain("\u200B");
    expect(wrapped).not.toContain("-\n");
    expect(wrapped).not.toContain("\n。");
  });
});
