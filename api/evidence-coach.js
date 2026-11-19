import { apiError, requirePost, sendEvent, startSSE } from "./_lib/http.js";
import { streamStructuredResponse, WRITING_RULES } from "./_lib/ai.js";
import { RESUME_SOP } from "./_lib/skills/resumeSop.js";
import {
  evidenceDraftJSONSchema,
  evidenceQuestionsJSONSchema,
} from "./_lib/schemas.js";

function listExistingItems(profile) {
  return [
    ...(profile.experience || []).map((item) => ({
      id: item.id,
      type: "工作/实习",
      name: [item.company, item.role].filter(Boolean).join(" · "),
    })),
    ...(profile.projects || []).map((item) => ({ id: item.id, type: "项目", name: item.name })),
    ...(profile.customSections || []).flatMap((section) =>
      (section.items || []).map((item) => ({
        id: item.id,
        type: section.title,
        name: [item.title, item.subtitle].filter(Boolean).join(" · "),
      })),
    ),
  ];
}

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
        temperature: 0.7,
        system: `你是严谨的职业经历教练。目标是通过提问帮助用户回忆真实经历，而不是替用户创造经历。
根据目标岗位能力缺口和候选人当前简历，生成 3-4 个简短、具体、彼此不重复的问题，每个问题一句话，口语化，像朋友聊天时会问的那样。
问题按重要性排序，优先覆盖：在什么场景做过、你具体做了什么、最后有什么产出或结果。不要问得太细碎。
所有问题都是选答，required 一律为 false；hint 给一个回答示例的开头，帮用户想起来。
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
        temperature: 0.5,
        system: `${WRITING_RULES}

写法参考这份《简历修改 SOP》：
${RESUME_SOP}

你是严格遵守事实边界的简历编辑。只根据用户回答生成一条经历草稿。
用户可能只回答了部分问题，答案也可能很口语、很零散，请从中提取事实，没回答的部分不要补。
bullets 必须改写成简历书面体（省略主语、动词开头、分号连接），按 STAR 逻辑排列，不能照抄用户的口语原话。
规则：
1. 不得增加用户没有提供的公司、项目、职责、技能、数字、日期或结果。
2. 信息缺失时对应字段返回空字符串，不得猜测。
3. suggestedType 只能是 experience、project 或 custom。
4. bullets 输出 1-4 条，使用“行动 + 方法 + 真实结果/目的”；没有结果时只写用户确认过的行动和目的。
5. verificationChecklist 列出草稿中仍需用户核对的事实；完全明确时返回空数组。
6. 这只是待确认草稿，不得夸大用户角色。
7. 先判断这件事属于哪里：如果用户回答的是在已有某段经历（同一家公司、同一个项目）里做的事，targetItemId 填 existing_items 里那段经历的 id，title、organization、role、location、日期都返回空字符串，bullets 只写这次新补充的事；只有当它是一段全新的经历时，targetItemId 才返回空字符串，并完整填写经历信息。`,
        input: `<requirement>${requirement}</requirement>
<existing_items>${JSON.stringify(listExistingItems(profile))}</existing_items>
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
