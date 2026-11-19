import { describe, expect, it } from "vitest";
import { removeEntry, restoreEntry } from "./entries";

const profile = {
  experience: [{ id: "a", company: "A", bullets: [] }, { id: "b", company: "B", bullets: [] }, { id: "c", company: "C", bullets: [] }],
  projects: [],
  customSections: [{ id: "s", title: "其他", items: [{ id: "x", title: "X", bullets: [] }] }],
};

describe("remove / restore entries in a tailored version", () => {
  it("removes an experience and restores it to the same position", () => {
    const removed = removeEntry(profile, "b");
    expect(removed.experience.map((item) => item.id)).toEqual(["a", "c"]);
    const restored = restoreEntry(removed, "b");
    expect(restored.experience.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(restored.tailorRemoved).toEqual([]);
  });

  it("works for custom section items", () => {
    const removed = removeEntry(profile, "x");
    expect(removed.customSections[0].items).toEqual([]);
    expect(restoreEntry(removed, "x").customSections[0].items[0].id).toBe("x");
  });
});
