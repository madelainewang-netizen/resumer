import {
  demoAnalysis,
  demoCondensePlan,
  demoEvidenceDraft,
  demoEvidenceQuestions,
  demoMatchExplanation,
  demoProfile,
  demoTailoredProfile,
} from "../data/demoCase";

const resolveFixture = async (fixture, progress, message) => {
  progress?.(message);
  return structuredClone(fixture);
};

export function createDemoServices() {
  return {
    analyzeJD: (_, progress) =>
      resolveFixture(demoAnalysis, progress, "载入演示岗位分析"),
    tailorResume: (_, __, progress) =>
      resolveFixture(demoTailoredProfile, progress, "载入演示定制建议"),
    condenseResume: (_, __, progress) =>
      resolveFixture(demoCondensePlan, progress, "载入演示精简建议"),
    explainMatch: (_, __, ___, progress) =>
      resolveFixture(demoMatchExplanation, progress, "载入演示招聘视角"),
    getEvidenceQuestions: (_, progress) =>
      resolveFixture(demoEvidenceQuestions, progress, "载入演示引导问题"),
    createEvidenceDraft: (_, progress) =>
      resolveFixture(demoEvidenceDraft, progress, "载入演示经历草稿"),
    importResumePDF: (_, progress) =>
      resolveFixture(demoProfile, progress, "演示模式使用脱敏示例简历"),
  };
}
