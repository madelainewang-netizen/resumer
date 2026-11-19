import { cleanResumeText } from "./cleanText";
import { createId } from "../data/defaults";

const VALID_TYPES = new Set(["experience", "project", "custom"]);
const EVIDENCE_SECTION_ID = "evidence_additions";

function clean(value) {
  return cleanResumeText(String(value || ""));
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

/** 可以把新补充的事实追加进去的已有经历。 */
export function listEvidenceTargets(profile) {
  return [
    ...(profile.experience || []).map((item) => ({
      id: item.id,
      label: `工作/实习：${[item.company, item.role].filter(Boolean).join(" · ") || "未命名"}`,
    })),
    ...(profile.projects || []).map((item) => ({
      id: item.id,
      label: `项目：${item.name || "未命名"}`,
    })),
    ...(profile.customSections || []).flatMap((section) =>
      (section.items || []).map((item) => ({
        id: item.id,
        label: `${section.title || "其他"}：${[item.title, item.subtitle].filter(Boolean).join(" · ") || "未命名"}`,
      })),
    ),
  ];
}

function appendToExisting(profile, targetId, bullets) {
  const append = (item) => (item.id === targetId ? { ...item, bullets: [...item.bullets, ...bullets] } : item);
  return {
    ...profile,
    experience: profile.experience.map(append),
    projects: profile.projects.map(append),
    customSections: profile.customSections.map((section) => ({
      ...section,
      items: section.items.map(append),
    })),
  };
}

function addEvidenceRaw(profile, draft) {
  const bullets0 = createBullets(draft.bullets);
  if (draft.targetItemId && listEvidenceTargets(profile).some((item) => item.id === draft.targetItemId)) {
    return appendToExisting(profile, draft.targetItemId, bullets0);
  }
  const type = VALID_TYPES.has(draft.suggestedType)
    ? draft.suggestedType
    : "project";
  const bullets = bullets0;

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

/**
 * 把"补充经历"新增的内容同步进当前的定制结果：
 * 已有经历里新加的条目追加到对应经历末尾，新建的经历追加到对应模块。
 * 新内容标记为"保持原文"（originalText = text），不需要再确认。
 */
export function mergeAddedEvidence(tailored, before, after) {
  const mark = (bullet) => ({ ...bullet, originalText: bullet.text });
  const mergeItems = (tailoredItems = [], beforeItems = [], afterItems = []) => {
    const beforeById = new Map(beforeItems.map((item) => [item.id, item]));
    const merged = tailoredItems.map((item) => {
      const updated = afterItems.find((candidate) => candidate.id === item.id);
      if (!updated) return item;
      const known = new Set((beforeById.get(item.id)?.bullets || []).map((bullet) => bullet.id));
      const added = updated.bullets.filter((bullet) => !known.has(bullet.id)).map(mark);
      return added.length ? { ...item, bullets: [...item.bullets, ...added] } : item;
    });
    const tailoredIds = new Set(tailoredItems.map((item) => item.id));
    const created = afterItems
      .filter((item) => !beforeById.has(item.id) && !tailoredIds.has(item.id))
      .map((item) => ({ ...item, bullets: item.bullets.map(mark) }));
    return [...merged, ...created];
  };

  const sections = after.customSections.map((section) => {
    const existing = tailored.customSections.find((candidate) => candidate.id === section.id);
    const previous = before.customSections.find((candidate) => candidate.id === section.id);
    return {
      ...(existing || section),
      items: mergeItems(existing?.items || [], previous?.items || [], section.items),
    };
  });

  return {
    ...tailored,
    sectionOrder: after.sectionOrder,
    experience: mergeItems(tailored.experience, before.experience, after.experience),
    projects: mergeItems(tailored.projects, before.projects, after.projects),
    customSections: sections,
  };
}

const sameText = (a, b) => cleanResumeText(String(a || "")).replace(/\s/g, "").toLowerCase() ===
  cleanResumeText(String(b || "")).replace(/\s/g, "").toLowerCase();
const blankOrSame = (a, b) => !String(a || "").trim() || !String(b || "").trim() || sameText(a, b);

function mergeInto(target, duplicate) {
  const bullets = [...target.bullets];
  for (const bullet of duplicate.bullets || []) {
    if (!bullets.some((existing) => sameText(existing.text, bullet.text))) bullets.push(bullet);
  }
  const filled = { ...target };
  for (const [key, value] of Object.entries(duplicate)) {
    if (key !== "bullets" && key !== "id" && !String(filled[key] || "").trim() && value) filled[key] = value;
  }
  return { ...filled, bullets };
}

function dedupe(items, isSame) {
  const result = [];
  for (const item of items || []) {
    const index = result.findIndex((existing) => isSame(existing, item));
    if (index === -1) result.push(item);
    else result[index] = mergeInto(result[index], item);
  }
  return result;
}

/**
 * 合并重复经历：同一家公司 + 同一职位（或一方没填）+ 同一时间（或一方没填）视为同一段经历，
 * 条目去重后合到前面那段里。项目按名称、其他经历按标题判断。
 */
export function mergeDuplicateEntries(profile) {
  const sameExperience = (a, b) =>
    String(a.company || "").trim() &&
    sameText(a.company, b.company) &&
    blankOrSame(a.role, b.role) &&
    blankOrSame(a.startDate, b.startDate) &&
    blankOrSame(a.endDate, b.endDate);
  const sameProject = (a, b) => String(a.name || "").trim() && sameText(a.name, b.name);
  const sameCustom = (a, b) =>
    String(a.title || "").trim() && sameText(a.title, b.title) && blankOrSame(a.subtitle, b.subtitle);
  return {
    ...profile,
    experience: dedupe(profile.experience, sameExperience),
    projects: dedupe(profile.projects, sameProject),
    customSections: (profile.customSections || []).map((section) => ({
      ...section,
      items: dedupe(section.items, sameCustom),
    })),
  };
}

export function addEvidenceToProfile(profile, draft) {
  return mergeDuplicateEntries(addEvidenceRaw(profile, draft));
}
