import { cleanResumeText } from "../../src/utils/cleanText.js";

/**
 * 简历改写只让模型返回「需要改的文字」，公司、日期、id 等事实字段永远不经过模型，
 * 由服务端合并回原档案。好处：
 * - 模型输出短很多，速度更快、更便宜、更少截断；
 * - 不可能把公司名、日期、条目数量"改错"；
 * - 模型可以把注意力集中在表达质量上。
 */

export const tailorRewriteJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: ["focus", "overall", "summary", "bullets", "gaps", "toConfirm", "entries"],
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["entryId", "decision", "reason"],
        properties: {
          entryId: { type: "string" },
          decision: { type: "string", enum: ["keep", "remove"] },
          reason: { type: "string" },
        },
      },
    },
    toConfirm: { type: "array", items: { type: "string" } },
    focus: { type: "array", items: { type: "string" } },
    overall: { type: "string" },
    summary: { type: "string" },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "reason", "evidenceHint"],
        properties: {
          requirement: { type: "string" },
          reason: { type: "string" },
          evidenceHint: { type: "string" },
        },
      },
    },
    bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "action", "title", "situation", "act", "result", "reason", "verificationRequired"],
        properties: {
          id: { type: "string" },
          action: { type: "string", enum: ["rewrite", "keep"] },
          title: { type: "string" },
          situation: { type: "string" },
          act: { type: "string" },
          result: { type: "string" },
          reason: { type: "string" },
          verificationRequired: { type: "boolean" },
        },
      },
    },
  },
};

/** 把档案压缩成模型需要看的最小上下文。 */
export function buildTailorInput(profile) {
  const groups = [];
  for (const item of profile.experience || []) {
    groups.push({
      entryId: item.id,
      type: "工作/实习",
      heading: [item.company, item.role, [item.startDate, item.endDate].filter(Boolean).join("–")]
        .filter(Boolean)
        .join(" | "),
      bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: cleanResumeText(b.text) })),
    });
  }
  for (const item of profile.projects || []) {
    groups.push({
      entryId: item.id,
      type: "项目",
      heading: [item.name, item.role, item.stack].filter(Boolean).join(" | "),
      bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: cleanResumeText(b.text) })),
    });
  }
  for (const section of profile.customSections || []) {
    for (const item of section.items || []) {
      groups.push({
        entryId: item.id,
        type: section.title || "其他",
        heading: [item.title, item.subtitle].filter(Boolean).join(" | "),
        bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: cleanResumeText(b.text) })),
      });
    }
  }
  return {
    targetRole: profile.basics?.targetRole || "",
    summary: profile.basics?.summary || "",
    education: (profile.education || []).map((e) =>
      [e.school, e.degree, e.field].filter(Boolean).join(" "),
    ),
    skills: profile.skills || [],
    experiences: groups.filter((group) => group.bullets.length),
  };
}

