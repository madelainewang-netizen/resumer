import { describe, expect, it } from "vitest";
import App from "../App";
import CaseStudyPage from "../components/CaseStudyPage";
import { selectRootView } from "./rootView";

describe("selectRootView", () => {
  it("selects the case study view", () => {
    const view = selectRootView({ page: "case-study" });

    expect(view.type).toBe(CaseStudyPage);
  });

  it("passes exact runtime flags to the workspace", () => {
    const view = selectRootView({
      page: "workspace",
      demoMode: true,
      embedMode: true,
    });

    expect(view.type).toBe(App);
    expect(view.props.runtime).toEqual({
      demoMode: true,
      embedMode: true,
    });
  });
});
