export function splitBulletSummary(text) {
  const value = String(text || "").trim();
  const match = value.match(/^([^：:]{2,18})([：:])\s*(.+)$/);
  if (!match) return { summary: "", body: value };
  return {
    summary: `${match[1].trim()}${match[2]}`,
    body: match[3].trim(),
  };
}
