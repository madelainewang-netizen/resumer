import OpenAI from "openai";

/**
 * 统一的大模型调用层。支持任何 OpenAI 兼容接口（DeepSeek、Kimi、通义千问、智谱等），
 * 通过环境变量切换，不需要改代码：
 *
 *   AI_PROVIDER=moonshot      # 可选：deepseek | moonshot(kimi) | qwen | zhipu；不填时按已配置的 key 自动选
 *   KIMI_API_KEY / DEEPSEEK_API_KEY / DASHSCOPE_API_KEY / ZHIPU_API_KEY   # 各家自己的 key
 *   AI_API_KEY=...            # 也可以统一用这个
 *   AI_BASE_URL=... AI_MODEL=...   # 可选，覆盖默认地址和模型
 *   AI_REASONING_EFFORT=low   # 思考型模型（如 kimi-k3）的思考强度：low | medium | high
 */
const PRESETS = {
  deepseek: {
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    model: "deepseek-chat",
    keys: ["DEEPSEEK_API_KEY"],
  },
  moonshot: {
    label: "Kimi",
    // 国内站 platform.kimi.com 的 key 用 .cn；国际站 platform.kimi.ai 的 key 用 .ai，两边 key 不通用
    baseURL: "https://api.moonshot.cn/v1",
    fallbackBaseURL: "https://api.moonshot.ai/v1",
    model: "kimi-k3",
    keys: ["KIMI_API_KEY", "MOONSHOT_API_KEY"],
    // kimi-k3 温度固定为 1.0、思考模式常开：不能传 temperature，用 reasoning_effort 控制思考强度
    fixedTemperature: true,
    reasoning: true,
  },
  qwen: {
    label: "通义千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    keys: ["DASHSCOPE_API_KEY", "QWEN_API_KEY"],
  },
  zhipu: {
    label: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-plus",
    keys: ["ZHIPU_API_KEY"],
  },
};
const ALIASES = { kimi: "moonshot" };
// 没有指定 AI_PROVIDER 时，按这个顺序找已经配置了 key 的服务
const AUTO_ORDER = ["moonshot", "qwen", "zhipu", "deepseek"];

export function getAIConfig(env = process.env) {
  const requested = (env.AI_PROVIDER || "").toLowerCase();
  const provider =
    ALIASES[requested] ||
    (PRESETS[requested] ? requested : "") ||
    AUTO_ORDER.find((name) => PRESETS[name].keys.some((key) => env[key])) ||
    "deepseek";
  const preset = PRESETS[provider];
  const customModel = env.AI_MODEL || (provider === "deepseek" ? env.DEEPSEEK_MODEL : "");
  return {
    provider,
    label: preset.label,
    apiKey: env.AI_API_KEY || preset.keys.map((key) => env[key]).find(Boolean) || "",
    baseURL: env.AI_BASE_URL || preset.baseURL,
    fallbackBaseURL: env.AI_BASE_URL ? "" : preset.fallbackBaseURL || "",
    model: customModel || preset.model,
    fixedTemperature: Boolean(preset.fixedTemperature),
    reasoningEffort: preset.reasoning ? env.AI_REASONING_EFFORT || "low" : "",
  };
}

export function getAIClient(config = getAIConfig(), baseURL = config.baseURL) {
  if (!config.apiKey) {
    const error = new Error("服务端尚未配置大模型的 API key（例如 KIMI_API_KEY 或 DEEPSEEK_API_KEY）");
    error.status = 503;
    throw error;
  }
  return new OpenAI({ apiKey: config.apiKey, baseURL, timeout: 240_000, maxRetries: 0 });
}

