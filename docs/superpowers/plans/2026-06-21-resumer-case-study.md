# Resumer Case Study Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone `/case-study` portfolio page and a zero-cost, localStorage-isolated `/?demo=1&embed=1` interactive Resumer demo for HR viewers.

**Architecture:** Keep the existing Vite single entry point and select the case-study page or workspace from `window.location`. Refactor API calls behind a small React service context so standard mode keeps the existing real services while demo mode receives deterministic fixtures. Pass runtime configuration into `App` so demo state lives only in React memory and embedded mode uses a compact shell.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Vitest, Testing Library, lucide-react.

---

## File Structure

- Create `src/runtime/appRuntime.js`: Parse pathname and query parameters into an explicit runtime object.
- Create `src/runtime/appRuntime.test.js`: Verify route and mode selection.
- Create `src/data/demoCase.js`: Own the fictional graduate profile, JD, AI outputs, and initial demo session.
- Create `src/services/ResumerServicesContext.jsx`: Provide real or demo service implementations to existing components.
- Create `src/services/demoResumerApi.js`: Return cloned fixture responses without network requests.
- Create `src/services/demoResumerApi.test.js`: Verify deterministic, isolated demo responses.
- Create `src/components/CaseStudyPage.jsx`: Render the portfolio narrative and interactive iframe.
- Create `src/components/CaseStudyPage.test.jsx`: Verify page content, links, and iframe fallback behavior.
- Create `src/case-study.css`: Own responsive case-study styling without changing workspace utility styles.
- Modify `src/main.jsx`: Select `CaseStudyPage` or `App` using the runtime parser.
- Modify `src/App.jsx`: Accept runtime configuration, isolate demo state, and provide services.
- Modify `src/components/Layout.jsx`: Render a compact embedded shell and demo exit action.
- Modify `src/components/ProfileForm.jsx`: Hide PDF upload in demo mode and label the sample data.
- Modify `src/components/JDAnalysis.jsx`: Consume injected analysis service.
- Modify `src/components/TailorWorkspace.jsx`: Consume injected tailoring and condensing services.
- Modify `src/components/EvidenceCoach.jsx`: Consume injected evidence services.
- Modify `src/components/ReviewExport.jsx`: Consume injected recruiter-review service.
- Modify `src/components/ResumeImport.jsx`: Consume injected PDF import service.
- Modify `src/styles.css`: Remove the global desktop-only minimum width for the case-study route while preserving it on `.app-shell`.
- Modify `README.md`: Document `/case-study` and demo mode.

## Task 1: Parse Application Runtime

**Files:**
- Create: `src/runtime/appRuntime.js`
- Create: `src/runtime/appRuntime.test.js`

- [ ] **Step 1: Write failing route-selection tests**

