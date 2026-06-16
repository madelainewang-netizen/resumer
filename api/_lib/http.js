export function requirePost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export function startSSE(res) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

export function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function apiError(res, error) {
  console.error("[api-error]", {
    status: error?.status || 500,
    message: error?.message || "AI 服务暂时不可用",
    stack: error?.stack,
  });

  const message =
    error?.status === 429
      ? "请求过于频繁，请稍后重试"
      : error?.status === 401
        ? "DeepSeek API key 无效，请检查 DEEPSEEK_API_KEY"
        : error?.status === 402
          ? "DeepSeek 账户余额不足，请充值后重试"
        : error?.status === 403
          ? "DeepSeek 拒绝了请求（403），请检查账户状态和 API 权限"
        : error?.message || "AI 服务暂时不可用";

  if (res.headersSent) {
    sendEvent(res, { type: "error", message });
    res.end();
  } else {
    res.status(error?.status || 500).json({ error: message });
  }
}
