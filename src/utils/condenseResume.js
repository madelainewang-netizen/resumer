const BULLET_SECTIONS = new Set(["experience", "projects"]);
const ITEM_SECTIONS = new Set(["education", "experience", "projects"]);

export function recommendationKey({ section, itemId, bulletId }) {
  return `${section}:${itemId}:${bulletId}`;
}

export function indexCondenseRecommendations(recommendations = []) {
  return Object.fromEntries(
    recommendations.map((item) => [recommendationKey(item), item]),
  );
}

export function applyCondenseRecommendation(profile, recommendation) {
  const { section, itemId, bulletId, action, suggestedText } = recommendation;
  if (!BULLET_SECTIONS.has(section) || !profile[section]) return profile;

  let found = false;
  const items = profile[section].map((item) => {
    if (item.id !== itemId || !item.bullets.some((bullet) => bullet.id === bulletId)) {
      return item;
    }
    found = true;
    const bullets =
      action === "remove"
        ? item.bullets.filter((bullet) => bullet.id !== bulletId)
        : item.bullets.map((bullet) =>
            bullet.id === bulletId && action === "condense"
              ? { ...bullet, text: suggestedText.trim() || bullet.text }
              : bullet,
          );
    return { ...item, bullets };
  });

  return found ? { ...profile, [section]: items } : profile;
}

export function restoreRemovedBullet(profile, removed) {
  const { section, itemId, bullet, index } = removed;
  if (!BULLET_SECTIONS.has(section) || !profile[section]) return profile;

  let found = false;
  const items = profile[section].map((item) => {
    if (item.id !== itemId || item.bullets.some((entry) => entry.id === bullet.id)) {
      return item;
    }
    found = true;
    const bullets = [...item.bullets];
    bullets.splice(Math.min(index, bullets.length), 0, bullet);
    return { ...item, bullets };
  });

  return found ? { ...profile, [section]: items } : profile;
}

export function removeResumeItem(profile, section, itemId) {
  if (!ITEM_SECTIONS.has(section) || !profile[section]) {
    return { profile, removed: null };
  }
  const index = profile[section].findIndex((item) => item.id === itemId);
  if (index < 0) return { profile, removed: null };

  const item = profile[section][index];
  return {
    profile: {
      ...profile,
      [section]: profile[section].filter((entry) => entry.id !== itemId),
    },
    removed: { section, item, index },
  };
}

export function restoreResumeItem(profile, removed) {
  const { section, item, index } = removed;
  if (
    !ITEM_SECTIONS.has(section) ||
    !profile[section] ||
    profile[section].some((entry) => entry.id === item.id)
  ) {
    return profile;
  }
  const items = [...profile[section]];
  items.splice(Math.min(index, items.length), 0, item);
  return { ...profile, [section]: items };
}

export function removeSummary(profile) {
  const summary = profile.basics.summary;
  if (!summary) return { profile, summary: "" };
  return {
    profile: {
      ...profile,
      basics: { ...profile.basics, summary: "" },
    },
    summary,
  };
}

export function restoreSummary(profile, summary) {
  if (!summary) return profile;
  return {
    ...profile,
    basics: { ...profile.basics, summary },
  };
}

export function removeSkill(profile, index) {
  if (index < 0 || index >= profile.skills.length) {
    return { profile, removed: null };
  }
  const value = profile.skills[index];
  return {
    profile: {
      ...profile,
      skills: profile.skills.filter((_, itemIndex) => itemIndex !== index),
    },
    removed: { value, index },
  };
}

export function restoreSkill(profile, removed) {
  if (!removed || profile.skills.includes(removed.value)) return profile;
  const skills = [...profile.skills];
  skills.splice(Math.min(removed.index, skills.length), 0, removed.value);
  return { ...profile, skills };
}

export function removeCustomItem(profile, sectionId, itemId) {
  const section = profile.customSections.find((entry) => entry.id === sectionId);
  const index = section?.items.findIndex((item) => item.id === itemId) ?? -1;
  if (!section || index < 0) return { profile, removed: null };
  const item = section.items[index];
  return {
    profile: {
      ...profile,
      customSections: profile.customSections.map((entry) =>
        entry.id === sectionId
          ? {
              ...entry,
              items: entry.items.filter((candidate) => candidate.id !== itemId),
            }
          : entry,
      ),
    },
    removed: { sectionId, item, index },
  };
}

export function restoreCustomItem(profile, removed) {
  if (!removed) return profile;
  let restored = false;
  const customSections = profile.customSections.map((section) => {
    if (
      section.id !== removed.sectionId ||
      section.items.some((item) => item.id === removed.item.id)
    ) {
      return section;
    }
    restored = true;
    const items = [...section.items];
    items.splice(Math.min(removed.index, items.length), 0, removed.item);
    return { ...section, items };
  });
  return restored ? { ...profile, customSections } : profile;
}

export function removeCustomSection(profile, sectionId) {
  const index = profile.customSections.findIndex(
    (section) => section.id === sectionId,
  );
  if (index < 0) return { profile, removed: null };
  return {
    profile: {
      ...profile,
      customSections: profile.customSections.filter(
        (section) => section.id !== sectionId,
      ),
    },
    removed: { section: profile.customSections[index], index },
  };
}

export function restoreCustomSection(profile, removed) {
  if (
    !removed ||
    profile.customSections.some((section) => section.id === removed.section.id)
  ) {
    return profile;
  }
  const customSections = [...profile.customSections];
  customSections.splice(
    Math.min(removed.index, customSections.length),
    0,
    removed.section,
  );
  return { ...profile, customSections };
}
