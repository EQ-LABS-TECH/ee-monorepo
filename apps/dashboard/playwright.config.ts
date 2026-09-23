import { defineConfig } from "@playwright/test";
import base from "@eq-labs/config-playwright/base";

export default defineConfig({
  ...base,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:5173",
  },

  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
