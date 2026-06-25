/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery, useViewportWidth } from "./useMediaQuery";

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();

  window.matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: () => void) => {
      listeners.add(cb);
    },
    removeEventListener: (_: string, cb: () => void) => {
      listeners.delete(cb);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })) as typeof window.matchMedia;

  return {
    setMatches(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb());
    },
  };
}

describe("useMediaQuery", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns matchMedia result on the client", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);

    act(() => {
      media.setMatches(true);
    });
    expect(result.current).toBe(true);
  });
});

describe("useViewportWidth", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });
    window.visualViewport = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as VisualViewport;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns window inner width", () => {
    const { result } = renderHook(() => useViewportWidth());
    expect(result.current).toBe(1024);
  });

  it("updates on window resize", () => {
    const { result } = renderHook(() => useViewportWidth());
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(375);
  });
});
