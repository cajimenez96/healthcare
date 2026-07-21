import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { User } from "./User";

describe("User model", () => {
  beforeAll(async () => {
    await connectToDatabase();
    await User.init();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires name, email and phone", async () => {
    const error = await getValidationError(new User({}));

    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.phone).toBeDefined();
  });

  it("creates a valid user", async () => {
    const user = await User.create({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+5491122334455",
    });

    expect(user.name).toBe("Jane Doe");
    expect(user.email).toBe("jane@example.com");
  });

  it("rejects a duplicate email", async () => {
    await User.create({ name: "A", email: "dup@example.com", phone: "+1" });

    await expect(
      User.create({ name: "B", email: "dup@example.com", phone: "+2" }),
    ).rejects.toThrow();
  });
});
