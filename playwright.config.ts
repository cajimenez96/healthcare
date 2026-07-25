import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  // Generous timeouts: this runs against a real `next dev` server, where
  // each route compiles on-demand the first time it's hit (can take 15-30s
  // for a heavier page). Every route is only ever cold once per run.
  timeout: 120_000,
  expect: { timeout: 45_000 },
  use: {
    baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 45_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
