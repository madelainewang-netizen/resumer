import { splitBulletSummary } from "../utils/bulletSummary";
import { hasVisibleEntryContent } from "../utils/resumeVisibility";

/**
 * 把 profile 转成"渲染无关"的简历结构。
 * 网页预览（ResumePaper）和 PDF（ResumeDocument）都只消费这个结构，
 * 保证两边的内容、顺序、标题和字段拼接完全一致。
 */

const DEFAULT_ORDER = ["education", "experience", "projects", "customSections", "skills"];

const TITLES = {
  zh: {
    summary: "个人总结",
    education: "教育经历",
    experience: "工作经历",
    experienceFlowCV: "实习经历",
    projects: "项目经历",
    skills: "专业技能",
    skillsFlowCV: "其他",
  },
  en: {
    summary: "Summary",
    education: "Education",
    experience: "Experience",
    experienceFlowCV: "Experience",
    projects: "Projects",
    skills: "Skills",
    skillsFlowCV: "Additional",
  },
};

const CONTACT_LABELS = {
  zh: { phone: "电话", email: "邮箱", location: "现居", extra: "其他", github: "GitHub", linkedin: "LinkedIn", link: "主页" },
  en: { phone: "Phone", email: "Email", location: "Location", extra: "Other", github: "GitHub", linkedin: "LinkedIn", link: "Website" },
};

const CJK = /[㐀-鿿]/g;
const LATIN = /[A-Za-z]/g;

const clean = (value) => String(value ?? "").trim();
const joinParts = (parts, separator) => parts.map(clean).filter(Boolean).join(separator);

