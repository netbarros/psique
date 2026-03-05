import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["test/unit/**/*.test.ts"],
      coverage: {
        enabled: true,
        provider: "v8",
        include: ["lib/utils.ts"],
        thresholds: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
  })
);
