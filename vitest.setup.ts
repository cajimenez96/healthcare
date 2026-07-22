import { config } from "dotenv";

config({ path: ".env.local" });

// Tests must never touch the dev database — running the suite deletes
// collections in afterEach/afterAll cleanup, which would wipe real/seeded
// data (this is exactly what happened to the seeded admin user before this
// fix). Redirect to a sibling "-test" database instead.
if (process.env.MONGODB_URI) {
  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(
    /\/([^/?]+)(\?|$)/,
    "/$1-test$2",
  );
}
