import { describe, expect, it } from "vitest";
import { selectRootView } from "./main";

describe("selectRootView", () => {
  it("selects the case study view", () => {
    expect(selectRootView({ page: "case-study" }).type.name).toBe(
      "CaseStudyPage",
    );
  });

  it("passes demo and embed modes to the workspace", () => {
    const view = selectRootView({
      page: "workspace",
      demoMode: true,
      embedMode: true,
    });

    expect(view.props.runtime).toEqual({
      demoMode: true,
      embedMode: true,
    });
  });
});