```js
import { describe, expect, it } from "vitest";
import { parseAppRuntime } from "./appRuntime";

describe("parseAppRuntime", () => {
  it("selects the case study for /case-study", () => {
    expect(parseAppRuntime("/case-study", "")).toEqual({
      page: "case-study",
      demoMode: false,
      embedMode: false,
    });
  });

  it("selects an embedded demo workspace from query parameters", () => {
    expect(parseAppRuntime("/", "?demo=1&embed=1")).toEqual({
      page: "workspace",
      demoMode: true,
      embedMode: true,
    });
  });

  it("keeps the standard workspace as the default", () => {
    expect(parseAppRuntime("/", "")).toEqual({
      page: "workspace",
      demoMode: false,
      embedMode: false,
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm the module is missing**

Run: `npm test -- src/runtime/appRuntime.test.js`

Expected: FAIL because `./appRuntime` does not exist.

- [ ] **Step 3: Implement the parser**

```js
export function parseAppRuntime(pathname, search) {
  if (pathname.replace(/\/+$/, "") === "/case-study") {
    return { page: "case-study", demoMode: false, embedMode: false };
  }
  const params = new URLSearchParams(search);
  return {
    page: "workspace",
    demoMode: params.get("demo") === "1",
    embedMode: params.get("embed") === "1",
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- src/runtime/appRuntime.test.js`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the runtime parser**

```bash
git add src/runtime/appRuntime.js src/runtime/appRuntime.test.js
git commit -m "Add Resumer runtime mode parser"
```

## Task 2: Build the Fictional Graduate Demo Case

**Files:**
- Create: `src/data/demoCase.js`
- Create: `src/services/demoResumerApi.js`
- Create: `src/services/demoResumerApi.test.js`

- [ ] **Step 1: Write failing demo-service tests**

```js
import { describe, expect, it } from "vitest";
import { createDemoServices } from "./demoResumerApi";

describe("createDemoServices", () => {
  it("returns fixture analysis without using fetch", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("demo mode must not call fetch");
    };
    try {
      const services = createDemoServices();
      const result = await services.analyzeJD("demo jd", () => {});
      expect(result.position).toBe("AI 产品助理");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns fresh clones so edits do not leak between viewers", async () => {
    const first = await createDemoServices().tailorResume();
    first.basics.name = "changed";
    const second = await createDemoServices().tailorResume();
    expect(second.basics.name).toBe("陈雨桐");
  });
});
```

- [ ] **Step 2: Run the test and confirm the demo service is missing**

Run: `npm test -- src/services/demoResumerApi.test.js`

Expected: FAIL because `./demoResumerApi` does not exist.

- [ ] **Step 3: Create complete demo fixtures**

Create `src/data/demoCase.js` with schema-compatible exports:

```js
export const demoProfile = {
  schemaVersion: 2,
  source: { mode: "manual", fileName: "", template: "resumer" },
  sectionOrder: ["education", "experience", "projects", "customSections", "skills"],
  basics: {
    name: "陈雨桐",
    phone: "+86 138 0000 0000",
    email: "yutong.demo@example.com",
    location: "上海",
    targetRole: "AI 产品助理",
    links: "portfolio.example.com/yutong",
    extraContact: "",
    photo: "",
    summary: "传播学应届生，关注生成式 AI 产品与用户体验，具备内容研究、用户访谈和项目协作经验。",
  },
  education: [
    {
      id: "demo_edu_1",
      school: "华东某大学",
      degree: "文学学士",
      field: "传播学",
      startDate: "2022.09",
      endDate: "2026.06",
      details: "相关课程：用户研究、数据新闻、数字媒体产品",
    },
  ],
  experience: [
    {
      id: "demo_exp_1",
      company: "某互联网内容平台",
      role: "产品运营实习生",
      startDate: "2025.03",
      endDate: "2025.08",
      location: "上海",
      bullets: [
        {
          id: "demo_exp_bullet_1",
          text: "协助整理用户反馈与内容数据，每周输出问题清单并同步产品团队。",
        },
        {
          id: "demo_exp_bullet_2",
          text: "参与 AI 写作功能的内测和案例收集，记录用户使用障碍。",
        },
      ],
    },
  ],
  projects: [
    {
      id: "demo_project_1",
      name: "校园 AI 学习助手调研",
      role: "项目负责人",
      stack: "访谈、问卷、Figma",
      startDate: "2025.09",
      endDate: "2025.12",
      bullets: [
        {
          id: "demo_project_bullet_1",
          text: "围绕大学生使用生成式 AI 的场景完成访谈，并制作产品概念原型。",
        },
      ],
    },
  ],
  customSections: [],
  skills: ["用户访谈", "Figma", "内容分析", "基础数据分析", "Prompt 设计"],
};
```

Add the remaining fixture exports to the same file:

```js
import { profileSignature } from "../utils/profileSignature";

export const demoJD = `AI 产品助理（应届生）

岗位职责：
1. 协助完成生成式 AI 产品的用户研究、需求整理和原型设计；
2. 收集用户反馈和产品数据，协助产品经理推进迭代；
3. 与设计、研发和运营团队协作，跟进功能测试与上线；
4. 持续关注 AI 产品和大模型应用趋势。

任职要求：
1. 2026 届本科及以上学历，专业不限；
2. 具备用户研究、逻辑分析和跨团队沟通能力；
3. 熟悉 Figma，有 AI 产品、课程项目或实习经历优先；
4. 对生成式 AI 有持续兴趣，能够主动学习并验证想法。`;

export const demoAnalysis = {
  position: "AI 产品助理",
  seniority: "应届生",
  hardSkills: ["用户研究", "需求分析", "原型设计", "Figma", "产品测试"],
  softSkills: ["逻辑分析", "跨团队沟通", "主动学习", "用户同理心"],
  mustHave: [
    "能够整理用户反馈并形成产品问题",
    "具备基础原型设计和产品协作能力",
    "对生成式 AI 产品有持续实践",
  ],
  niceToHave: ["AI 产品项目经历", "基础数据分析能力"],
  coreRequirements: [
    {
      requirement: "用户研究与需求整理",
      evidenceHint: "说明访谈对象、信息整理方法以及形成的产品判断。",
    },
    {
      requirement: "AI 产品实践",
      evidenceHint: "展示真实使用、测试或设计生成式 AI 产品的经历。",
    },
    {
      requirement: "跨团队协作与推进",
      evidenceHint: "说明协作对象、你的具体动作和交付物。",
    },
  ],
  talentProfile:
    "具备用户视角和结构化表达能力，能够把零散反馈整理为产品问题，并通过原型或测试推动想法落地的初级 AI 产品候选人。",
  resumeTips: [
    "优先展示 AI 功能内测和校园 AI 项目。",
    "补充用户访谈的对象、方法和交付物。",
    "将内容运营经历转译为反馈归纳和跨团队协作证据。",
  ],
};

export const demoTailoredProfile = {
  ...structuredClone(demoProfile),
  basics: {
    ...demoProfile.basics,
    summary:
      "传播学应届生，具备生成式 AI 功能测试、用户反馈归纳和产品概念验证经验，能够使用访谈与原型方法整理需求并推动协作。",
  },
  experience: [
    {
      ...demoProfile.experience[0],
      bullets: [
        {
          id: "demo_exp_bullet_1",
          originalText: demoProfile.experience[0].bullets[0].text,
          text: "用户反馈归纳：整理用户反馈与内容数据，按周输出问题清单并同步产品团队，支持需求讨论。",
          verificationRequired: false,
        },
        {
          id: "demo_exp_bullet_2",
          originalText: demoProfile.experience[0].bullets[1].text,
          text: "AI 功能测试：参与 AI 写作功能内测，记录典型使用场景与操作障碍，沉淀案例供产品团队复盘。",
          verificationRequired: false,
        },
      ],
    },
  ],
  projects: [
    {
      ...demoProfile.projects[0],
      bullets: [
        {
          id: "demo_project_bullet_1",
          originalText: demoProfile.projects[0].bullets[0].text,
          text: "产品概念验证：围绕大学生使用生成式 AI 的场景开展访谈，归纳核心任务并用 Figma 制作产品概念原型。",
          verificationRequired: false,
        },
      ],
    },
  ],
};

export const demoCondensePlan = {
  summary: "保留与 AI 产品、用户研究和协作直接相关的内容，压缩重复背景说明。",
  recommendations: [
    {
      section: "experience",
      itemId: "demo_exp_1",
      bulletId: "demo_exp_bullet_1",
      action: "condense",
      reason: "保留反馈归纳和产品协作证据，减少重复背景。",
      suggestedText:
        "用户反馈归纳：整理用户反馈与内容数据，按周输出问题清单并支持需求讨论。",
    },
  ],
};

export const demoEvidenceQuestions = {
  intro: "这项能力不一定来自正式产品岗位，也可以来自课程、社团或实习协作。",
  transferableExamples: ["课程调研", "社团项目", "功能内测", "内容复盘"],
  questions: [
    {
      id: "demo_question_1",
      question: "你曾经为谁收集反馈或做过访谈？",
      hint: "写明对象和大致场景，不需要编造数量。",
      required: true,
    },
    {
      id: "demo_question_2",
      question: "你如何整理信息，并形成了什么交付物？",
      hint: "例如问题清单、研究结论、原型或复盘文档。",
      required: true,
    },
  ],
};

export const demoEvidenceDraft = {
  suggestedType: "project",
  title: "校园 AI 学习助手调研",
  organization: "课程项目",
  role: "项目负责人",
  startDate: "2025.09",
  endDate: "2025.12",
  location: "上海",
  skills: ["用户访谈", "需求分析", "Figma"],
  bullets: [
    "围绕大学生使用生成式 AI 的学习场景开展访谈，整理核心任务、使用障碍和产品机会。",
    "基于访谈结论制作产品概念原型，并记录仍需验证的关键假设。",
  ],
  verificationChecklist: ["确认访谈对象和交付物均来自真实项目"],
};

export const demoMatchExplanation = {
  strengths: [
    "已有 AI 功能测试和生成式 AI 项目经历。",
    "传播学训练能够支持用户研究与信息归纳。",
    "简历中包含与产品团队协作的真实场景。",
  ],
  suggestions: [
    "继续补充原型如何被评审或验证。",
    "将基础数据分析能力落实到具体工具或课程项目。",
    "明确跨团队协作中自己负责的交付物。",
  ],
  evidenceGaps: ["尚缺少产品上线后的数据验证经历。"],
};

export const demoSession = {
  jdText: demoJD,
  analysis: demoAnalysis,
  tailoredProfile: demoTailoredProfile,
  tailoredSourceSignature: profileSignature(demoProfile),
  tailorWorkspaceState: {
    accepted: {},
    condensePlan: demoCondensePlan,
    condenseApplied: {},
    compactLevel: 1,
  },
  matchExplanation: demoMatchExplanation,
  activeStep: "tailor",
};
```

The fixture deliberately avoids invented business metrics. Every tailored bullet keeps the original text and adds only a clearer action label.

- [ ] **Step 4: Implement deterministic demo services**

```js
import {
  demoAnalysis,
  demoCondensePlan,
  demoEvidenceDraft,
  demoEvidenceQuestions,
  demoMatchExplanation,
  demoProfile,
  demoTailoredProfile,
} from "../data/demoCase";

const clone = (value) => structuredClone(value);
const resolveFixture = async (fixture, progress, message) => {
  progress?.(message);
  return clone(fixture);
};

export function createDemoServices() {
  return {
    analyzeJD: (_, progress) => resolveFixture(demoAnalysis, progress, "载入演示岗位分析"),
    tailorResume: (_, __, progress) =>
      resolveFixture(demoTailoredProfile, progress, "载入演示定制建议"),
    condenseResume: (_, __, progress) =>
      resolveFixture(demoCondensePlan, progress, "载入演示精简建议"),
    explainMatch: (_, __, ___, progress) =>
      resolveFixture(demoMatchExplanation, progress, "载入演示招聘视角"),
    getEvidenceQuestions: (_, progress) =>
      resolveFixture(demoEvidenceQuestions, progress, "载入演示引导问题"),
    createEvidenceDraft: (_, progress) =>
      resolveFixture(demoEvidenceDraft, progress, "载入演示经历草稿"),
    importResumePDF: (_, progress) =>
      resolveFixture(demoProfile, progress, "演示模式使用脱敏示例简历"),
  };
}
```

- [ ] **Step 5: Run demo-service tests**

Run: `npm test -- src/services/demoResumerApi.test.js`

Expected: 2 tests PASS.

- [ ] **Step 6: Commit demo fixtures and services**

```bash
git add src/data/demoCase.js src/services/demoResumerApi.js src/services/demoResumerApi.test.js
git commit -m "Add isolated graduate demo case"
```

## Task 3: Inject Real or Demo Services

**Files:**
- Create: `src/services/ResumerServicesContext.jsx`
- Modify: `src/components/JDAnalysis.jsx`
- Modify: `src/components/TailorWorkspace.jsx`
- Modify: `src/components/EvidenceCoach.jsx`
- Modify: `src/components/ReviewExport.jsx`
- Modify: `src/components/ResumeImport.jsx`
- Create: `src/services/ResumerServicesContext.test.jsx`

- [ ] **Step 1: Write a failing provider test**

```jsx
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResumerServicesProvider, useResumerServices } from "./ResumerServicesContext";

