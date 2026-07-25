import bcrypt from "bcryptjs";
import { config } from "dotenv";
import mongoose from "mongoose";

import { connectToDatabase } from "../lib/db/mongodb";
import { MongoUserRepository } from "../lib/db/repositories/MongoUserRepository";
config({ path: ".env.local" });

// QA-only seed script: creates a Secretaria staff user directly in Mongo,
// since there is no UI flow to create this role (see docs/TESTING.md §3).
const QA_SECRETARIA_EMAIL = "qa.secretaria@test.local";
const QA_SECRETARIA_PASSWORD = "QaSecretaria123!";
const QA_SECRETARIA_NAME = "QA Secretaria";

async function main() {
  await connectToDatabase();

  const userRepository = new MongoUserRepository();
  const existing = await userRepository.findByEmail(QA_SECRETARIA_EMAIL);
  if (existing) {
    console.log(
      `Secretaria user "${QA_SECRETARIA_EMAIL}" already exists (id: ${existing.id}). Skipping.`,
    );
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(QA_SECRETARIA_PASSWORD, 10);
  const user = await userRepository.create({
    name: QA_SECRETARIA_NAME,
    email: QA_SECRETARIA_EMAIL,
    phone: "N/A",
    role: "Secretaria",
    hashedPassword,
  });

  console.log(`Created Secretaria user "${user.email}" (id: ${user.id}).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed QA Secretaria user:", error.message);
  process.exit(1);
});
