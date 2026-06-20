export function parseAppRuntime(pathname, search) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/case-study") {
    return {
      page: "case-study",
      demoMode: false,
      embedMode: false,
    };
  }

  const params = new URLSearchParams(search);

  return {
    page: "workspace",
    demoMode: params.get("demo") === "1",
    embedMode: params.get("embed") === "1",
  };
}
