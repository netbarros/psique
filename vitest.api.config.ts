import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["test/api/**/*.test.ts"],
      coverage: {
        provider: "v8",
        include: ["app/api/**/*.ts"],
        thresholds: {
          statements: 85,
          branches: 75,
          functions: 85,
          lines: 85,
        },
      },
    },
  })
);
