import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ResumerServicesProvider,
  useResumerServices,
} from "./ResumerServicesContext";

describe("ResumerServicesProvider", () => {
  it("returns supplied service overrides from useResumerServices", () => {
    const analyzeJD = vi.fn();
    const wrapper = ({ children }) => (
      <ResumerServicesProvider services={{ analyzeJD }}>
        {children}
      </ResumerServicesProvider>
    );

    const { result } = renderHook(() => useResumerServices(), { wrapper });

    expect(result.current.analyzeJD).toBe(analyzeJD);
  });
});
