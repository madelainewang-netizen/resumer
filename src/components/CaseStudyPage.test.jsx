import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import CaseStudyPage from "./CaseStudyPage";

describe("CaseStudyPage", () => {
  afterEach(cleanup);

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

  it("reserves evidence blue for the product workflow", () => {
    const css = readFileSync("src/case-study.css", "utf8");
    const genericInteractionCss = css.slice(
      0,
      css.indexOf(".case-study-page .workflow-miniature"),
    );

    expect(genericInteractionCss).not.toMatch(
      /var\(--case-blue\)|rgba\(37,\s*99,\s*235/i,
    );
  });
});
