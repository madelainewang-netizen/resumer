import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import CaseStudyPage from "./components/CaseStudyPage";
import { parseAppRuntime } from "./runtime/appRuntime";
import "./case-study.css";
import "./styles.css";

export function selectRootView(runtime) {
  if (runtime.page === "case-study") {
    return <CaseStudyPage />;
  }

  const { demoMode, embedMode } = runtime;
  return <App runtime={{ demoMode, embedMode }} />;
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const runtime = parseAppRuntime(
    window.location.pathname,
    window.location.search,
  );

  createRoot(rootElement).render(
    <StrictMode>{selectRootView(runtime)}</StrictMode>,
  );
}
