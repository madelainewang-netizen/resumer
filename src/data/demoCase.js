import { profileSignature } from "../utils/profileSignature";

export const demoProfile = {
  schemaVersion: 2,
  source: { mode: "manual", fileName: "", template: "resumer" },
  sectionOrder: ["education", "experience", "projects", "customSections", "skills"],
  basics: {
    name: "陈雨桐",
    phone: "+86 138 0000 0000",
    email: "yutong.demo@example.com",
    location: "上海",
    targetRole: "AI 产品助理",
    links: "portfolio.example.com/yutong",
    extraContact: "",
    photo: "",
    summary:
      "传播学应届生，关注生成式 AI 产品与用户体验，具备内容研究、用户访谈和项目协作经验。",
  },
  education: [
    {
      id: "demo_edu_1",
      school: "华东某大学",
      degree: "文学学士",
      field: "传播学",
      startDate: "2022.09",
      endDate: "2026.06",
      details: "相关课程：用户研究、数据新闻、数字媒体产品",
    },
  ],
  experience: [
    {
      id: "demo_exp_1",
      company: "某互联网内容平台",
      role: "产品运营实习生",
      startDate: "2025.03",
      endDate: "2025.08",
      location: "上海",
      bullets: [
        {
          id: "demo_exp_bullet_1",
          text: "协助整理用户反馈与内容数据，每周输出问题清单并同步产品团队。",
        },
        {
          id: "demo_exp_bullet_2",
          text: "参与 AI 写作功能的内测和案例收集，记录用户使用障碍。",
        },
      ],
    },
  ],
  projects: [
    {
      id: "demo_project_1",
      name: "校园 AI 学习助手调研",
      role: "项目负责人",
      stack: "访谈、问卷、Figma",
      startDate: "2025.09",
      endDate: "2025.12",
      bullets: [
        {
          id: "demo_project_bullet_1",
          text: "围绕大学生使用生成式 AI 的场景完成访谈，并制作产品概念原型。",
        },
      ],
    },
  ],
  customSections: [],
  skills: ["用户访谈", "Figma", "内容分析", "基础数据分析", "Prompt 设计"],
};

export const demoJD = `AI 产品助理（应届生）

岗位职责：
1. 协助完成生成式 AI 产品的用户研究、需求整理和原型设计；
2. 收集用户反馈和产品数据，协助产品经理推进迭代；
3. 与设计、研发和运营团队协作，跟进功能测试与上线；
4. 持续关注 AI 产品和大模型应用趋势。

任职要求：
1. 2026 届本科及以上学历，专业不限；
2. 具备用户研究、逻辑分析和跨团队沟通能力；
3. 熟悉 Figma，有 AI 产品、课程项目或实习经历优先；
4. 对生成式 AI 有持续兴趣，能够主动学习并验证想法。`;

export const demoAnalysis = {
  position: "AI 产品助理",
  seniority: "应届生",
  hardSkills: ["用户研究", "需求分析", "原型设计", "Figma", "产品测试"],
  softSkills: ["逻辑分析", "跨团队沟通", "主动学习", "用户同理心"],
  mustHave: [
    "能够整理用户反馈并形成产品问题",
    "具备基础原型设计和产品协作能力",
    "对生成式 AI 产品有持续实践",
  ],
  niceToHave: ["AI 产品项目经历", "基础数据分析能力"],
  coreRequirements: [
    {
      requirement: "用户研究与需求整理",
      evidenceHint: "说明访谈对象、信息整理方法以及形成的产品判断。",
    },
    {
      requirement: "AI 产品实践",
      evidenceHint: "展示真实使用、测试或设计生成式 AI 产品的经历。",
    },
    {
      requirement: "跨团队协作与推进",
      evidenceHint: "说明协作对象、你的具体动作和交付物。",
    },
  ],
  talentProfile:
    "具备用户视角和结构化表达能力，能够把零散反馈整理为产品问题，并通过原型或测试推动想法落地的初级 AI 产品候选人。",
  resumeTips: [
    "优先展示 AI 功能内测和校园 AI 项目。",
    "补充用户访谈的对象、方法和交付物。",
    "将内容运营经历转译为反馈归纳和跨团队协作证据。",
  ],
};

