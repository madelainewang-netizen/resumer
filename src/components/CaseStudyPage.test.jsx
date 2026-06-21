import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import CaseStudyPage from "./CaseStudyPage";

describe("CaseStudyPage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("presents the personal product story and interactive demo", () => {
    render(<CaseStudyPage />);

    expect(
      screen.getByRole("heading", { name: "一个文科生的 AI 产品实验" }),
    ).toBeInTheDocument();
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

  it("offers the fallback when the iframe does not load within eight seconds", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole("link", { name: "打开完整产品" })).toBeInTheDocument();
  });

  it("clears the watchdog after the iframe loads", async () => {
    vi.useFakeTimers();
    render(<CaseStudyPage />);

    fireEvent.load(screen.getByTitle("Resumer 应届生演示工作台"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByTitle("Resumer 应届生演示工作台")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "打开完整产品" })).not.toBeInTheDocument();
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
