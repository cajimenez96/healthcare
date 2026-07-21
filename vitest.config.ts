import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Multiple test files now exercise the same collections (User, Patient,
    // Appointment) against the one real local MongoDB instance via
    // deleteMany()-based cleanup. Running files in parallel causes one
    // file's cleanup to race another file's assertions. Run files
    // sequentially to keep the shared-database integration tests reliable.
    fileParallelism: false,
  },
});