describe("ResumerServicesProvider", () => {
  it("exposes overridden services", () => {
    const services = { analyzeJD: async () => ({ position: "demo" }) };
    const wrapper = ({ children }) => (
      <ResumerServicesProvider services={services}>{children}</ResumerServicesProvider>
    );
    const { result } = renderHook(() => useResumerServices(), { wrapper });
    expect(result.current.analyzeJD).toBe(services.analyzeJD);
  });
});
```

- [ ] **Step 2: Run the provider test and confirm it fails**

Run: `npm test -- src/services/ResumerServicesContext.test.jsx`

Expected: FAIL because the context module does not exist.

- [ ] **Step 3: Implement the service context**

```jsx
import { createContext, useContext } from "react";
import * as realServices from "./resumerApi";

const ResumerServicesContext = createContext(realServices);

export function ResumerServicesProvider({ services = realServices, children }) {
  return (
    <ResumerServicesContext.Provider value={{ ...realServices, ...services }}>
      {children}
    </ResumerServicesContext.Provider>
  );
}

export function useResumerServices() {
  return useContext(ResumerServicesContext);
}
```

- [ ] **Step 4: Replace direct API imports in each component**

For `JDAnalysis.jsx`:

```jsx
import { useResumerServices } from "../services/ResumerServicesContext";

