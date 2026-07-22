import { describe, it, expect, beforeEach, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";

describe("connectToDatabase", () => {
  const originalUri = process.env.MONGODB_URI;

  beforeEach(() => {
    global._mongooseCache = undefined;
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalUri;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("throws when MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectToDatabase()).rejects.toThrow(
      "MONGODB_URI environment variable is not defined",
    );
  });

  it("connects to the database using MONGODB_URI", async () => {
    const conn = await connectToDatabase();
    const expectedDbName = new URL(process.env.MONGODB_URI!).pathname.slice(1);

    expect(conn.connection.readyState).toBe(1);
    expect(conn.connection.name).toBe(expectedDbName);
  });

  it("returns the same cached connection on subsequent calls", async () => {
    const conn1 = await connectToDatabase();
    const conn2 = await connectToDatabase();

    expect(conn1).toBe(conn2);
  });
});
