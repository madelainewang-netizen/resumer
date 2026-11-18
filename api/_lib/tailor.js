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
  required: ["summary", "bullets"],
  properties: {
    summary: { type: "string" },
    bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "action", "text", "reason", "verificationRequired"],
        properties: {
          id: { type: "string" },
          action: { type: "string", enum: ["rewrite", "keep"] },
          text: { type: "string" },
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
      type: "工作/实习",
      heading: [item.company, item.role, [item.startDate, item.endDate].filter(Boolean).join("–")]
        .filter(Boolean)
        .join(" | "),
      bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: b.text })),
    });
  }
  for (const item of profile.projects || []) {
    groups.push({
      type: "项目",
      heading: [item.name, item.role, item.stack].filter(Boolean).join(" | "),
      bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: b.text })),
    });
  }
  for (const section of profile.customSections || []) {
    for (const item of section.items || []) {
      groups.push({
        type: section.title || "其他",
        heading: [item.title, item.subtitle].filter(Boolean).join(" | "),
        bullets: (item.bullets || []).filter((b) => b.text?.trim()).map((b) => ({ id: b.id, text: b.text })),
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
      const proposed = next ? next.text.trim() : bullet.text;
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

  return {
    ...profile,
    basics: {
      ...profile.basics,
      summary: String(rewrite?.summary || "").trim() || profile.basics?.summary || "",
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
