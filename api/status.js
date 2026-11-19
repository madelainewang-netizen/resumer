import { getAIConfig } from "./_lib/ai.js";

export default function handler(_req, res) {
  const config = getAIConfig();
  res.status(200).json({
    aiConfigured: Boolean(config.apiKey),
    provider: config.provider,
    providerLabel: config.label,
    model: config.model,
  });
}