// inside JDAnalysis
const { analyzeJD } = useResumerServices();
```

Apply the same pattern for:

- `TailorWorkspace`: `tailorResume`, `condenseResume`
- `EvidenceCoach`: `getEvidenceQuestions`, `createEvidenceDraft`
- `ReviewExport`: `explainMatch`
- `ResumeImport`: `importResumePDF`

Remove the corresponding direct imports from `resumerApi.js`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- src/services/ResumerServicesContext.test.jsx`

Expected: provider test PASS.

Run: `npm test`

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit service injection**

```bash
git add src/services/ResumerServicesContext.jsx src/services/ResumerServicesContext.test.jsx src/components/JDAnalysis.jsx src/components/TailorWorkspace.jsx src/components/EvidenceCoach.jsx src/components/ReviewExport.jsx src/components/ResumeImport.jsx
git commit -m "Inject Resumer API services"
```

## Task 4: Isolate Demo State and Add Embedded Workspace Mode

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`
- Modify: `src/components/ProfileForm.jsx`
- Create: `src/App.runtime.test.jsx`

- [ ] **Step 1: Write failing demo-isolation tests**

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App runtime modes", () => {
  beforeEach(() => localStorage.clear());

  it("renders the fictional graduate in demo mode without writing storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<App runtime={{ demoMode: true, embedMode: true }} />);
    expect(screen.getByText("陈雨桐")).toBeInTheDocument();
    await waitFor(() => expect(setItem).not.toHaveBeenCalled());
  });

  it("shows a way to leave the embedded demo", () => {
    render(<App runtime={{ demoMode: true, embedMode: true }} />);
    expect(screen.getByRole("link", { name: "使用自己的简历" })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run the test and confirm current App ignores runtime**

Run: `npm test -- src/App.runtime.test.jsx`

Expected: FAIL because `App` still loads localStorage and does not render the demo exit link.

- [ ] **Step 3: Accept runtime configuration in App**

Change the signature and initialization:

```jsx
export default function App({ runtime = {} }) {
  const { demoMode = false, embedMode = false } = runtime;
  const initialSession = useMemo(
    () => (demoMode ? structuredClone(demoSession) : loadSession()),
    [demoMode],
  );
  const [profile, setProfile] = useState(() =>
    demoMode ? structuredClone(demoProfile) : loadProfile(),
  );
  const [versions, setVersions] = useState(() => (demoMode ? [] : loadVersions()));
```

Guard persistence:

```jsx
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
}, [demoMode, profile, jdText, analysis, tailoredProfile, tailoredSourceSignature,
  tailorWorkspaceState, matchExplanation, activeStep]);
