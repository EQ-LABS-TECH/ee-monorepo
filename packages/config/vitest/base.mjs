import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    clearMocks: true,
    restoreMocks: true,

    include: [
      "**/__tests__/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx}",
      "**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx}",
    ],

    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/lib/**",
      "**/out/**",
      "**/bin/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],

    coverage: {
      provider: "v8",

      include: ["src/**/*.{js,jsx,mjs,cjs,ts,tsx}"],

      exclude: [
        "src/**/*.d.ts",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "**/.turbo/**",
      ],

      reportsDirectory: "coverage",
    },
  },
});
