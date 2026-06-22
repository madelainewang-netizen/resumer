import App from "../App";
import CaseStudyPage from "../components/CaseStudyPage";

export function selectRootView(runtime) {
  if (runtime.page === "case-study") {
    return <CaseStudyPage />;
  }

  const { demoMode, embedMode } = runtime;
  return <App runtime={{ demoMode, embedMode }} />;
}
