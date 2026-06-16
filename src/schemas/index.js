import { z } from "zod";

const bulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  originalText: z.string().optional(),
  verificationRequired: z.boolean().optional(),
});

export const profileSchema = z.object({
  schemaVersion: z.number().default(2),
  source: z
    .object({
      mode: z.enum(["manual", "upload"]),
      fileName: z.string(),
      template: z.string(),
    })
    .default({ mode: "manual", fileName: "", template: "resumer" }),
  sectionOrder: z
    .array(z.string())
    .default(["education", "experience", "projects", "customSections", "skills"]),
  basics: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    location: z.string(),
    targetRole: z.string(),
    links: z.string(),
    extraContact: z.string().default(""),
    photo: z.string().default(""),
    summary: z.string(),
  }),
  education: z.array(
    z.object({
      id: z.string(),
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      details: z.string(),
    }),
  ),
  experience: z.array(
    z.object({
      id: z.string(),
      company: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      location: z.string(),
      bullets: z.array(bulletSchema),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      stack: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      bullets: z.array(bulletSchema),
    }),
  ),
  customSections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            subtitle: z.string(),
            date: z.string(),
            location: z.string(),
            bullets: z.array(bulletSchema),
          }),
        ),
      }),
    )
    .default([]),
  skills: z.array(z.string()),
});

export const jdAnalysisSchema = z.object({
  position: z.string(),
  seniority: z.string(),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  coreRequirements: z.array(
    z.object({
      requirement: z.string(),
      evidenceHint: z.string(),
    }),
  ),
  talentProfile: z.string(),
  resumeTips: z.array(z.string()),
});

export const aiMatchExplanationSchema = z.object({
  strengths: z.array(z.string()),
  suggestions: z.array(z.string()),
  evidenceGaps: z.array(z.string()),
});
