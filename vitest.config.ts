import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
    environmentMatchGlobs: [["src/**/*.test.{ts,tsx}", "jsdom"]],
    setupFiles: ["./src/test/setup.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
