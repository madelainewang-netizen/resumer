export default function handler(_req, res) {
  res.status(200).json({
    aiConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    provider: "deepseek",
  });
}
