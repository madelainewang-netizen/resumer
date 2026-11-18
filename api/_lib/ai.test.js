import { describe, expect, it } from "vitest";
import { extractJSON, getAIConfig } from "./ai";

describe("AI config", () => {
  it("keeps backwards compatibility with DEEPSEEK_* variables", () => {
    const config = getAIConfig({ DEEPSEEK_API_KEY: "k", DEEPSEEK_MODEL: "deepseek-chat" });
    expect(config).toMatchObject({ apiKey: "k", model: "deepseek-chat", baseURL: "https://api.deepseek.com" });
  });

  it("switches provider defaults with AI_PROVIDER", () => {
    const config = getAIConfig({ AI_PROVIDER: "qwen", AI_API_KEY: "k" });
    expect(config.baseURL).toContain("dashscope");
    expect(config.model).toBe("qwen-plus");
  });

  it("lets AI_BASE_URL and AI_MODEL override presets", () => {
    const config = getAIConfig({ AI_API_KEY: "k", AI_BASE_URL: "https://x.test/v1", AI_MODEL: "m" });
    expect(config).toMatchObject({ baseURL: "https://x.test/v1", model: "m" });
  });
});

describe("extractJSON", () => {
  it("strips markdown fences and surrounding text", () => {
    expect(JSON.parse(extractJSON('好的：\n```json\n{"a":1}\n```'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJSON('结果 {"a":2} 完成'))).toEqual({ a: 2 });
  });
});
