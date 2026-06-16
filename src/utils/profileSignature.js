export function profileSignature(profile) {
  return JSON.stringify({
    basics: profile.basics,
    education: profile.education,
    experience: profile.experience,
    projects: profile.projects,
    customSections: profile.customSections,
    skills: profile.skills,
    sectionOrder: profile.sectionOrder,
  });
}
