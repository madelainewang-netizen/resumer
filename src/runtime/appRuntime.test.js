import { describe, expect, it } from "vitest";
import { parseAppRuntime } from "./appRuntime";

describe("app runtime parsing", () => {
  it("selects the case study page", () => {
    expect(parseAppRuntime("/case-study", "")).toEqual({
      page: "case-study",
      demoMode: false,
      embedMode: false,
    });
  });

  it("ignores workspace mode query parameters on the case study page", () => {
    expect(parseAppRuntime("/case-study", "?demo=1&embed=1")).toEqual({
      page: "case-study",
      demoMode: false,
      embedMode: false,
    });
  });

  it("enables demo and embed modes from the query string", () => {
    expect(parseAppRuntime("/", "?demo=1&embed=1")).toEqual({
      page: "workspace",
      demoMode: true,
      embedMode: true,
    });
  });

  it("uses standard workspace flags by default", () => {
    expect(parseAppRuntime("/", "")).toEqual({
      page: "workspace",
      demoMode: false,
      embedMode: false,
    });
  });
});
