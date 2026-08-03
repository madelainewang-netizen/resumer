import { describe, expect, it } from "vitest";
import { hyphenateResumeWord } from "./textWrapping";

describe("hyphenateResumeWord", () => {
  it("adds line break opportunities inside CJK text while keeping Latin runs readable", () => {
    expect(hyphenateResumeWord("Agent自动化工作流搭建")).toEqual([
      "Agent",
      "自",
      "动",
      "化",
      "工",
      "作",
      "流",
      "搭",
      "建",
    ]);
  });

  it("keeps ordinary English words unbroken", () => {
    expect(hyphenateResumeWord("Campaign")).toEqual(["Campaign"]);
  });
});
