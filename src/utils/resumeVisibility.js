export function hasVisibleEntryContent({
  title,
  organization,
  meta,
  location,
  secondary,
  bullets = [],
}) {
  return Boolean(
    [title, organization, meta, location, secondary].some((value) =>
      String(value || "").trim(),
    ) || bullets.some((bullet) => String(bullet?.text || "").trim()),
  );
}
