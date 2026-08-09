import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest needs the `@/` alias spelled out.
 *
 * Next resolves it from tsconfig `paths`, but Vitest does not read tsconfig for
 * module resolution — so the first test to import a module that uses `@/`
 * failed to resolve while the app built fine. Kept in step with the `paths`
 * entry in tsconfig.json.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
