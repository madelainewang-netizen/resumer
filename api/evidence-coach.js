import { apiError, requirePost, sendEvent, startSSE } from "./_lib/http.js";
import { streamStructuredResponse } from "./_lib/ai.js";
import {
  evidenceDraftJSONSchema,
  evidenceQuestionsJSONSchema,
} from "./_lib/schemas.js";

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  const { action, requirement, evidenceHint, analysis, profile, answers, questions } =
    req.body || {};
  if (!requirement || !profile || !analysis) {
    return res.status(400).json({ error: "缺少能力要求、JD 分析或简历档案" });
  }
  if (!["questions", "draft"].includes(action)) {
    return res.status(400).json({ error: "无效的经历挖掘操作" });
  }
  if (action === "draft" && (!answers || !questions)) {
    return res.status(400).json({ error: "请先回答经历挖掘问题" });
  }

  startSSE(res);
  try {
    if (action === "questions") {
      sendEvent(res, { type: "progress", message: "正在寻找可迁移能力线索" });
      await streamStructuredResponse({
        res,
        schemaName: "evidence_questions",
        schema: evidenceQuestionsJSONSchema,
        sendEvent,
        system: `你是严谨的职业经历教练。目标是通过提问帮助用户回忆真实经历，而不是替用户创造经历。
根据目标岗位能力缺口和候选人当前简历，生成 4-6 个简短、具体、彼此不重复的问题。
问题应依次覆盖：经历场景、用户职责、具体行动、协作对象、困难与解决方式、真实结果。
对于转行用户，指出 3-5 个可能承载该能力的可迁移场景，例如校园、志愿者、内容创作、个人项目或原行业工作。
不得暗示用户虚构数字。`,
        input: `<requirement>${requirement}</requirement>
<evidence_hint>${evidenceHint || ""}</evidence_hint>
<jd_analysis>${JSON.stringify(analysis)}</jd_analysis>
<candidate_profile>${JSON.stringify(profile)}</candidate_profile>`,
      });
    } else {
      sendEvent(res, { type: "progress", message: "正在把回答整理为经历草稿" });
      await streamStructuredResponse({
        res,
        schemaName: "evidence_draft",
        schema: evidenceDraftJSONSchema,
        sendEvent,
        system: `你是严格遵守事实边界的简历编辑。只根据用户回答生成一条经历草稿。
规则：
1. 不得增加用户没有提供的公司、项目、职责、技能、数字、日期或结果。
2. 信息缺失时对应字段返回空字符串，不得猜测。
3. suggestedType 只能是 experience、project 或 custom。
4. bullets 输出 1-4 条，使用“行动 + 方法 + 真实结果/目的”；没有结果时只写用户确认过的行动和目的。
5. verificationChecklist 列出草稿中仍需用户核对的事实；完全明确时返回空数组。
6. 这只是待确认草稿，不得夸大用户角色。`,
        input: `<requirement>${requirement}</requirement>
<questions>${JSON.stringify(questions)}</questions>
<user_answers>${JSON.stringify(answers)}</user_answers>
<candidate_profile>${JSON.stringify(profile)}</candidate_profile>`,
      });
    }
    res.end();
  } catch (error) {
    apiError(res, error);
  }
}
