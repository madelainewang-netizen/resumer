export const createId = (prefix = "item") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const emptyProfile = {
  schemaVersion: 2,
  source: {
    mode: "manual",
    fileName: "",
    template: "resumer",
  },
  sectionOrder: ["education", "experience", "projects", "customSections", "skills"],
  basics: {
    name: "",
    phone: "",
    email: "",
    location: "",
    targetRole: "",
    links: "",
    extraContact: "",
    photo: "",
    summary: "",
  },
  education: [],
  experience: [],
  projects: [],
  customSections: [],
  skills: [],
};

export const sampleProfile = {
  schemaVersion: 2,
  source: {
    mode: "manual",
    fileName: "",
    template: "resumer",
  },
  sectionOrder: ["education", "experience", "projects", "customSections", "skills"],
  basics: {
    name: "林晓",
    phone: "+86 138 0000 0000",
    email: "xiaolin@example.com",
    location: "上海",
    targetRole: "产品经理",
    links: "linkedin.com/in/xiaolin",
    extraContact: "",
    photo: "",
    summary:
      "3 年互联网产品经验，专注 B2B SaaS 与增长产品，擅长从用户研究到跨团队落地的完整产品流程。",
  },
  education: [
    {
      id: "edu_sample",
      school: "浙江大学",
      degree: "管理学学士",
      field: "信息管理与信息系统",
      startDate: "2017.09",
      endDate: "2021.06",
      details: "GPA 3.7/4.0",
    },
  ],
  experience: [
    {
      id: "exp_sample_1",
      company: "云帆科技",
      role: "产品经理",
      startDate: "2022.07",
      endDate: "至今",
      location: "上海",
      bullets: [
        {
          id: "bullet_sample_1",
          text: "负责企业协作产品的需求规划，与研发和设计团队推进版本交付。",
        },
        {
          id: "bullet_sample_2",
          text: "通过用户访谈与行为数据分析优化核心流程，用户提供的数据显示任务完成率提升 18%。",
        },
      ],
    },
    {
      id: "exp_sample_2",
      company: "知行网络",
      role: "产品运营",
      startDate: "2021.07",
      endDate: "2022.06",
      location: "杭州",
      bullets: [
        {
          id: "bullet_sample_3",
          text: "参与增长活动策划与复盘，协调内容、设计和渠道团队完成上线。",
        },
      ],
    },
  ],
  projects: [
    {
      id: "project_sample",
      name: "客户洞察看板",
      role: "项目负责人",
      stack: "Figma、SQL、Tableau",
      startDate: "2023.03",
      endDate: "2023.08",
      bullets: [
        {
          id: "project_bullet_sample",
          text: "梳理销售和客户成功团队的数据需求，设计客户健康度指标体系与可视化看板。",
        },
      ],
    },
  ],
  customSections: [],
  skills: ["用户研究", "需求分析", "数据分析", "SQL", "Figma", "敏捷开发"],
};

export const sampleJD = `产品经理（B2B SaaS）

岗位职责：
1. 负责企业级产品的需求分析、产品规划和全生命周期管理；
2. 深入理解客户业务场景，通过用户访谈和数据分析识别关键问题；
3. 与设计、研发、销售及客户成功团队协作，推动产品高质量交付；
4. 建立产品指标体系，持续跟踪用户行为并推动产品迭代。

任职要求：
1. 3 年以上互联网产品经验，有 B2B SaaS 产品经验优先；
2. 具备优秀的用户研究、需求分析和项目管理能力；
3. 熟悉 SQL 或数据分析工具，能够独立完成基础数据分析；
4. 逻辑清晰，具备良好的跨团队沟通和推动能力。`;

export const sampleAnalysis = {
  position: "B2B SaaS 产品经理",
  seniority: "中级",
  hardSkills: ["需求分析", "产品规划", "用户研究", "数据分析", "SQL", "项目管理"],
  softSkills: ["跨团队协作", "逻辑思维", "沟通推动", "客户洞察"],
  mustHave: [
    "具备完整的企业级产品规划与交付经验",
    "能够通过用户研究和数据分析识别业务问题",
    "具备跨设计、研发和业务团队的项目推动能力",
  ],
  niceToHave: ["B2B SaaS 行业经验", "熟悉 SQL 或数据分析工具"],
  coreRequirements: [
    {
      requirement: "企业级产品全生命周期管理",
      evidenceHint: "用具体产品、负责范围和上线结果证明端到端能力",
    },
    {
      requirement: "数据驱动的产品迭代",
      evidenceHint: "说明使用的指标、分析方法以及改进结果",
    },
    {
      requirement: "复杂跨团队协作",
      evidenceHint: "写清参与团队、你的推动动作和最终交付",
    },
  ],
  talentProfile:
    "能够深入客户业务场景、兼顾产品判断与落地推进的中级产品经理。既有结构化分析能力，也能用数据和协作推动产品持续迭代。",
  resumeTips: [
    "优先展示企业产品和 B2B SaaS 相关经历",
    "为用户研究和数据分析补充具体方法与结果",
    "明确跨团队项目中个人负责的决策和推动动作",
  ],
};

export const steps = [
  { id: "profile", label: "基础资料", short: "资料" },
  { id: "jd", label: "JD 分析", short: "分析" },
  { id: "tailor", label: "简历优化", short: "优化" },
  { id: "review", label: "检查与导出", short: "导出" },
];