export const demoTailoredProfile = {
  ...structuredClone(demoProfile),
  basics: {
    ...demoProfile.basics,
    summary:
      "传播学应届生，具备生成式 AI 功能测试、用户反馈归纳和产品概念验证经验，能够使用访谈与原型方法整理需求并推动协作。",
  },
  experience: [
    {
      ...demoProfile.experience[0],
      bullets: [
        {
          id: "demo_exp_bullet_1",
          originalText: demoProfile.experience[0].bullets[0].text,
          text: "用户反馈归纳：整理用户反馈与内容数据，按周输出问题清单并同步产品团队，支持需求讨论。",
          verificationRequired: false,
        },
        {
          id: "demo_exp_bullet_2",
          originalText: demoProfile.experience[0].bullets[1].text,
          text: "AI 功能测试：参与 AI 写作功能内测，记录典型使用场景与操作障碍，沉淀案例供产品团队复盘。",
          verificationRequired: false,
        },
      ],
    },
  ],
  projects: [
    {
      ...demoProfile.projects[0],
      bullets: [
        {
          id: "demo_project_bullet_1",
          originalText: demoProfile.projects[0].bullets[0].text,
          text: "产品概念验证：围绕大学生使用生成式 AI 的场景开展访谈，归纳核心任务并用 Figma 制作产品概念原型。",
          verificationRequired: false,
        },
      ],
    },
  ],
};

export const demoCondensePlan = {
  summary: "保留与 AI 产品、用户研究和协作直接相关的内容，压缩重复背景说明。",
  recommendations: [
    {
      section: "experience",
      itemId: "demo_exp_1",
      bulletId: "demo_exp_bullet_1",
      action: "condense",
      reason: "保留反馈归纳和产品协作证据，减少重复背景。",
      suggestedText:
        "用户反馈归纳：整理用户反馈与内容数据，按周输出问题清单并支持需求讨论。",
    },
  ],
};

export const demoEvidenceQuestions = {
  intro: "这项能力不一定来自正式产品岗位，也可以来自课程、社团或实习协作。",
  transferableExamples: ["课程调研", "社团项目", "功能内测", "内容复盘"],
  questions: [
    {
      id: "demo_question_1",
      question: "你曾经为谁收集反馈或做过访谈？",
      hint: "写明对象和大致场景，不需要编造数量。",
      required: true,
    },
    {
      id: "demo_question_2",
      question: "你如何整理信息，并形成了什么交付物？",
      hint: "例如问题清单、研究结论、原型或复盘文档。",
      required: true,
    },
  ],
};

export const demoEvidenceDraft = {
  suggestedType: "project",
  title: "校园 AI 学习助手调研",
  organization: "课程项目",
  role: "项目负责人",
  startDate: "2025.09",
  endDate: "2025.12",
  location: "上海",
  skills: ["用户访谈", "需求分析", "Figma"],
  bullets: [
    "围绕大学生使用生成式 AI 的学习场景开展访谈，整理核心任务、使用障碍和产品机会。",
    "基于访谈结论制作产品概念原型，并记录仍需验证的关键假设。",
  ],
  verificationChecklist: ["确认访谈对象和交付物均来自真实项目"],
};

export const demoMatchExplanation = {
  strengths: [
    "已有 AI 功能测试和生成式 AI 项目经历。",
    "传播学训练能够支持用户研究与信息归纳。",
    "简历中包含与产品团队协作的真实场景。",
  ],
  suggestions: [
    "继续补充原型如何被评审或验证。",
    "将基础数据分析能力落实到具体工具或课程项目。",
    "明确跨团队协作中自己负责的交付物。",
  ],
  evidenceGaps: ["尚缺少产品上线后的数据验证经历。"],
};

export const demoSession = {
  jdText: demoJD,
  analysis: demoAnalysis,
  tailoredProfile: demoTailoredProfile,
  tailoredSourceSignature: profileSignature(demoProfile),
  tailorWorkspaceState: {
    accepted: {},
    condensePlan: demoCondensePlan,
    condenseApplied: {},
    compactLevel: 1,
  },
  matchExplanation: demoMatchExplanation,
  activeStep: "tailor",
};
