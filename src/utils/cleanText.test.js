import { describe, expect, it } from "vitest";
import { cleanResumeStrings, cleanResumeText } from "./cleanText";

describe("cleanResumeText", () => {
  it("removes spaces between Chinese characters", () => {
    expect(cleanResumeText("用 户  研究")).toBe("用户研究");
    expect(cleanResumeText("汇总 3.2万条笔记、去重得 2万 +篇 UGC ，按内容")).toBe("汇总 3.2万条笔记、去重得 2万 +篇 UGC，按内容");
  });

  it("removes spaces around Chinese punctuation", () => {
    expect(cleanResumeText("用户行为与渠道分析： 整理 60+个 UTM")).toBe("用户行为与渠道分析：整理 60+个 UTM");
    expect(cleanResumeText("复盘“ 2023评友节” 连续")).toBe("复盘“2023评友节”连续");
  });

  it("keeps single spaces between English words and between Chinese and English", () => {
    expect(cleanResumeText("Clipping Report 需逐条查原帖")).toBe("Clipping Report 需逐条查原帖");
    expect(cleanResumeText("AI  产品")).toBe("AI 产品");
  });

  it("cleans nested profile strings but leaves photos and ids alone", () => {
    const result = cleanResumeStrings({ basics: { name: "王 欣培", photo: "data: x  y" }, items: [{ id: "a  b", text: "用 户" }] });
    expect(result).toEqual({ basics: { name: "王欣培", photo: "data: x  y" }, items: [{ id: "a  b", text: "用户" }] });
  });
});