/** 根据正文里的中英文字符比例判断简历语言。 */
export function detectResumeLanguage(profile) {
  const sample = [
    profile?.basics?.name,
    profile?.basics?.summary,
    ...(profile?.experience || []).flatMap((item) => [
      item.company,
      item.role,
      ...(item.bullets || []).map((bullet) => bullet.text),
    ]),
    ...(profile?.projects || []).flatMap((item) => [
      item.name,
      ...(item.bullets || []).map((bullet) => bullet.text),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
  const cjk = (sample.match(CJK) || []).length;
  const latin = (sample.match(LATIN) || []).length;
  if (!cjk && !latin) return "zh";
  // 一个汉字的信息量约等于 2–3 个英文字母
  return cjk * 2.5 >= latin ? "zh" : "en";
}

function toBullets(bullets = []) {
  return bullets
    .filter((bullet) => clean(bullet?.text))
    .map((bullet) => {
      const { summary, body } = splitBulletSummary(bullet.text);
      return { id: bullet.id, lead: summary, text: summary ? body : clean(bullet.text) };
    });
}

function dateRange(start, end, dash) {
  return joinParts([start, end], dash);
}

const URLISH = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

function toHref(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return URLISH.test(value) ? `https://${value}` : "";
}

function buildContacts(basics, labels) {
  const items = [];
  if (clean(basics.phone)) items.push({ label: labels.phone, value: clean(basics.phone) });
  if (clean(basics.email)) {
    items.push({ label: labels.email, value: clean(basics.email), href: `mailto:${clean(basics.email)}` });
  }
  for (const link of String(basics.links || "").split(/[\s,，;；|｜]+/).map(clean).filter(Boolean)) {
    const label = /github\.com/i.test(link)
      ? labels.github
      : /linkedin\.com/i.test(link)
        ? labels.linkedin
        : labels.link;
    items.push({ label, value: link.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: toHref(link) });
  }
  if (clean(basics.location)) items.push({ label: labels.location, value: clean(basics.location) });
  if (clean(basics.extraContact)) items.push({ label: labels.extra, value: clean(basics.extraContact) });
  return items;
}

export function buildResumeModel(profile, { dash = " – ", metaSeparator = " | " } = {}) {
  const language = detectResumeLanguage(profile);
  const titles = TITLES[language];
  const flowCV = profile?.source?.template === "flowcv";
  const basics = profile?.basics || {};

  const header = {
    name: clean(basics.name) || (language === "zh" ? "你的姓名" : "Your Name"),
    role: clean(basics.targetRole),
    contacts: buildContacts(basics, CONTACT_LABELS[language]),
    photo: basics.photo || "",
  };
  const footer = clean(basics.email);

  const sections = [];
  if (clean(basics.summary)) {
    sections.push({
      key: "summary",
      title: titles.summary,
      kind: "paragraph",
      text: clean(basics.summary),
    });
  }

  const order = profile?.sectionOrder?.length ? profile.sectionOrder : DEFAULT_ORDER;
  const seen = new Set();

  const pushEntries = (key, title, entries) => {
    const visible = entries.filter((entry) =>
      hasVisibleEntryContent({
        title: entry.title,
        organization: entry.subtitle,
        meta: entry.meta,
        secondary: entry.secondary,
        bullets: entry.bullets.map((bullet) => ({ text: bullet.text || bullet.lead })),
      }),
    );
    if (visible.length) sections.push({ key, title, kind: "entries", entries: visible });
  };

  const pushCustom = (section) => {
    if (seen.has(section.id)) return;
    seen.add(section.id);
    pushEntries(
      section.id,
      clean(section.title),
      (section.items || []).map((item) => ({
        id: item.id,
        title: clean(item.title),
        subtitle: clean(item.subtitle),
        separator: " | ",
        meta: joinParts([item.location, item.date], metaSeparator),
        secondary: "",
        bullets: toBullets(item.bullets),
      })),
    );
  };

  for (const key of order) {
    if (seen.has(key)) continue;
    if (key === "education") {
      seen.add(key);
      pushEntries(
        key,
        titles.education,
        (profile.education || []).map((item) => ({
          id: item.id,
          // 学历在前、学校在后：「硕士 公共管理，香港城市大学」
          title: joinParts([item.degree, item.field], " "),
          subtitle: clean(item.school),
          separator: language === "zh" ? "，" : ", ",
          meta: dateRange(item.startDate, item.endDate, dash),
          secondary: clean(item.details),
          bullets: [],
        })),
      );
    } else if (key === "experience") {
      seen.add(key);
      pushEntries(
        key,
        flowCV ? titles.experienceFlowCV : titles.experience,
        (profile.experience || []).map((item) => ({
          id: item.id,
          title: clean(item.company),
          subtitle: clean(item.role),
          separator: " | ",
          meta: joinParts([item.location, dateRange(item.startDate, item.endDate, dash)], metaSeparator),
          secondary: "",
          bullets: toBullets(item.bullets),
        })),
      );
    } else if (key === "projects") {
      seen.add(key);
      pushEntries(
        key,
        titles.projects,
        (profile.projects || []).map((item) => ({
          id: item.id,
          title: clean(item.name),
          subtitle: joinParts([item.role, item.stack], " | "),
          separator: " | ",
          meta: dateRange(item.startDate, item.endDate, dash),
          secondary: "",
          bullets: toBullets(item.bullets),
        })),
      );
    } else if (key === "skills") {
      seen.add(key);
      const skills = (profile.skills || []).map(clean).filter(Boolean);
      if (skills.length) {
        const title = flowCV ? titles.skillsFlowCV : titles.skills;
        // 「产品：需求分析、PRD 撰写…」这类分组写法按要点逐行展示；纯关键词用分隔符排成一段
        const grouped = skills.some((skill) => /^[^：:]{1,12}[：:]/.test(skill) || skill.length > 24);
        if (grouped) {
          sections.push({
            key,
            title,
            kind: "entries",
            entries: [
              {
                id: "skills",
                title: "",
                subtitle: "",
                meta: "",
                secondary: "",
                bullets: toBullets(skills.map((text, index) => ({ id: `skill_${index}`, text }))),
              },
            ],
          });
        } else {
          sections.push({ key, title, kind: "paragraph", text: skills.join(" · ") });
        }
      }
    } else if (key === "customSections") {
      seen.add(key);
      (profile.customSections || []).forEach(pushCustom);
    } else {
      const custom = (profile.customSections || []).find((section) => section.id === key);
      if (custom) pushCustom(custom);
    }
  }

  return { language, header, footer, sections };
}
