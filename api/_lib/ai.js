import OpenAI from "openai";

/**
 * 统一的大模型调用层。支持任何 OpenAI 兼容接口（DeepSeek、通义千问、Kimi、智谱等），
 * 通过环境变量切换，不需要改代码：
 *
 *   AI_API_KEY=...            # 也兼容旧的 DEEPSEEK_API_KEY
 *   AI_BASE_URL=...           # 默认 https://api.deepseek.com
 *   AI_MODEL=...              # 默认 deepseek-chat（也兼容 DEEPSEEK_MODEL）
 */
const PRESETS = {
  deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-chat", label: "DeepSeek" },
  qwen: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    label: "通义千问",
  },
  moonshot: { baseURL: "https://api.moonshot.cn/v1", model: "kimi-latest", label: "Kimi" },
  zhipu: { baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-plus", label: "智谱 GLM" },
};

export function getAIConfig(env = process.env) {
  const provider = (env.AI_PROVIDER || "deepseek").toLowerCase();
  const preset = PRESETS[provider] || PRESETS.deepseek;
  return {
    provider,
    label: PRESETS[provider]?.label || provider,
    apiKey: env.AI_API_KEY || env.DEEPSEEK_API_KEY || "",
    baseURL: env.AI_BASE_URL || preset.baseURL,
    model: env.AI_MODEL || env.DEEPSEEK_MODEL || preset.model,
  };
}

export function getAIClient(config = getAIConfig()) {
  if (!config.apiKey) {
    const error = new Error("服务端尚未配置 AI_API_KEY（或 DEEPSEEK_API_KEY）");
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: 55_000 });
}

/** 所有生成类任务共享的写作规范，避免"AI 腔"。 */
export const WRITING_RULES = `写作规范（所有输出都要遵守）：
- 用招聘方能快速读懂的大白话，像一个会写简历的人写的，而不是像 AI 或 JD。
- 禁用空泛词和 AI 腔词：赋能、抓手、闭环、打通、链路、矩阵、深耕、助力、全方位、多维度、显著提升、高效、极大地、积极参与、负责相关工作、证据、线索、验证。用陈述句和大白话。
- 每句话都要有具体对象：做了什么、怎么做、产出了什么；没有数字就写清楚产出物（文档、看板、方案、流程）或影响范围，不要硬编数字。
- 不照搬 JD 原句；只有当候选人原文里已有对应事实时，才可以换用 JD 里的专业说法。
- 中文简历使用中文全角标点；英文、数字与中文之间不强制加空格，保持原文习惯。`;

export async function streamStructuredResponse({
  res,
  schemaName,
  schema,
  system,
  input,
  sendEvent,
  transformResult,
  temperature = 0.5,
  maxRetries = 1,
}) {
  const config = getAIConfig();
  const client = getAIClient(config);
  const schemaInstructions = `\n\n你必须只返回一个合法 JSON 对象，不使用 Markdown 代码块，不输出任何解释。JSON 必须严格满足以下 ${schemaName} Schema，不能缺少字段，也不能增加字段：\n${JSON.stringify(schema)}`;
  const messages = [
    { role: "system", content: `${system}${schemaInstructions}` },
    { role: "user", content: normalizeInput(input) },
  ];

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      sendEvent(res, { type: "progress", message: "结果格式有误，正在自动重试" });
    }
    const output = await collectStream(client, {
      model: config.model,
      temperature,
      messages,
    });

    console.info("[ai-response]", {
      provider: config.provider,
      model: config.model,
      schemaName,
      attempt,
      outputLength: output.length,
    });

    let parsed;
    try {
      parsed = JSON.parse(extractJSON(output));
      if (transformResult) parsed = transformResult(parsed);
      const validationError = validateSchema(parsed, schema);
      if (validationError) throw new Error(`结构不完整：${validationError}`);
      sendEvent(res, { type: "result", data: parsed });
      return parsed;
    } catch (error) {
      lastError = error;
      // 把错误反馈给模型再试一次，比直接报错给用户体验好得多
      messages.push(
        { role: "assistant", content: output.slice(0, 20_000) },
        {
          role: "user",
          content: `上面的输出无法使用：${error.message}。请重新输出完整、合法、严格符合 Schema 的 JSON。`,
        },
      );
    }
  }

  const error = new Error(`AI 返回的结果无法使用（${lastError?.message || "未知错误"}），请重试`);
  error.status = 502;
  throw error;
}

async function collectStream(client, { model, temperature, messages }) {
  const stream = await client.chat.completions.create({
    model,
    temperature,
    stream: true,
    response_format: { type: "json_object" },
    messages,
  });
  let output = "";
  for await (const chunk of stream) {
    output += chunk.choices?.[0]?.delta?.content || "";
  }
  return output;
}

/** 兼容模型偶尔包裹的 ```json 代码块或前后多余文字。 */
export function extractJSON(text) {
  const value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : value;
}

function normalizeInput(input) {
  if (typeof input === "string") return input;
  return JSON.stringify(input);
}

export function validateSchema(value, schema, path = "result") {
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return `${path} 应为对象`;
    }
    for (const key of schema.required || []) {
      if (!(key in value)) return `${path}.${key} 缺失`;
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in (schema.properties || {}))) return `${path}.${key} 不允许出现`;
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (key in value) {
        const error = validateSchema(value[key], childSchema, `${path}.${key}`);
        if (error) return error;
      }
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return `${path} 应为数组`;
    for (let index = 0; index < value.length; index += 1) {
      const error = validateSchema(value[index], schema.items, `${path}[${index}]`);
      if (error) return error;
    }
  } else if (schema.type === "string" && typeof value !== "string") {
    return `${path} 应为字符串`;
  } else if (schema.type === "string" && schema.enum && !schema.enum.includes(value)) {
    return `${path} 必须是 ${schema.enum.join("、")} 之一`;
  } else if (schema.type === "number" && typeof value !== "number") {
    return `${path} 应为数字`;
  } else if (schema.type === "boolean" && typeof value !== "boolean") {
    return `${path} 应为布尔值`;
  }
  return null;
}
