/**
 * 在某一版定制简历里移除 / 恢复整段经历。只影响这一版，不改动基础资料。
 */

export function entryLabel(item) {
  return (
    [item.company || item.name || item.title, item.role || item.subtitle].filter(Boolean).join(" · ") ||
    "未命名经历"
  );
}

export function findEntry(profile, entryId) {
  for (const section of ["experience", "projects"]) {
    const index = (profile[section] || []).findIndex((item) => item.id === entryId);
    if (index !== -1) return { section, index, item: profile[section][index] };
  }
  for (const custom of profile.customSections || []) {
    const index = (custom.items || []).findIndex((item) => item.id === entryId);
    if (index !== -1) return { section: "customSections", sectionId: custom.id, index, item: custom.items[index] };
  }
  return null;
}

export function removeEntry(profile, entryId) {
  const found = findEntry(profile, entryId);
  if (!found) return profile;
  const removed = [...(profile.tailorRemoved || []), found];
  if (found.section === "customSections") {
    return {
      ...profile,
      tailorRemoved: removed,
      customSections: profile.customSections.map((custom) =>
        custom.id === found.sectionId
          ? { ...custom, items: custom.items.filter((item) => item.id !== entryId) }
          : custom,
      ),
    };
  }
  return {
    ...profile,
    tailorRemoved: removed,
    [found.section]: profile[found.section].filter((item) => item.id !== entryId),
  };
}

export function restoreEntry(profile, entryId) {
  const record = (profile.tailorRemoved || []).find((entry) => entry.item.id === entryId);
  if (!record) return profile;
  const insert = (items) => {
    const next = [...items];
    next.splice(Math.min(record.index, next.length), 0, record.item);
    return next;
  };
  const rest = (profile.tailorRemoved || []).filter((entry) => entry.item.id !== entryId);
  if (record.section === "customSections") {
    return {
      ...profile,
      tailorRemoved: rest,
      customSections: profile.customSections.map((custom) =>
        custom.id === record.sectionId ? { ...custom, items: insert(custom.items) } : custom,
      ),
    };
  }
  return { ...profile, tailorRemoved: rest, [record.section]: insert(profile[record.section]) };
}
