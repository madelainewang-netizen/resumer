import { createId } from "../data/defaults";

const VALID_TYPES = new Set(["experience", "project", "custom"]);
const EVIDENCE_SECTION_ID = "evidence_additions";

function clean(value) {
  return String(value || "").trim();
}

function createBullets(items) {
  return (items || [])
    .map(clean)
    .filter(Boolean)
    .map((text) => ({ id: createId("bullet"), text }));
}

function ensureSection(profile, section) {
  return profile.sectionOrder.includes(section)
    ? profile.sectionOrder
    : [...profile.sectionOrder, section];
}

export function addEvidenceToProfile(profile, draft) {
  const type = VALID_TYPES.has(draft.suggestedType)
    ? draft.suggestedType
    : "project";
  const bullets = createBullets(draft.bullets);

  if (type === "experience") {
    return {
      ...profile,
      sectionOrder: ensureSection(profile, "experience"),
      experience: [
        ...profile.experience,
        {
          id: createId("exp"),
          company: clean(draft.organization),
          role: clean(draft.role) || clean(draft.title),
          startDate: clean(draft.startDate),
          endDate: clean(draft.endDate),
          location: clean(draft.location),
          bullets,
        },
      ],
    };
  }

  if (type === "project") {
    return {
      ...profile,
      sectionOrder: ensureSection(profile, "projects"),
      projects: [
        ...profile.projects,
        {
          id: createId("project"),
          name: clean(draft.title),
          role: clean(draft.role) || clean(draft.organization),
          stack: (draft.skills || []).map(clean).filter(Boolean).join("、"),
          startDate: clean(draft.startDate),
          endDate: clean(draft.endDate),
          bullets,
        },
      ],
    };
  }

  const entry = {
    id: createId("custom_item"),
    title: clean(draft.title),
    subtitle: [clean(draft.organization), clean(draft.role)]
      .filter(Boolean)
      .join(" · "),
    date: [clean(draft.startDate), clean(draft.endDate)]
      .filter(Boolean)
      .join(" – "),
    location: clean(draft.location),
    bullets,
  };
  const hasSection = profile.customSections.some(
    (section) => section.id === EVIDENCE_SECTION_ID,
  );
  const customSections = hasSection
    ? profile.customSections.map((section) =>
        section.id === EVIDENCE_SECTION_ID
          ? { ...section, items: [...section.items, entry] }
          : section,
      )
    : [
        ...profile.customSections,
        { id: EVIDENCE_SECTION_ID, title: "补充经历", items: [entry] },
      ];
  const hasCustomSlot =
    profile.sectionOrder.includes("customSections") ||
    profile.sectionOrder.includes(EVIDENCE_SECTION_ID);

  return {
    ...profile,
    customSections,
    sectionOrder: hasCustomSlot
      ? profile.sectionOrder
      : [...profile.sectionOrder, EVIDENCE_SECTION_ID],
  };
}