/** 所有生成类任务共享的写作规范，避免"AI 腔"。 */
export const WRITING_RULES = `写作规范（所有输出都要遵守）：
- 使用简历书面体：省略主语，以动词或能力短语开头，短句之间用分号；专业、简洁，像一份认真写过的中文简历，而不是口头描述，也不是 JD。
- 禁用口语词：帮忙、弄、搞、做了一下、挺、比较、然后、就。
- 禁用空泛词和 AI 腔词：赋能、抓手、闭环、打通、链路、矩阵、深耕、助力、全方位、多维度、显著提升、高效、极大地、积极参与、负责相关工作、证据、线索、验证。
- 每句话都要有具体对象：做了什么、怎么做、产出了什么；没有数字就写清楚产出物（文档、看板、方案、流程）或影响范围，不要硬编数字。
- 不照搬 JD 原句；只有当候选人原文里已有对应事实时，才可以换用 JD 里的专业说法。
- 中文简历使用中文全角标点；英文、数字与中文之间不强制加空格，保持原文习惯。`;

export async function streamStructuredResponse({
  res,
  schemaName,
  schema,
  system: systemPrompt,
  input,
  sendEvent,
  transformResult,
  temperature = 0.5,
  maxRetries = 1,
}) {
  const config = getAIConfig();
  let client = getAIClient(config);
  const schemaInstructions = `\n\n你必须只返回一个合法 JSON 对象，不使用 Markdown 代码块，不输出任何解释。JSON 必须严格满足以下 ${schemaName} Schema，不能缺少字段，也不能增加字段：\n${JSON.stringify(schema)}`;
  const system = `${systemPrompt}${schemaInstructions}`;
  const user = normalizeInput(input);
  let feedback = "";

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      sendEvent(res, { type: "progress", message: "结果格式有误，正在自动重试" });
    }
    // 重试时把上一轮的问题写进同一条用户消息里，不回传 assistant 消息
    // （思考型模型要求回传完整的 reasoning_content，这样做兼容所有服务）
    const messages = [
      { role: "system", content: system },
      { role: "user", content: feedback ? `${user}\n\n${feedback}` : user },
    ];
    let output;
    for (let wait = 0; ; wait += 1) {
      try {
        output = await collectStream(client, config, { temperature, messages });
        break;
      } catch (error) {
        // Kimi 国内站和国际站的 key 不通用：401 时换另一个地址试一次
        if (error?.status === 401 && config.fallbackBaseURL && client.baseURL !== config.fallbackBaseURL) {
          client = getAIClient(config, config.fallbackBaseURL);
          continue;
        }
        // 429：账号并发或频率到上限（例如 Kimi 低档账号同时只能跑 1 个请求），排队等待后重试
        if (error?.status === 429 && wait < RATE_LIMIT_RETRIES) {
          const seconds = retryAfterSeconds(error, wait);
          sendEvent(res, { type: "progress", message: `AI 服务正忙，${seconds} 秒后自动重试` });
          await sleep(seconds * 1000);
          continue;
        }
        throw error;
      }
    }

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
      feedback = `（你上一次的输出无法使用：${error.message}。请重新输出完整、合法、严格符合 Schema 的 JSON。上一次输出的开头是：${output.slice(0, 1500)}）`;
    }
  }

  const error = new Error(`AI 返回的结果无法使用（${lastError?.message || "未知错误"}），请重试`);
  error.status = 502;
  throw error;
}

const RATE_LIMIT_RETRIES = 12;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 优先用服务端给的等待时间（Retry-After 或报错里的"after N seconds"），否则逐步加长。 */
function retryAfterSeconds(error, attempt) {
  const header = Number(error?.headers?.get?.("retry-after") ?? error?.headers?.["retry-after"]);
  const fromMessage = Number(String(error?.message || "").match(/after (\d+(?:\.\d+)?) seconds?/i)?.[1]);
  const hinted = Number.isFinite(header) && header > 0 ? header : Number.isFinite(fromMessage) && fromMessage > 0 ? fromMessage : 0;
  return Math.min(15, Math.max(hinted, 2 + attempt * 2));
}

async function collectStream(client, config, { temperature, messages }) {
  const request = {
    model: config.model,
    stream: true,
    response_format: { type: "json_object" },
    messages,
  };
  if (!config.fixedTemperature) request.temperature = temperature;
  if (config.reasoningEffort) request.reasoning_effort = config.reasoningEffort;
  const stream = await client.chat.completions.create(request);
  let output = "";
  for await (const chunk of stream) {
    // 思考型模型会先输出 reasoning_content，这里只收正式回答
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
