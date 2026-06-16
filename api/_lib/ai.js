import OpenAI from "openai";

export function getAIClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    const error = new Error("服务端尚未配置 DEEPSEEK_API_KEY");
    error.status = 503;
    throw error;
  }
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
}

export const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function streamStructuredResponse({
  res,
  schemaName,
  schema,
  system,
  input,
  sendEvent,
  transformResult,
}) {
  const client = getAIClient();
  const schemaInstructions = `\n\n你必须只返回合法 JSON，不使用 Markdown 代码块。JSON 必须严格满足以下 ${schemaName} Schema，不能缺少字段，也不能增加字段：\n${JSON.stringify(schema)}`;
  const stream = await client.chat.completions.create({
    model,
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${system}${schemaInstructions}` },
      { role: "user", content: normalizeInput(input) },
    ],
  });

  let output = "";
  for await (const chunk of stream) {
    output += chunk.choices?.[0]?.delta?.content || "";
  }

  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    const error = new Error("DeepSeek 返回了无法解析的 JSON，请重试");
    error.status = 502;
    throw error;
  }

  if (transformResult) parsed = transformResult(parsed);
  const validationError = validateSchema(parsed, schema);
  if (validationError) {
    const error = new Error(`AI 返回结构不完整：${validationError}`);
    error.status = 502;
    throw error;
  }
  sendEvent(res, { type: "result", data: parsed });
}

function normalizeInput(input) {
  if (typeof input === "string") return input;
  return JSON.stringify(input);
}

function validateSchema(value, schema, path = "result") {
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
  } else if (
    schema.type === "string" &&
    schema.enum &&
    !schema.enum.includes(value)
  ) {
    return `${path} 必须是 ${schema.enum.join("、")} 之一`;
  } else if (schema.type === "number" && typeof value !== "number") {
    return `${path} 应为数字`;
  } else if (schema.type === "boolean" && typeof value !== "boolean") {
    return `${path} 应为布尔值`;
  }
  return null;
}
