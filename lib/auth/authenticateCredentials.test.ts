import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { User } from "../db/models/User";
import { connectToDatabase } from "../db/mongodb";
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

  it("returns null when the user is explicitly deactivated (isActive: false)", async () => {
    await userRepository.create({
      name: "Deactivated Staff",
      email: "deactivated@example.com",
      phone: "+1",
      role: "Doctor",
      hashedPassword,
      isActive: false,
    });

    const result = await authenticateCredentials(
      "deactivated@example.com",
      correctPassword,
      userRepository,
    );

    expect(result).toBeNull();
  });

  it("allows login when isActive is undefined (pre-existing users created before this field existed must not be locked out)", async () => {
    await User.create({
      name: "Legacy Staff",
      email: "legacy@example.com",
      phone: "+1",
      role: "Administrador",
      hashedPassword,
    });
    // Simulate a document persisted before the isActive field existed: strip
    // it out at the storage layer so it reads back as undefined, not the
    // schema default (`true`) that only applies on document creation.
    await User.collection.updateOne(
      { email: "legacy@example.com" },
      { $unset: { isActive: "" } },
    );

    const result = await authenticateCredentials(
      "legacy@example.com",
      correctPassword,
      userRepository,
    );

    expect(result).not.toBeNull();
    expect(result?.email).toBe("legacy@example.com");
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
