export function updateTailoredBullet(
  profile,
  { section, sectionId, itemId, bulletId, patch },
) {
  if (section === "customSections") {
    return {
      ...profile,
      customSections: profile.customSections.map((customSection) =>
        customSection.id === sectionId
          ? {
              ...customSection,
              items: customSection.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      bullets: item.bullets.map((bullet) =>
                        bullet.id === bulletId ? { ...bullet, ...patch } : bullet,
                      ),
                    }
                  : item,
              ),
            }
          : customSection,
      ),
    };
  }

  return {
    ...profile,
    [section]: profile[section].map((item) =>
      item.id === itemId
        ? {
            ...item,
            bullets: item.bullets.map((bullet) =>
              bullet.id === bulletId ? { ...bullet, ...patch } : bullet,
            ),
          }
        : item,
    ),
  };
}