```

Wrap the existing output:

```jsx
const services = useMemo(
  () => (demoMode ? createDemoServices() : undefined),
  [demoMode],
);

return (
  <ResumerServicesProvider services={services}>
    <AppErrorBoundary>
      <Layout embedMode={embedMode} demoMode={demoMode} {...layoutProps}>
        {content}
      </Layout>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </AppErrorBoundary>
  </ResumerServicesProvider>
);
```

- [ ] **Step 4: Add compact embedded layout behavior**

In `Layout.jsx`, when `embedMode` is true:

- Use a 176px sidebar instead of 224px.
- Hide settings, profile/history navigation, and the account card.
- Add a compact “演示模式” label.
- Add `<a href="/" target="_blank" rel="noreferrer">使用自己的简历</a>`.
- Keep the four workflow steps available.
- Reduce header and workspace horizontal padding through an `embedded-workspace` class.

In `ProfileForm.jsx`, accept `demoMode`. Replace the PDF import panel with:

```jsx
{demoMode ? (
  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800">
    当前为脱敏示例资料。你可以编辑字段体验工作流，刷新后会恢复初始内容。
  </div>
) : (
  <ResumeImport onImported={handleImported} notify={notify} />
)}
```

- [ ] **Step 5: Make in-memory version saving explicit**

When `demoMode` is true, `handleSaveVersion` updates the local `versions` state only and shows “演示版本仅在本次浏览中保留”. It must not call `saveVersion`.

- [ ] **Step 6: Run runtime and full tests**

Run: `npm test -- src/App.runtime.test.jsx`

Expected: 2 tests PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit demo runtime support**

```bash
git add src/App.jsx src/components/Layout.jsx src/components/ProfileForm.jsx src/App.runtime.test.jsx
git commit -m "Add isolated embedded demo workspace"
```

## Task 5: Build the Case Study Page

**Files:**
- Create: `src/components/CaseStudyPage.jsx`
- Create: `src/components/CaseStudyPage.test.jsx`
- Create: `src/case-study.css`

- [ ] **Step 1: Write failing content and embed tests**

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CaseStudyPage from "./CaseStudyPage";

describe("CaseStudyPage", () => {
  it("presents the personal product story and interactive demo", () => {
    render(<CaseStudyPage />);
    expect(screen.getByRole("heading", { name: "一个文科生的 AI 产品实验" })).toBeInTheDocument();
    expect(screen.getByText(/为了找一份 AI 产品工作/)).toBeInTheDocument();
    expect(screen.getByTitle("Resumer 应届生演示工作台")).toHaveAttribute(
      "src",
      "/?demo=1&embed=1",
    );
    expect(screen.getByRole("link", { name: "查看 GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/madelainewang-netizen/resumer",
    );
  });

  it("offers a direct product link when the iframe reports an error", () => {
    render(<CaseStudyPage />);
    fireEvent.error(screen.getByTitle("Resumer 应届生演示工作台"));
    expect(screen.getByRole("link", { name: "打开完整产品" })).toHaveAttribute("href", "/?demo=1");
  });
});
```

