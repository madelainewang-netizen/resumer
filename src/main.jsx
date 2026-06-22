import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseAppRuntime } from "./runtime/appRuntime";
import { selectRootView } from "./runtime/rootView";
import "./case-study.css";
import "./styles.css";

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
