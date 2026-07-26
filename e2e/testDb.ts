// Pure function of MONGODB_URI — deterministic, no side effects, so both
// playwright.config.ts's webServer.env and e2e/global-setup.ts can compute
// the identical isolated e2e URI independently, with no dependency on
// which one runs first (see TASK-014: the e2e suite must never touch the
// same database as `pnpm dev`, same rationale as vitest.setup.ts's "-test"
// suffix for TASK-005, but "-e2e" here so the two suites never collide
// with each other either).
export function getE2eMongoUri(): string {
  const base = process.env.MONGODB_URI;
  if (!base) {
    throw new Error("MONGODB_URI must be set in .env.local to run the e2e suite");
  }
  return base.replace(/\/([^/?]+)(\?|$)/, "/$1-e2e$2");
}
