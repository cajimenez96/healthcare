import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongodb";

async function main() {
  console.log(`Connecting to ${process.env.MONGODB_URI}...`);
  const conn = await connectToDatabase();
  console.log(`Connected to database "${conn.connection.name}" (readyState: ${conn.connection.readyState})`);
  await mongoose.disconnect();
  console.log("Disconnected cleanly.");
}

main().catch((error) => {
  console.error("Database connection failed:", error.message);
  process.exit(1);
});
