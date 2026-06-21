import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App runtime modes", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads the isolated fictional demo without writing to storage", async () => {
    vi.useFakeTimers();
    const setItem = vi.spyOn(localStorage, "setItem");

    render(<App runtime={{ demoMode: true, embedMode: true }} />);

    expect(screen.getByText("陈雨桐")).toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  it("links from the embedded demo to the standard workspace", () => {
    render(<App runtime={{ demoMode: true, embedMode: true }} />);

    expect(screen.getByRole("link", { name: "使用自己的简历" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
