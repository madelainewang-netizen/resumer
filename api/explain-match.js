import { apiError, requirePost, sendEvent, startSSE } from "./_lib/http.js";
import { streamStructuredResponse, WRITING_RULES } from "./_lib/ai.js";
import { RESUME_SOP } from "./_lib/skills/resumeSop.js";
import { matchExplanationJSONSchema } from "./_lib/schemas.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const { profile, analysis, score } = req.body || {};
  if (!profile || !analysis || !score) {
    return res.status(400).json({ error: "缺少简历、JD 分析或规则评分" });
  }

  startSSE(res);
  sendEvent(res, { type: "progress", message: "正在从招聘经理视角快速扫读" });
  try {
    await streamStructuredResponse({
      res,
      schemaName: "match_explanation",
      schema: matchExplanationJSONSchema,
      sendEvent,
      temperature: 0.5,
      system: `你是严格、具体的招聘经理。根据候选人简历、JD 分析和已计算的规则分数提供解释。
不得修改或重新计算分数，不得推断候选人未提供的能力。
输出 3 条最有证据的优势、3 条优先级明确的改进建议，并列出真正缺少证据的能力。
建议必须指向可执行的简历修改：写清楚改哪一条经历、往哪个方向改，不使用空泛鼓励。

判断取舍和给建议时，以这份《简历修改 SOP》为标准：
${RESUME_SOP}

${WRITING_RULES}`,
      input: `<rule_score>\n${JSON.stringify(score)}\n</rule_score>
<jd_analysis>\n${JSON.stringify(analysis)}\n</jd_analysis>
<candidate_profile>\n${JSON.stringify(profile)}\n</candidate_profile>`,
    });
    res.end();
  } catch (error) {
    apiError(res, error);
  }
}
