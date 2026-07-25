import bcrypt from "bcryptjs";
import { config } from "dotenv";
import mongoose from "mongoose";

import { connectToDatabase } from "../lib/db/mongodb";
import { MongoUserRepository } from "../lib/db/repositories/MongoUserRepository";
config({ path: ".env.local" });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "Administrador";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local",
    );
  }

  await connectToDatabase();

  const userRepository = new MongoUserRepository();
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    console.log(`Admin user "${email}" already exists (id: ${existing.id}). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    name,
    email,
    phone: "N/A",
    role: "Administrador",
    hashedPassword,
  });

  console.log(`Created admin user "${user.email}" (id: ${user.id}).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed admin user:", error.message);
  process.exit(1);
});