- [ ] **Step 2: Run the tests and confirm the page is missing**

Run: `npm test -- src/components/CaseStudyPage.test.jsx`

Expected: FAIL because `CaseStudyPage.jsx` does not exist.

- [ ] **Step 3: Implement the semantic page structure**

Build `CaseStudyPage.jsx` from focused internal components:

```jsx
function CaseStudyPage() {
  const [expanded, setExpanded] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  return (
    <div className="case-study-page">
      <CaseNav />
      <main>
        <Hero />
        <Origin />
        <Audience />
        <Research />
        <EvidenceChain />
        <Decisions />
        <ProductDemo
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          failed={frameFailed}
          onError={() => setFrameFailed(true)}
        />
        <IterationTimeline />
        <RoleAndStack />
        <Reflection />
      </main>
      <CaseFooter />
    </div>
  );
}
```

Use the approved copy from `docs/superpowers/specs/2026-06-21-resumer-case-study-design.md`. Keep the target-user and research sections explicit about hypothesis status. Include these exact evidence-chain labels:

```js
const evidenceSteps = ["岗位要求", "经历缺口", "AI 追问", "真实证据", "定制表达"];
```

The demo frame uses:

```jsx
<iframe
  title="Resumer 应届生演示工作台"
  src="/?demo=1&embed=1"
  onError={onError}
  loading="lazy"
/>
```

