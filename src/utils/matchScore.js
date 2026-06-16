const aliases = {
  "react.js": "react",
  reactjs: "react",
  "用户增长": "增长",
  growth: "增长",
  "项目推进": "项目管理",
  "跨部门协作": "跨团队协作",
  saas: "b2b saas",
};

export function normalizeKeyword(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[，、/]/g, " ")
    .replace(/\s+/g, " ");
  return aliases[normalized] || normalized;
}

export function profileToText(profile) {
  const chunks = [
    ...Object.values(profile.basics || {}),
    ...(profile.skills || []),
  ];

  for (const item of [...(profile.experience || []), ...(profile.projects || [])]) {
    chunks.push(
      ...Object.values(item).filter((value) => typeof value === "string"),
      ...(item.bullets || []).map((bullet) => bullet.text),
    );
  }

  for (const item of profile.education || []) {
    chunks.push(...Object.values(item).filter((value) => typeof value === "string"));
  }
  for (const section of profile.customSections || []) {
    chunks.push(section.title);
    for (const item of section.items) {
      chunks.push(
        item.title,
        item.subtitle,
        item.date,
        item.location,
        ...item.bullets.map((bullet) => bullet.text),
      );
    }
  }

  return chunks.join(" ").toLowerCase();
}

function containsEvidence(text, keyword) {
  const normalized = normalizeKeyword(keyword);
  return (
    text.includes(normalized) ||
    normalized
      .split(" ")
      .filter((part) => part.length > 1)
      .every((part) => text.includes(part))
  );
}

const evidenceConcepts = [
  "企业",
  "产品",
  "需求",
  "数据",
  "用户",
  "研究",
  "分析",
  "项目",
  "管理",
  "跨团队",
  "协作",
  "沟通",
  "推动",
  "交付",
  "客户",
  "业务",
  "增长",
  "运营",
  "技术",
  "规划",
];

export function evaluateRequirementEvidence(profile, requirement, analysis = null) {
  const text = profileToText(profile);
  const requirementText = normalizeKeyword(requirement);
  const skills = [...(analysis?.hardSkills || []), ...(analysis?.softSkills || [])];
  const relatedSkills = skills.filter((skill) => {
    const normalized = normalizeKeyword(skill);
    return (
      requirementText.includes(normalized) ||
      (normalized.length >= 2 && requirementText.includes(normalized.slice(0, 2)))
    );
  });
  const skillHits = relatedSkills.filter((skill) => containsEvidence(text, skill)).length;
  const concepts = evidenceConcepts.filter((concept) => requirementText.includes(concept));
  const conceptHits = concepts.filter((concept) => text.includes(concept)).length;

  if (skillHits >= 1 || conceptHits >= 2) return "strong";
  if (conceptHits === 1) return "partial";
  return "missing";
}

export function calculateMatchScore(profile, analysis) {
  if (!analysis) {
    return {
      overallScore: 0,
      hardSkillScore: 0,
      requirementScore: 0,
      relevanceScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
    };
  }

  const text = profileToText(profile);
  const keywords = [...new Set(analysis.hardSkills.map(normalizeKeyword))];
  const matchedKeywords = keywords.filter((keyword) => containsEvidence(text, keyword));
  const missingKeywords = keywords.filter((keyword) => !containsEvidence(text, keyword));
  const hardSkillScore = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 0;

  const requirements = analysis.coreRequirements || [];
  const requirementEvidence = requirements.map((item) =>
    evaluateRequirementEvidence(profile, item.requirement, analysis),
  );
  const requirementPoints = requirementEvidence.reduce(
    (total, status) => total + (status === "strong" ? 1 : status === "partial" ? 0.5 : 0),
    0,
  );
  const requirementScore = requirements.length
    ? Math.round((requirementPoints / requirements.length) * 100)
    : hardSkillScore;

  const targetTerms = normalizeKeyword(analysis.position)
    .split(" ")
    .filter((term) => term.length > 1);
  const relevanceScore = targetTerms.some((term) => text.includes(term))
    ? Math.max(70, hardSkillScore)
    : Math.round(hardSkillScore * 0.75);

  return {
    overallScore: Math.round(
      hardSkillScore * 0.45 + requirementScore * 0.35 + relevanceScore * 0.2,
    ),
    hardSkillScore,
    requirementScore,
    relevanceScore,
    matchedKeywords,
    missingKeywords,
  };
}
