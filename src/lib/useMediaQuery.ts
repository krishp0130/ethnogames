"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * SSR-safe media query hook. Uses `useSyncExternalStore` so the correct value
 * is available on the first client paint (avoids mobile layout flash).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => getSnapshot(query),
    getServerSnapshot
  );
}

/** Viewport inner width in CSS pixels; 0 during SSR. */
export function useViewportWidth(): number {
  return useSyncExternalStore(
    (onChange) => {
      const handler = () => onChange();
      window.addEventListener("resize", handler, { passive: true });
      window.visualViewport?.addEventListener("resize", handler);
      return () => {
        window.removeEventListener("resize", handler);
        window.visualViewport?.removeEventListener("resize", handler);
      };
    },
    () => window.innerWidth,
    () => 0
  );
}
