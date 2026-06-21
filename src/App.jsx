import { Component, useEffect, useMemo, useRef, useState } from "react";
import Layout from "./components/Layout";
import ProfileForm from "./components/ProfileForm";
import JDAnalysis from "./components/JDAnalysis";
import TailorWorkspace from "./components/TailorWorkspace";
import ReviewExport from "./components/ReviewExport";
import VersionsView from "./components/VersionsView";
import ProfileOverview from "./components/ProfileOverview";
import { Toast } from "./components/ui";
import { createId } from "./data/defaults";
import { demoProfile, demoSession } from "./data/demoCase";
import { createDemoServices } from "./services/demoResumerApi";
import { ResumerServicesProvider } from "./services/ResumerServicesContext";
import {
  loadProfile,
  loadSession,
  loadVersions,
  normalizeProfile,
  saveProfile,
  saveSession,
  saveVersion,
} from "./storage/resumerStorage";
import { calculateMatchScore } from "./utils/matchScore";
import { profileSignature } from "./utils/profileSignature";

export default function App({ runtime = {} }) {
  const { demoMode = false, embedMode = false } = runtime;
  const services = useMemo(
    () => (demoMode ? createDemoServices() : {}),
    [demoMode],
  );
  const initialSession = useMemo(
    () => (demoMode ? structuredClone(demoSession) : loadSession()),
    [demoMode],
  );
  const [profile, setProfile] = useState(() =>
    demoMode ? structuredClone(demoProfile) : loadProfile(),
  );
  const [jdText, setJDText] = useState(initialSession.jdText || "");
  const [analysis, setAnalysis] = useState(initialSession.analysis || null);
  const [tailoredProfile, setTailoredProfile] = useState(
    initialSession.tailoredProfile || null,
  );
  const [matchExplanation, setMatchExplanation] = useState(
    initialSession.matchExplanation || null,
  );
  const [tailoredSourceSignature, setTailoredSourceSignature] = useState(
    initialSession.tailoredSourceSignature || "",
  );
  const [tailorWorkspaceState, setTailorWorkspaceState] = useState(
    initialSession.tailorWorkspaceState || {},
  );
  const [activeStep, setActiveStep] = useState(
    ["profile", "jd", "tailor", "review"].includes(initialSession.activeStep)
      ? initialSession.activeStep
      : "profile",
  );
  const [activeNav, setActiveNav] = useState("workspace");
  const [versions, setVersions] = useState(() =>
    demoMode ? [] : loadVersions(),
  );
  const [saveState, setSaveState] = useState(
    demoMode ? "演示数据不会保存" : "已保存",
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);

  const isTailoredCurrent =
    Boolean(tailoredProfile) &&
    tailoredSourceSignature === profileSignature(profile);
  const finalProfile = isTailoredCurrent ? tailoredProfile : profile;
  const score = useMemo(
    () => calculateMatchScore(finalProfile, analysis),
    [finalProfile, analysis],
  );

  useEffect(() => {
    if (embedMode && window.parent !== window) {
      window.parent.postMessage(
        { type: "resumer-demo-ready" },
        window.location.origin,
      );
    }
  }, [embedMode]);

  useEffect(() => {
    if (demoMode) {
      setSaveState("演示数据不会保存");
      return undefined;
    }

    setSaveState("正在保存...");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProfile(profile);
      saveSession({
        jdText,
        analysis,
        tailoredProfile,
        tailoredSourceSignature,
        tailorWorkspaceState,
        matchExplanation,
        activeStep,
      });
      setSaveState("已保存");
    }, 450);
    return () => clearTimeout(saveTimer.current);
  }, [
    profile,
    jdText,
    analysis,
    tailoredProfile,
    tailoredSourceSignature,
    tailorWorkspaceState,
    matchExplanation,
    activeStep,
    demoMode,
  ]);

  const resetDerivedResume = () => {
    setTailoredProfile(null);
    setTailoredSourceSignature("");
    setTailorWorkspaceState({});
    setMatchExplanation(null);
  };

  const notify = (title, message = "", type = "success") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 4200);
  };

  const navigateStep = (step) => {
    setActiveNav("workspace");
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateNav = (nav) => {
    setActiveNav(nav);
    if (nav === "workspace") setActiveStep(activeStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveVersion = () => {
    const version = {
      id: createId("version"),
      position: analysis?.position || profile.basics.targetRole,
      createdAt: new Date().toISOString(),
      profile,
      tailoredProfile,
      tailoredSourceSignature,
      tailorWorkspaceState,
      matchExplanation,
      jdText,
      analysis,
    };
    if (demoMode) {
      setVersions((current) => [version, ...current].slice(0, 20));
      notify("演示版本仅在本次浏览中保留");
      return;
    }

    setVersions(saveVersion(version));
    notify("版本已保存", "你可以随时从历史版本中恢复。");
  };

  const restoreVersion = (version) => {
    setProfile(normalizeProfile(version.profile));
    setTailoredProfile(
      version.tailoredProfile ? normalizeProfile(version.tailoredProfile) : null,
    );
    setTailoredSourceSignature(version.tailoredSourceSignature || "");
    setTailorWorkspaceState(version.tailorWorkspaceState || {});
    setMatchExplanation(version.matchExplanation || null);
    setJDText(version.jdText);
    setAnalysis(version.analysis);
    setActiveNav("workspace");
    setActiveStep("review");
    notify("历史版本已恢复", version.position);
  };

  let content;
  if (activeNav === "profile") {
    content = (
      <ProfileOverview
        profile={profile}
        onEdit={() => {
          setActiveNav("workspace");
          setActiveStep("profile");
        }}
      />
    );
  } else if (activeNav === "versions") {
    content = <VersionsView versions={versions} onRestore={restoreVersion} />;
  } else if (activeStep === "profile") {
    content = (
      <ProfileForm
        profile={profile}
        setProfile={setProfile}
        onProfileReplaced={resetDerivedResume}
        onNext={() => navigateStep("jd")}
        notify={notify}
        demoMode={demoMode}
      />
    );
  } else if (activeStep === "jd") {
    content = (
      <JDAnalysis
        jdText={jdText}
        setJDText={setJDText}
        analysis={analysis}
        setAnalysis={setAnalysis}
        profile={profile}
        setProfile={setProfile}
        onProfileChanged={resetDerivedResume}
        onNext={() => navigateStep("tailor")}
        loading={loading}
        setLoading={setLoading}
        progress={progress}
        setProgress={setProgress}
        notify={notify}
      />
    );
  } else if (activeStep === "tailor") {
    content = (
      <TailorWorkspace
        profile={profile}
        analysis={analysis}
        tailoredProfile={tailoredProfile}
        setTailoredProfile={setTailoredProfile}
        tailoredSourceSignature={tailoredSourceSignature}
        setTailoredSourceSignature={setTailoredSourceSignature}
        workspaceState={tailorWorkspaceState}
        setWorkspaceState={setTailorWorkspaceState}
        onNext={() => navigateStep("review")}
        loading={loading}
        setLoading={setLoading}
        progress={progress}
        setProgress={setProgress}
        notify={notify}
      />
    );
  } else {
    content = (
      <ReviewExport
        profile={finalProfile}
        analysis={analysis}
        matchExplanation={matchExplanation}
        setMatchExplanation={setMatchExplanation}
        onSaveVersion={handleSaveVersion}
        notify={notify}
      />
    );
  }

  return (
    <ResumerServicesProvider services={services}>
      <AppErrorBoundary>
        <Layout
          activeStep={activeStep}
          onStepChange={navigateStep}
          activeNav={activeNav}
          onNavChange={navigateNav}
          profile={profile}
          saveState={saveState}
          score={score.overallScore}
          embedMode={embedMode}
          demoMode={demoMode}
        >
          {content}
        </Layout>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </AppErrorBoundary>
    </ResumerServicesProvider>
  );
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] p-8">
          <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-7 text-center">
            <h1 className="text-lg font-semibold">页面遇到了一点问题</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              你的本地资料仍然保留。刷新页面后可以继续编辑。
            </p>
            <button className="primary-button mt-5" onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
