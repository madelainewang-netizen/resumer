export const jdAnalysisJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "position",
    "seniority",
    "hardSkills",
    "softSkills",
    "mustHave",
    "niceToHave",
    "coreRequirements",
    "talentProfile",
    "resumeTips",
  ],
  properties: {
    position: { type: "string" },
    seniority: { type: "string" },
    hardSkills: { type: "array", items: { type: "string" } },
    softSkills: { type: "array", items: { type: "string" } },
    mustHave: { type: "array", items: { type: "string" } },
    niceToHave: { type: "array", items: { type: "string" } },
    coreRequirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidenceHint"],
        properties: {
          requirement: { type: "string" },
          evidenceHint: { type: "string" },
        },
      },
    },
    talentProfile: { type: "string" },
    resumeTips: { type: "array", items: { type: "string" } },
  },
};

const bulletSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "text", "originalText", "verificationRequired"],
  properties: {
    id: { type: "string" },
    text: { type: "string" },
    originalText: { type: "string" },
    verificationRequired: { type: "boolean" },
  },
};

export const tailoredProfileJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "source",
    "sectionOrder",
    "basics",
    "education",
    "experience",
    "projects",
    "customSections",
    "skills",
  ],
  properties: {
    schemaVersion: { type: "number" },
    source: {
      type: "object",
      additionalProperties: false,
      required: ["mode", "fileName", "template"],
      properties: {
        mode: { type: "string", enum: ["manual", "upload"] },
        fileName: { type: "string" },
        template: { type: "string" },
      },
    },
    sectionOrder: { type: "array", items: { type: "string" } },
    basics: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "phone",
        "email",
        "location",
        "targetRole",
        "links",
        "extraContact",
        "photo",
        "summary",
      ],
      properties: Object.fromEntries(
        [
          "name",
          "phone",
          "email",
          "location",
          "targetRole",
          "links",
          "extraContact",
          "photo",
          "summary",
        ].map((key) => [key, { type: "string" }]),
      ),
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "school", "degree", "field", "startDate", "endDate", "details"],
        properties: Object.fromEntries(
          ["id", "school", "degree", "field", "startDate", "endDate", "details"].map((key) => [
            key,
            { type: "string" },
          ]),
        ),
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "company", "role", "startDate", "endDate", "location", "bullets"],
        properties: {
          ...Object.fromEntries(
            ["id", "company", "role", "startDate", "endDate", "location"].map((key) => [
              key,
              { type: "string" },
            ]),
          ),
          bullets: { type: "array", items: bulletSchema },
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "role", "stack", "startDate", "endDate", "bullets"],
        properties: {
          ...Object.fromEntries(
            ["id", "name", "role", "stack", "startDate", "endDate"].map((key) => [
              key,
              { type: "string" },
            ]),
          ),
          bullets: { type: "array", items: bulletSchema },
        },
      },
    },
    customSections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "items"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "title", "subtitle", "date", "location", "bullets"],
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                subtitle: { type: "string" },
                date: { type: "string" },
                location: { type: "string" },
                bullets: { type: "array", items: bulletSchema },
              },
            },
          },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
  },
};

export const importedProfileJSONSchema = tailoredProfileJSONSchema;

export const matchExplanationJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: ["strengths", "suggestions", "evidenceGaps"],
  properties: {
    strengths: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
    evidenceGaps: { type: "array", items: { type: "string" } },
  },
};

export const evidenceQuestionsJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "transferableExamples", "questions"],
  properties: {
    intro: { type: "string" },
    transferableExamples: { type: "array", items: { type: "string" } },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "question", "hint", "required"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          hint: { type: "string" },
          required: { type: "boolean" },
        },
      },
    },
  },
};

export const evidenceDraftJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "suggestedType",
    "title",
    "organization",
    "role",
    "startDate",
    "endDate",
    "location",
    "skills",
    "bullets",
    "verificationChecklist",
  ],
  properties: {
    suggestedType: {
      type: "string",
      enum: ["experience", "project", "custom"],
    },
    title: { type: "string" },
    organization: { type: "string" },
    role: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    location: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    bullets: { type: "array", items: { type: "string" } },
    verificationChecklist: { type: "array", items: { type: "string" } },
  },
};

export const condensePlanJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "recommendations"],
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "section",
          "itemId",
          "bulletId",
          "action",
          "reason",
          "suggestedText",
        ],
        properties: {
          section: {
            type: "string",
            enum: ["experience", "projects"],
          },
          itemId: { type: "string" },
          bulletId: { type: "string" },
          action: {
            type: "string",
            enum: ["keep", "condense", "remove"],
          },
          reason: { type: "string" },
          suggestedText: { type: "string" },
        },
      },
    },
  },
};
