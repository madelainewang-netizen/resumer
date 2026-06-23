import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import CaseStudyPage from "./CaseStudyPage";

const READY_MESSAGE = { type: "resumer-demo-ready" };

function dispatchReadyMessage(frame, overrides = {}) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: READY_MESSAGE,
      origin: window.location.origin,
      source: frame.contentWindow,
      ...overrides,
    }),
  );
}

describe("CaseStudyPage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("presents the personal product story and interactive demo", () => {
    render(<CaseStudyPage />);

    expect(
      screen.getByRole("heading", { name: "一次求职中的 AI 产品实验" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/根据每个 JD 针对性修改简历/)).toBeInTheDocument();
    expect(screen.getByTitle("Resumer 应届生演示工作台")).toHaveAttribute(
      "src",
      "/?demo=1&embed=1",
    );
    expect(screen.getByTitle("Resumer 应届生演示工作台")).toHaveAttribute(
      "loading",
      "lazy",
    );
    expect(screen.getByRole("link", { name: "查看 GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/madelainewang-netizen/resumer",
    );
  });

  it("describes the demo evidence without fabricated metrics", () => {
    render(<CaseStudyPage />);

    expect(
      screen.getByText(
        "整理用户反馈与内容数据，按场景归纳问题清单，支持产品团队讨论内测优化优先级。",
      ),
    ).toBeInTheDocument();
  });

  it("offers a direct product link when the iframe reports an error", () => {
    render(<CaseStudyPage />);

    fireEvent.error(screen.getByTitle("Resumer 应届生演示工作台"));

    expect(screen.getByRole("link", { name: "打开完整产品" })).toHaveAttribute(
      "href",
      "/?demo=1",
    );
    expect(screen.getByRole("link", { name: "打开完整产品" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "打开完整产品" })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
  });

  it("offers the fallback when a loaded iframe does not report ready within eight seconds", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    const frame = screen.getByTitle("Resumer 应届生演示工作台");
    fireEvent.load(frame);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole("link", { name: "打开完整产品" })).toBeInTheDocument();
  });

  it("times out after the lazy demo approaches the viewport even without iframe load", async () => {
    vi.useFakeTimers();
    let observerCallback;
    const observe = vi.fn();
    const disconnect = vi.fn();
    const IntersectionObserverMock = vi.fn(function IntersectionObserver(callback) {
      observerCallback = callback;
      this.observe = observe;
      this.disconnect = disconnect;
    });
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    render(<CaseStudyPage />);

    expect(observe).toHaveBeenCalledWith(
      screen.getByTitle("Resumer 应届生演示工作台"),
    );
    observerCallback([{ isIntersecting: true, intersectionRatio: 1 }]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole("link", { name: "打开完整产品" })).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });

  it("keeps the iframe available after a valid readiness message", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    const frame = screen.getByTitle("Resumer 应届生演示工作台");
    fireEvent.load(frame);
    dispatchReadyMessage(frame);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByTitle("Resumer 应届生演示工作台")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "打开完整产品" })).not.toBeInTheDocument();
  });

  it("does not arm the watchdog when readiness arrives before iframe load", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    const frame = screen.getByTitle("Resumer 应届生演示工作台");
    dispatchReadyMessage(frame);
    fireEvent.load(frame);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.queryByRole("link", { name: "打开完整产品" })).not.toBeInTheDocument();
  });

  it("ignores readiness messages with the wrong origin, source, or type", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    const frame = screen.getByTitle("Resumer 应届生演示工作台");
    fireEvent.load(frame);
    dispatchReadyMessage(frame, { origin: "https://example.com" });
    dispatchReadyMessage(frame, { source: window });
    dispatchReadyMessage(frame, { data: { type: "another-message" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole("link", { name: "打开完整产品" })).toBeInTheDocument();
  });

  it("fails immediately after a valid embedded error message", () => {
    render(<CaseStudyPage />);

    const frame = screen.getByTitle("Resumer 应届生演示工作台");
    act(() => {
      dispatchReadyMessage(frame, { data: { type: "resumer-demo-error" } });
    });

    expect(screen.getByRole("link", { name: "打开完整产品" })).toBeInTheDocument();
  });

  it("expands and collapses the embedded product workspace", () => {
    render(<CaseStudyPage />);

    const frame = screen.getByTestId("product-demo-frame");
    const toggle = screen.getByRole("button", { name: "展开体验" });

    fireEvent.click(toggle);
    expect(frame).toHaveClass("is-expanded");
    expect(screen.getByRole("button", { name: "收起体验" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "收起体验" }));
    expect(frame).not.toHaveClass("is-expanded");
  });

  it("keeps the expanded demo at least as tall as its default height", () => {
    const css = readFileSync("src/case-study.css", "utf8");

    expect(css).toMatch(
      /\.product-demo-frame\.is-expanded iframe\s*\{[^}]*height:\s*clamp\(760px,\s*90vh,\s*980px\)/s,
    );
  });

  it("gives large Chinese headings room to wrap without orphan lines", () => {
    const css = readFileSync("src/case-study.css", "utf8");

    expect(css).toMatch(
      /\.case-study-page \.case-section-intro\s*\{[^}]*max-width:\s*1040px/s,
    );
    expect(css).toMatch(
      /\.case-study-page \.case-hero h1,\s*\.case-study-page \.case-section-intro h2\s*\{[^}]*text-wrap:\s*balance/s,
    );
    expect(css).toMatch(
      /\.case-study-page \.reflection-grid h3\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.case-study-page \.reflection-grid h3\s*\{[^}]*white-space:\s*normal/s,
    );
  });

  it("reserves blue for explicitly evidence-semantic selectors", () => {
    const css = readFileSync("src/case-study.css", "utf8");
    const cssWithoutTokenDefinition = css.replace("--case-blue: #2563eb;", "");
    const bluePattern = /var\(--case-blue\)|rgba\(37,\s*99,\s*235|#2563eb|#1e4eaa/i;
    const blueSelectors = [...cssWithoutTokenDefinition.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , declarations]) => bluePattern.test(declarations))
      .flatMap(([, selectors]) => selectors.split(",").map((selector) => selector.trim()));

    const evidenceSelectors = [
      ".case-study-page .workflow-arrow",
      ".case-study-page .mini-gap-row .mini-question-card",
      ".case-study-page .mini-question-card p",
      ".case-study-page .mini-evidence-card",
      ".case-study-page .mini-evidence-head .mini-card-label",
      ".case-study-page .mini-verified",
      ".case-study-page .mini-evidence-card p strong",
      ".case-study-page .evidence-chain li::before",
      ".case-study-page .evidence-node span",
      ".case-study-page .evidence-copy h3",
    ];

    expect(new Set(blueSelectors)).toEqual(new Set(evidenceSelectors));
  });
});

describe("embedded App readiness", () => {
  it("notifies its parent after the embedded app mounts", () => {
    const parentDescriptor = Object.getOwnPropertyDescriptor(window, "parent");
    const parent = { postMessage: vi.fn() };
    Object.defineProperty(window, "parent", { configurable: true, value: parent });

    try {
      render(<App runtime={{ demoMode: true, embedMode: true }} />);

      expect(parent.postMessage).toHaveBeenCalledWith(
        READY_MESSAGE,
        window.location.origin,
      );
    } finally {
      cleanup();
      Object.defineProperty(window, "parent", parentDescriptor);
    }
  });

  it("reports errors caught while committing the embedded workspace tree", async () => {
    const { AppErrorBoundary } = await import("../App");
    expect(AppErrorBoundary).toBeTypeOf("function");
    const onError = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    function BrokenWorkspace() {
      throw new Error("embedded workspace failed");
    }

    render(
      <AppErrorBoundary onError={onError}>
        <BrokenWorkspace />
      </AppErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "embedded workspace failed" }),
      expect.any(Object),
    );
  });
});
