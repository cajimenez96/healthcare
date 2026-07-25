import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} for QA e2e run`);
  }
  return value;
}

export const ADMIN_CREDENTIALS = {
  email: required("SEED_ADMIN_EMAIL"),
  password: required("SEED_ADMIN_PASSWORD"),
};

// Created by scripts/qa-seed-secretaria.ts — QA-only, not a production account.
export const SECRETARIA_CREDENTIALS = {
  email: "qa.secretaria@test.local",
  password: "QaSecretaria123!",
};

// Created live during the DOC flows (ADM-06 "Crear acceso"), unique per run
// so re-running the suite doesn't collide on the unique email index.
const runId = Date.now();
export const DOCTOR_CREDENTIALS = {
  email: `qa.doctor.${runId}@test.local`,
  password: "QaDoctor123!",
};

export const RUN_ID = runId;
