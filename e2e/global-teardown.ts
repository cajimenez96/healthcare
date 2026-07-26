import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import mongoose from "mongoose";

import { connectToDatabase } from "../lib/db/mongodb";
import { getE2eMongoUri } from "./testDb";

// Drops the isolated e2e database entirely after each run, so every run
// starts from the same clean slate (global-setup re-seeds it) instead of
// accumulating qa.* doctors/patients/appointments across runs.
async function globalTeardown() {
  process.env.MONGODB_URI = getE2eMongoUri();
  const conn = await connectToDatabase();
  await conn.connection.dropDatabase();
  await mongoose.disconnect();
}

export default globalTeardown;