- [ ] **Step 4: Implement the visual system in `src/case-study.css`**

Define case-study-scoped custom properties:

```css
.case-study-page {
  --case-paper: #fff;
  --case-canvas: #f6f7f8;
  --case-ink: #171717;
  --case-muted: #6b7280;
  --case-line: #e5e7eb;
  --case-blue: #2563eb;
  min-width: 0;
  color: var(--case-ink);
  background: var(--case-paper);
}
```

Add these concrete style groups:

- A sticky translucent case navigation.
- A 45/55 asymmetric hero grid at desktop sizes.
- A workflow preview made from compact resume/JD/evidence cards.
- A horizontal evidence chain on desktop and vertical chain on mobile.
- Hairline card borders, restrained 12–16px radii, and no gradients.
- A 760px default iframe height and `min(90vh, 980px)` expanded height.
- Visible `:focus-visible` states.
- `@media (prefers-reduced-motion: reduce)` to disable entrance transitions.
- Breakpoints at 900px and 640px for single-column layouts.

Use these responsive rules as the baseline:

```css
.case-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1.18fr);
  gap: clamp(48px, 7vw, 104px);
  align-items: center;
  min-height: 760px;
}

.evidence-chain {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.product-demo-frame iframe {
  display: block;
  width: 100%;
  height: 760px;
  border: 0;
}

.product-demo-frame.is-expanded iframe {
  height: min(90vh, 980px);
}

@media (max-width: 900px) {
  .case-hero,
  .case-two-column,
  .case-three-column {
    grid-template-columns: 1fr;
  }
  .evidence-chain {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .case-container {
    width: min(100% - 32px, 1180px);
  }
  .case-hero {
    min-height: auto;
    padding-block: 88px 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .case-study-page *,
  .case-study-page *::before,
  .case-study-page *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Run case-study tests**

Run: `npm test -- src/components/CaseStudyPage.test.jsx`

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the case-study page**

```bash
git add src/components/CaseStudyPage.jsx src/components/CaseStudyPage.test.jsx src/case-study.css
git commit -m "Build Resumer AI product case study"
```

## Task 6: Wire Routes and Preserve Workspace Layout

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`
- Create: `src/main.test.jsx`

- [ ] **Step 1: Write failing entry-selection tests**

Extract a testable function rather than importing `main.jsx` with root side effects:

