import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "../db/mongodb";
import { User } from "../db/models/User";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { authenticateCredentials } from "./authenticateCredentials";

describe("authenticateCredentials", () => {
  const userRepository = new MongoUserRepository();
  const correctPassword = "correct-horse-battery-staple";
  let hashedPassword: string;

  beforeAll(async () => {
    await connectToDatabase();
    await User.init();
    hashedPassword = await bcrypt.hash(correctPassword, 10);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("returns null when email is missing", async () => {
    const result = await authenticateCredentials(
      undefined,
      correctPassword,
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("returns null when password is missing", async () => {
    const result = await authenticateCredentials(
      "staff@example.com",
      undefined,
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("returns null when no user matches the email", async () => {
    const result = await authenticateCredentials(
      "missing@example.com",
      correctPassword,
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("returns null when the user has no password set (e.g. a patient account)", async () => {
    await userRepository.create({
      name: "Patient",
      email: "patient@example.com",
      phone: "+1",
    });

    const result = await authenticateCredentials(
      "patient@example.com",
      correctPassword,
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("returns null when the password does not match", async () => {
    await userRepository.create({
      name: "Staff",
      email: "staff@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword,
    });

    const result = await authenticateCredentials(
      "staff@example.com",
      "wrong-password",
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("returns the user when credentials are valid", async () => {
    await userRepository.create({
      name: "Staff",
      email: "staff@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword,
    });

    const result = await authenticateCredentials(
      "staff@example.com",
      correctPassword,
      userRepository,
    );

    expect(result).toEqual({
      id: expect.any(String),
      name: "Staff",
      email: "staff@example.com",
      role: "Administrador",
    });
  });

  it("includes doctorId for a linked Doctor-role user", async () => {
    const doctorId = new mongoose.Types.ObjectId().toString();
    await userRepository.create({
      name: "Dr. Cameron",
      email: "drcameron@example.com",
      phone: "+1",
      role: "Doctor",
      hashedPassword,
      doctorId,
    });

    const result = await authenticateCredentials(
      "drcameron@example.com",
      correctPassword,
      userRepository,
    );

    expect(result?.doctorId).toBe(doctorId);
  });
});