/** 去掉空格和标点后比较：只改了空格、标点的不算修改。 */
export function isSameWording(a, b) {
  const strip = (value) =>
    String(value || "").replace(/[\s，。、；：！？,.;:!?“”"'‘’（）()【】\[\]—–-]/g, "").toLowerCase();
  return strip(a) === strip(b);
}

/** 把模型返回的改写合并回完整档案，输出与旧接口相同的结构，并附上每条的修改理由。 */
export function mergeTailorRewrite(profile, rewrite) {
  const byId = new Map(
    (rewrite?.bullets || [])
      .filter((bullet) => bullet?.id && String(bullet.text || "").trim())
      .map((bullet) => [bullet.id, bullet]),
  );
  const mapBullets = (bullets = []) =>
    bullets.map((bullet) => {
      const next = byId.get(bullet.id);
      const proposed = next ? stripFirstPerson(cleanResumeText(next.text)) : bullet.text;
      // 模型说保留、或者只动了空格标点：一律视为未修改，原文原样保留
      const unchanged = !next || next.action === "keep" || isSameWording(bullet.text, proposed);
      const text = unchanged ? bullet.text : proposed;
      return {
        ...bullet,
        originalText: bullet.text,
        text,
        tailorReason: String(next?.reason || "").trim(),
        // 模型自己标记需要核实，或者改写里出现了原文没有的数字，都要求用户确认
        verificationRequired:
          !unchanged &&
          (Boolean(next?.verificationRequired) || findNewNumbers(bullet.text, text).length > 0),
      };
    });

  const gaps = (rewrite?.gaps || [])
    .filter((gap) => String(gap?.requirement || "").trim())
    .slice(0, 5)
    .map((gap) => ({
      requirement: gap.requirement.trim(),
      reason: String(gap.reason || "").trim(),
      evidenceHint: String(gap.evidenceHint || "").trim(),
    }));

  return {
    ...profile,
    tailorGaps: gaps,
    tailorFocus: (rewrite?.focus || []).map((item) => String(item).trim()).filter(Boolean).slice(0, 5),
    tailorOverall: cleanResumeText(String(rewrite?.overall || "")),
    tailorRemovals: (rewrite?.entries || [])
      .filter((entry) => entry?.decision === "remove" && String(entry.entryId || "").trim())
      .map((entry) => ({ entryId: entry.entryId, reason: cleanResumeText(String(entry.reason || "")) })),
    tailorToConfirm: (rewrite?.toConfirm || []).map((item) => cleanResumeText(String(item))).filter(Boolean).slice(0, 8),
    basics: {
      ...profile.basics,
      summary: cleanResumeText(String(rewrite?.summary || "")) || profile.basics?.summary || "",
    },
    experience: (profile.experience || []).map((item) => ({ ...item, bullets: mapBullets(item.bullets) })),
    projects: (profile.projects || []).map((item) => ({ ...item, bullets: mapBullets(item.bullets) })),
    customSections: (profile.customSections || []).map((section) => ({
      ...section,
      items: (section.items || []).map((item) => ({ ...item, bullets: mapBullets(item.bullets) })),
    })),
  };
}

/** 找出模型改写中新出现、原文里没有的数字——这是最常见的"编造"。 */
export function findNewNumbers(original, rewritten) {
  const numbers = (text) => new Set(String(text || "").match(/\d+(?:\.\d+)?/g) || []);
  const before = numbers(original);
  return [...numbers(rewritten)].filter((value) => !before.has(value));
}

/** 小标题之后的正文部分。 */
export function bulletBody(text) {
  const value = String(text || "");
  const match = value.match(/^[^：:]{2,18}[：:]\s*(.+)$/s);
  return match ? match[1] : value;
}

const COLLOQUIAL = /帮忙|搞定?|弄好?|一下|然后|挺|比较好/;

/** 标记为 rewrite、但正文和原文一样（只换了小标题）的条目。 */
export function findTitleOnlyRewrites(input, rewrite) {
  return findWeakRewrites(input, rewrite).filter((bullet) => bullet.issue === "titleOnly");
}

/**
 * 需要退回重写的改写：只换了小标题（titleOnly），或者写成了口语（colloquial）。
 * 原文本来就有的口语词不算新问题。
 */
export function findWeakRewrites(input, rewrite) {
  const originals = new Map(input.experiences.flatMap((group) => group.bullets.map((bullet) => [bullet.id, bullet.text])));
  return (rewrite?.bullets || []).flatMap((bullet) => {
    if (bullet.action !== "rewrite" || !originals.has(bullet.id)) return [];
    const original = originals.get(bullet.id);
    if (isSameWording(bulletBody(original), bulletBody(bullet.text))) return [{ ...bullet, issue: "titleOnly" }];
    if (COLLOQUIAL.test(bullet.text)) return [{ ...bullet, issue: "colloquial" }];
    return [];
  });
}

export const bodyRedoJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: ["bullets"],
  properties: { bullets: tailorRewriteJSONSchema.properties.bullets },
};

const TRAILING_PUNCT = /[，,；;。.、：:\s]+$/;
const LEADING_PUNCT = /^[，,；;。.、：:\s]+/;

/**
 * 去掉第一人称。简历书面体不写主语："由我人工复核" → "人工复核"，"我们团队" → "团队"。
 */
export function stripFirstPerson(text) {
  return String(text || "")
    .replace(/由我们?|由本人|由笔者/g, "")
    .replace(/本人(?=[\u4e00-\u9fff])/g, "")
    .replace(/我们的?团队/g, "团队")
    .replace(/我们/g, "团队")
    .replace(/(^|[，；。：、\s])我(?=[\u4e00-\u9fff])/g, "$1")
    .replace(/(?<![自])我(?=[\u4e00-\u9fff])/g, "")
    .replace(/，，|；；/g, (match) => match[0]);
}

const part = (value) => stripFirstPerson(cleanResumeText(String(value || ""))).replace(LEADING_PUNCT, "").replace(TRAILING_PUNCT, "");

/**
 * 把模型给出的 STAR 三段拼成一条简历 bullet，结构由程序保证：
 * 小标题：场景/问题，判断与关键动作；结果/产出
 */
export function composeBullet({ title, situation, act, result }) {
  const lead = part(title);
  const body = [part(situation), part(act)].filter(Boolean).join("，");
  const tail = part(result);
  const text = [body, tail].filter(Boolean).join("；");
  return lead ? `${lead}：${text}` : text;
}

/** 模型输出 → 带 text 的 bullet：keep 用原文，rewrite 按 STAR 拼装。 */
export function materializeBullets(bullets = [], originals = new Map()) {
  return bullets.map((bullet) => ({
    ...bullet,
    text:
      bullet.action === "keep" && originals.has(bullet.id)
        ? originals.get(bullet.id)
        : composeBullet(bullet),
  }));
}