```jsx
import { describe, expect, it } from "vitest";
import { selectRootView } from "./main";

describe("selectRootView", () => {
  it("selects case study view", () => {
    expect(selectRootView({ page: "case-study" }).type.name).toBe("CaseStudyPage");
  });

  it("passes runtime to workspace", () => {
    const view = selectRootView({ page: "workspace", demoMode: true, embedMode: true });
    expect(view.props.runtime).toEqual({ demoMode: true, embedMode: true });
  });
});
```

- [ ] **Step 2: Run the test and confirm the selector is missing**

Run: `npm test -- src/main.test.jsx`

Expected: FAIL because `selectRootView` is not exported.

- [ ] **Step 3: Wire the runtime selector**

```jsx
import CaseStudyPage from "./components/CaseStudyPage";
import { parseAppRuntime } from "./runtime/appRuntime";
import "./case-study.css";

export function selectRootView(runtime) {
  if (runtime.page === "case-study") return <CaseStudyPage />;
  return <App runtime={runtime} />;
}

const runtime = parseAppRuntime(window.location.pathname, window.location.search);
createRoot(document.getElementById("root")).render(
  <StrictMode>{selectRootView(runtime)}</StrictMode>,
);
```

- [ ] **Step 4: Remove global desktop minimum width**

Change the base rules in `styles.css`:

```css
html,
body {
  min-width: 0;
}

.app-shell {
  min-width: 1120px;
}

.app-shell.embedded-workspace {
  min-width: 940px;
}
```

This keeps the existing desktop workspace unchanged while allowing `/case-study` to be responsive.

- [ ] **Step 5: Run entry and full tests**

Run: `npm test -- src/main.test.jsx`

Expected: 2 tests PASS.

Run: `npm test`

Expected: all test files PASS.

- [ ] **Step 6: Commit route wiring**

```bash
git add src/main.jsx src/main.test.jsx src/styles.css
git commit -m "Route Resumer case study and demo modes"
```

## Task 7: Document, Build, and Visually Verify

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document local URLs**

Add:

```md
## 产品案例页

- 工作台：`http://localhost:5173/`
- AI 产品案例：`http://localhost:5173/case-study`
- 脱敏演示工作台：`http://localhost:5173/?demo=1&embed=1`

演示模式使用内置虚构数据，不读取或写入本地简历，也不会调用 AI API。
```

- [ ] **Step 2: Run full automated verification**

Run: `npm test`

Expected: all tests PASS with zero failures.

Run: `npm run build`

Expected: Vite production build exits 0.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 3: Start the local app**

Run: `npm run dev`

Expected: development server available at `http://localhost:5173` and API proxy available from the same process.

- [ ] **Step 4: Verify in the in-app browser**

Open and inspect:

- `http://localhost:5173/case-study` at desktop width.
- `http://localhost:5173/case-study` at mobile width.
- `http://localhost:5173/?demo=1&embed=1`.
- `http://localhost:5173/`.

Confirm:

- No horizontal overflow on the case-study page.
- Hero hierarchy and evidence chain remain legible.
- Demo iframe loads the fictional graduate and can navigate all four steps.
- Editing demo content does not alter the standard workspace after refresh.
- Expand/new-window actions work.
- The standard workspace layout and persisted data remain unchanged.

- [ ] **Step 5: Capture local QA screenshots**

Save desktop and mobile screenshots under `/tmp/resumer-case-study-qa/` for review only. Do not commit them.

- [ ] **Step 6: Commit documentation**

```bash
git add README.md
git commit -m "Document Resumer case study preview"
```

## Final Verification

- [ ] Run `npm test` and confirm zero failures.
- [ ] Run `npm run build` and confirm exit code 0.
- [ ] Run `git status --short` and confirm only intentional changes remain.
- [ ] Open `/case-study`, `/?demo=1&embed=1`, and `/` in the browser for final regression review.
- [ ] Confirm the case-study copy distinguishes user hypotheses from validated findings.
- [ ] Confirm no demo action calls `/api/*` and no demo action writes `resumer.*` localStorage keys.
