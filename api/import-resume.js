import { apiError, requirePost, sendEvent, startSSE } from "./_lib/http.js";
import { streamStructuredResponse } from "./_lib/ai.js";
import { extractPDFLayout } from "./_lib/pdf.js";
import { importedProfileJSONSchema } from "./_lib/schemas.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const { fileName, fileData } = req.body || {};
  if (!fileName || !String(fileData).startsWith("data:application/pdf;base64,")) {
    return res.status(400).json({ error: "请上传有效的 PDF 文件" });
  }
  if (String(fileData).length > 4.2 * 1024 * 1024) {
    return res.status(413).json({ error: "PDF 文件过大，请压缩到 3MB 以内" });
  }

  startSSE(res);
  sendEvent(res, { type: "progress", message: "正在识别文字、区块与原始顺序" });
  try {
    const pages = await extractPDFLayout(fileData);
    const extractedLength = pages.reduce(
      (total, page) => total + page.lines.reduce((sum, line) => sum + line.text.length, 0),
      0,
    );
    if (extractedLength < 50) {
      const error = new Error("PDF 没有可提取的文字。当前版本暂不支持纯扫描图片简历");
      error.status = 400;
      throw error;
    }
    sendEvent(res, { type: "progress", message: "正在将原始内容转换为可编辑字段" });
    await streamStructuredResponse({
      res,
      schemaName: "imported_resume",
      schema: importedProfileJSONSchema,
      sendEvent,
      transformResult: normalizeImportedProfile,
      system: `你是简历文档结构化专家。根据从 PDF 提取的带顺序文本和版面信息转换为可编辑简历数据。
必须遵守：
1. 完整保留原文事实、数字、语言和内容，不润色、不删减、不翻译。
2. 按 PDF 从上到下保留区块顺序，将区块 key 或自定义区块 id 写入 sectionOrder。
3. 标题为“教育经历”的区块必须归入 education，sectionOrder 使用 "education"，严禁创建同名 customSection。
4. 标题包含“实习经历”或“工作经历”的区块必须归入 experience，sectionOrder 使用 "experience"，严禁创建同名 customSection。
5. 明确的项目归入 projects，sectionOrder 使用 "projects"。
6. 只有内容创作、AI 应用、证书、语言、其他等无法归入固定结构的区块才放入 customSections，每个原始区块单独保存，并将其 id 放入 sectionOrder。
7. 每个 id 必须稳定且唯一，使用 edu_1、exp_1、custom_1、item_1、bullet_1 形式。
8. source.mode 固定为 upload，source.template 根据视觉判断填写 flowcv 或 imported，source.fileName 使用用户提供文件名。
9. basics.photo 必须为空字符串；照片由用户在应用内单独上传。
10. originalText 等于 bullet text，verificationRequired 固定为 false。
11. 联系方式无法归类时写入 extraContact。`,
      input: `<file_name>${fileName}</file_name>
<pdf_layout>
${JSON.stringify(pages)}
</pdf_layout>
请转换为结构化可编辑数据。`,
    });
    res.end();
  } catch (error) {
    apiError(res, error);
  }
}

function normalizeImportedProfile(profile) {
  const retainedSections = [];
  const nextOrder = [];

  for (const key of profile.sectionOrder || []) {
    if (["basics", "header", "summary"].includes(key)) continue;
    const custom = profile.customSections.find((section) => section.id === key);
    if (!custom) {
      if (!nextOrder.includes(key)) nextOrder.push(key);
      continue;
    }

    if (/教育|education/i.test(custom.title)) {
      profile.education.push(
        ...custom.items.map((item, index) => ({
          id: `edu_imported_${index + 1}`,
          school: item.subtitle,
          degree: item.title,
          field: "",
          startDate: splitDate(item.date)[0],
          endDate: splitDate(item.date)[1],
          details: [
            item.location,
            ...item.bullets.map((bullet) => bullet.text),
          ]
            .filter(Boolean)
            .join("；"),
        })),
      );
      if (!nextOrder.includes("education")) nextOrder.push("education");
    } else if (/实习|工作|experience|employment/i.test(custom.title)) {
      profile.experience.push(
        ...custom.items.map((item, index) => ({
          id: `exp_imported_${index + 1}`,
          company: item.subtitle,
          role: item.title,
          startDate: splitDate(item.date)[0],
          endDate: splitDate(item.date)[1],
          location: item.location,
          bullets: item.bullets,
        })),
      );
      if (!nextOrder.includes("experience")) nextOrder.push("experience");
    } else {
      retainedSections.push(custom);
      nextOrder.push(custom.id);
    }
  }

  for (const section of profile.customSections) {
    if (
      !profile.sectionOrder.includes(section.id) &&
      !retainedSections.some((item) => item.id === section.id)
    ) {
      retainedSections.push(section);
      nextOrder.push(section.id);
    }
  }

  profile.customSections = retainedSections;
  profile.sectionOrder = nextOrder;
  return profile;
}

function splitDate(value = "") {
  const parts = value.split(/\s*[–—-]\s*/);
  return [parts[0] || "", parts.slice(1).join(" - ") || ""];
}
