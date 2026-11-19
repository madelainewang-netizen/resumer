import { describe, expect, it } from "vitest";
import { extractJSON, getAIConfig } from "./ai";

describe("AI config", () => {
  it("keeps backwards compatibility with DEEPSEEK_* variables", () => {
    const config = getAIConfig({ DEEPSEEK_API_KEY: "k", DEEPSEEK_MODEL: "deepseek-chat" });
    expect(config).toMatchObject({ provider: "deepseek", apiKey: "k", model: "deepseek-chat", baseURL: "https://api.deepseek.com" });
  });

  it("picks Kimi automatically when KIMI_API_KEY is configured", () => {
    const config = getAIConfig({ KIMI_API_KEY: "kimi", DEEPSEEK_API_KEY: "ds" });
    expect(config).toMatchObject({
      provider: "moonshot",
      apiKey: "kimi",
      model: "kimi-k3",
      baseURL: "https://api.moonshot.cn/v1",
      fallbackBaseURL: "https://api.moonshot.ai/v1",
      fixedTemperature: true,
      reasoningEffort: "low",
    });
  });

  it("lets AI_PROVIDER force a provider and accepts 'kimi' as an alias", () => {
    expect(getAIConfig({ AI_PROVIDER: "deepseek", KIMI_API_KEY: "kimi", DEEPSEEK_API_KEY: "ds" }).apiKey).toBe("ds");
    expect(getAIConfig({ AI_PROVIDER: "kimi", KIMI_API_KEY: "kimi" }).provider).toBe("moonshot");
  });

  it("does not apply DEEPSEEK_MODEL to other providers", () => {
    expect(getAIConfig({ KIMI_API_KEY: "k", DEEPSEEK_MODEL: "deepseek-chat" }).model).toBe("kimi-k3");
  });

  it("lets AI_BASE_URL and AI_MODEL override presets", () => {
    const config = getAIConfig({ AI_API_KEY: "k", AI_BASE_URL: "https://x.test/v1", AI_MODEL: "m" });
    expect(config).toMatchObject({ baseURL: "https://x.test/v1", model: "m", fallbackBaseURL: "" });
  });
});

describe("extractJSON", () => {
  it("strips markdown fences and surrounding text", () => {
    expect(JSON.parse(extractJSON('好的：\n```json\n{"a":1}\n```'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJSON('结果 {"a":2} 完成'))).toEqual({ a: 2 });
  });
});
