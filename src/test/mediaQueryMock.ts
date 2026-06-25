import { vi } from "vitest";

let defaultMatches = false;
const queryMatches = new Map<string, boolean>();

export const mediaQueryMock = {
  viewportWidth: 1024,

  reset() {
    defaultMatches = false;
    queryMatches.clear();
    this.viewportWidth = 1024;
  },

  setMatches(value: boolean) {
    defaultMatches = value;
  },

  setQuery(query: string, value: boolean) {
    queryMatches.set(query, value);
  },
};

vi.mock("@/lib/useMediaQuery", () => ({
  useMediaQuery: (query: string) =>
    queryMatches.has(query) ? queryMatches.get(query)! : defaultMatches,
  useViewportWidth: () => mediaQueryMock.viewportWidth,
}));
