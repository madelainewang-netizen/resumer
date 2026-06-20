export function parseAppRuntime(pathname, search) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);

  return {
    page: normalizedPath === "/case-study" ? "case-study" : "workspace",
    demoMode: params.get("demo") === "1",
    embedMode: params.get("embed") === "1",
  };
}
