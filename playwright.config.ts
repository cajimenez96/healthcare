import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

import { getE2eMongoUri } from "./e2e/testDb";

loadEnv({ path: ".env.local" });

// Isolated port + database (TASK-014): the e2e suite spawns its own `next
// dev`, pointed at a "-e2e" sibling database (see e2e/testDb.ts), on a
// different port than the developer's own `pnpm dev` (3000) so the two can
// run at the same time without ever touching each other's data.
const E2E_PORT = 3100;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // Generous timeouts: this runs against a real `next dev` server, where
  // each route compiles on-demand the first time it's hit (can take 15-30s
  // for a heavier page). Every route is only ever cold once per run.
  timeout: 120_000,
  expect: { timeout: 45_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 45_000,
    navigationTimeout: 45_000,
  },
  webServer: {
    command: `pnpm exec next dev -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      MONGODB_URI: getE2eMongoUri(),
      NEXTAUTH_URL: E2E_BASE_URL,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
