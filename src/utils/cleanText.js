/**
 * 清理简历文字里多余的空格。
 *
 * 来源主要有两个：PDF 导入时把相邻的文字块当成了两个词；大模型有时会在中文之间插空格。
 * 规则：
 * - 中文与中文之间、中文与中文标点之间的空格全部去掉（"用 户 研 究" → "用户研究"）；
 * - 连续多个空格合并成一个；
 * - 英文单词之间、中英文之间的单个空格保留（作者本人的简历就有"AI 产品"这种写法）。
 */
const CJK = "\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff";
const CJK_PUNCT = "\\u3000-\\u303f\\uff01-\\uff0f\\uff1a-\\uff20\\uff3b-\\uff40\\uff5b-\\uff65\\u2014\\u2018\\u2019\\u201c\\u201d\\u2026\\u00b7";
const CJK_LIKE = `[${CJK}${CJK_PUNCT}]`;

const BETWEEN_CJK = new RegExp(`(${CJK_LIKE})[ \\t\\u00a0\\u3000]+(?=${CJK_LIKE})`, "g");
const BEFORE_PUNCT = new RegExp(`[ \\t\\u00a0]+(?=[${CJK_PUNCT}])`, "g");
const AFTER_PUNCT = new RegExp(`([${CJK_PUNCT}])[ \\t\\u00a0]+`, "g");

export function cleanResumeText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/[ \t ]{2,}/g, " ")
    .replace(BETWEEN_CJK, "$1")
    .replace(BEFORE_PUNCT, "")
    .replace(AFTER_PUNCT, "$1")
    .replace(/[ \t ]+\n/g, "\n")
    .trim();
}

/** 递归清理对象里所有字符串（跳过照片和 id 这类字段）。 */
export function cleanResumeStrings(value, key = "") {
  if (typeof value === "string") {
    return key === "photo" || key === "id" || /Id$/.test(key) ? value : cleanResumeText(value);
  }
  if (Array.isArray(value)) return value.map((item) => cleanResumeStrings(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, cleanResumeStrings(child, childKey)]),
    );
  }
  return value;
}
