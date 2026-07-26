import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import bcrypt from "bcryptjs";

import { DEFAULT_INSURANCE_PROVIDER } from "../constants";
import { connectToDatabase } from "../lib/db/mongodb";
import { MongoInsuranceProviderRepository } from "../lib/db/repositories/MongoInsuranceProviderRepository";
import { MongoTreatmentRepository } from "../lib/db/repositories/MongoTreatmentRepository";
import { MongoUserRepository } from "../lib/db/repositories/MongoUserRepository";
import { BASE_TREATMENTS } from "../lib/seedData/baseTreatments";
import { getE2eMongoUri } from "./testDb";

// Seeds the isolated e2e database (see e2e/testDb.ts) with the fixed
// baseline data every spec relies on: the Administrador account (from
// .env.local, same credentials used against the real dev database), a
// fixed Secretaria account (no UI flow creates this role yet — see
// TASK-020), the default insurance provider, and the base nomenclador.
// Mirrors scripts/seed-admin.ts / scripts/seed-nomenclador.ts /
// scripts/qa-seed-secretaria.ts, but inlined here (not imported) because
// those scripts call mongoose.disconnect() and process.exit() as CLI
// entry points — importing them would trigger that as a side effect of
// grabbing one exported value. Everything below is idempotent, safe to
// re-run.
const SECRETARIA_EMAIL = "qa.secretaria@test.local";
const SECRETARIA_PASSWORD = "QaSecretaria123!";

async function globalSetup() {
  process.env.MONGODB_URI = getE2eMongoUri();
  await connectToDatabase();

  const userRepository = new MongoUserRepository();

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local to run the e2e suite",
    );
  }

  if (!(await userRepository.findByEmail(adminEmail))) {
    await userRepository.create({
      name: process.env.SEED_ADMIN_NAME || "Administrador",
      email: adminEmail,
      phone: "N/A",
      role: "Administrador",
      hashedPassword: await bcrypt.hash(adminPassword, 10),
    });
  }

  if (!(await userRepository.findByEmail(SECRETARIA_EMAIL))) {
    await userRepository.create({
      name: "QA Secretaria",
      email: SECRETARIA_EMAIL,
      phone: "N/A",
      role: "Secretaria",
      hashedPassword: await bcrypt.hash(SECRETARIA_PASSWORD, 10),
    });
  }

  const insuranceProviderRepository = new MongoInsuranceProviderRepository();
  await insuranceProviderRepository.create(DEFAULT_INSURANCE_PROVIDER);

  const treatmentRepository = new MongoTreatmentRepository();
  const existingNames = new Set(
    (await treatmentRepository.findAll()).map((t) => t.name),
  );
  for (const treatment of BASE_TREATMENTS) {
    if (!existingNames.has(treatment.name)) {
      await treatmentRepository.create(treatment);
    }
  }

  // Deliberately not disconnecting: globalSetup and globalTeardown run in
  // the same Playwright root process and share connectToDatabase()'s
  // module-level cache. Disconnecting here would leave that cache holding
  // a dead connection object that globalTeardown's own connectToDatabase()
  // call would get back verbatim (its cache-hit short-circuit doesn't know
  // the connection was closed), hanging on dropDatabase(). globalTeardown
  // reuses this same live connection and disconnects once, at the end.
}

export default globalSetup;
