import { describe, expect, it } from "vitest";
import { hasVisibleEntryContent } from "./resumeVisibility";

describe("resume entry visibility", () => {
  it("hides a completely empty entry instead of showing an unnamed fallback", () => {
    expect(
      hasVisibleEntryContent({
        title: "",
        organization: "",
        meta: "",
        location: "",
        bullets: [],
      }),
    ).toBe(false);
  });

  it("keeps an entry when any meaningful field or bullet exists", () => {
    expect(
      hasVisibleEntryContent({
        title: "",
        organization: "",
        meta: "",
        location: "",
        bullets: [{ id: "b1", text: "完成内容分析" }],
      }),
    ).toBe(true);
  });
});
