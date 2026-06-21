import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoServices } from "./demoResumerApi";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("demo resumer services", () => {
  it("analyzes the demo JD without using the network", async () => {
    globalThis.fetch = vi.fn(() => {
      throw new Error("demo services must not fetch");
    });

    const result = await createDemoServices().analyzeJD("demo jd", vi.fn());

    expect(result.position).toBe("AI 产品助理");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns a fresh tailored resume clone for every call", async () => {
    const services = createDemoServices();

    const first = await services.tailorResume({}, {}, vi.fn());
    first.basics.name = "已修改";
    const second = await services.tailorResume({}, {}, vi.fn());

    expect(second.basics.name).toBe("陈雨桐");
    expect(second).not.toBe(first);
  });
});
