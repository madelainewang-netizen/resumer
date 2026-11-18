import { describe, expect, it } from "vitest";
import { hyphenateResumeWord } from "./textWrapping";

const pieces = (word) => hyphenateResumeWord(word).filter(Boolean);

describe("hyphenateResumeWord", () => {
  it("keeps ordinary English words unbroken", () => {
    expect(hyphenateResumeWord("Campaign")).toEqual(["Campaign"]);
  });

  it("splits Chinese into breakable characters joined by empty strings (no visible hyphen)", () => {
    expect(hyphenateResumeWord("用户研究")).toEqual(["用", "", "户", "", "研", "", "究"]);
  });

  it("keeps Latin words, numbers and percentages intact inside Chinese text", () => {
    expect(pieces("搭建Agent工作流提升18%。")).toEqual(["搭", "建", "Agent", "工", "作", "流", "提", "升", "18%。"]);
  });

  it("never starts a line with closing punctuation or ends one with an opening bracket", () => {
    const result = pieces("数据（DAU、留存），完成。");
    expect(result.some((piece) => /^[，。、）]/.test(piece))).toBe(false);
    expect(result.some((piece) => /（$/.test(piece))).toBe(false);
  });

  it("allows very long URLs to break after separators", () => {
    const result = pieces("https://notion.so/workspace/product-requirements-template-2024");
    expect(result.length).toBeGreaterThan(1);
    expect(result.join("")).toBe("https://notion.so/workspace/product-requirements-template-2024");
  });
});
