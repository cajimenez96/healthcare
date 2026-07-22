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

  it("defaults role to Paciente when omitted", async () => {
    const user = await User.create({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+5491122334455",
    });

    expect(user.role).toBe("Paciente");
  });

  it("rejects an invalid role value", async () => {
    const error = await getValidationError(
      new User({
        name: "A",
        email: "a@example.com",
        phone: "+1",
        role: "Cleaner",
      }),
    );

    expect(error.errors.role).toBeDefined();
  });

  it("accepts a staff role with a hashed password", async () => {
    const user = await User.create({
      name: "Staff",
      email: "staff@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
    });

    expect(user.role).toBe("Administrador");
  });

  it("excludes hashedPassword from default queries", async () => {
    await User.create({
      name: "Staff",
      email: "staff2@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
    });

    const found = await User.findOne({ email: "staff2@example.com" });

    expect(found?.hashedPassword).toBeUndefined();
  });

  it("includes hashedPassword when explicitly selected", async () => {
    await User.create({
      name: "Staff",
      email: "staff3@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
    });

    const found = await User.findOne({ email: "staff3@example.com" }).select(
      "+hashedPassword",
    );

    expect(found?.hashedPassword).toBe("$2a$10$abcdefghijklmnopqrstuv");
  });
});
