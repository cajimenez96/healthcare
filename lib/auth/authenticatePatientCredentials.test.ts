import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { User } from "../db/models/User";
import { connectToDatabase } from "../db/mongodb";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";

import { authenticatePatientCredentials } from "./authenticatePatientCredentials";

describe("authenticatePatientCredentials", () => {
  const userRepository = new MongoUserRepository();
  const correctPin = "1234";
  let hashedPin: string;

  beforeAll(async () => {
    await connectToDatabase();
    await User.init();
    hashedPin = await bcrypt.hash(correctPin, 10);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("returns null when identificationNumber is missing", async () => {
    const result = await authenticatePatientCredentials(undefined, correctPin, userRepository);
    expect(result).toBeNull();
  });

  it("returns null when pin is missing", async () => {
    const result = await authenticatePatientCredentials("30111222", undefined, userRepository);
    expect(result).toBeNull();
  });

  it("returns null when no user matches the identificationNumber", async () => {
    const result = await authenticatePatientCredentials("30111222", correctPin, userRepository);
    expect(result).toBeNull();
  });

  it("returns null when the pin does not match", async () => {
    await userRepository.create({
      name: "Paciente",
      email: "paciente@example.com",
      phone: "+1",
      role: "Paciente",
      identificationNumber: "30111222",
      hashedPassword: hashedPin,
    });

    const result = await authenticatePatientCredentials("30111222", "9999", userRepository);
    expect(result).toBeNull();
  });

  it("returns null for a matching identificationNumber that isn't a Paciente (defense in depth)", async () => {
    await userRepository.create({
      name: "Staff",
      email: "staff@example.com",
      phone: "+1",
      role: "Administrador",
      identificationNumber: "30111222",
      hashedPassword: hashedPin,
    });

    const result = await authenticatePatientCredentials("30111222", correctPin, userRepository);
    expect(result).toBeNull();
  });

  it("returns the user when credentials are valid", async () => {
    await userRepository.create({
      name: "Paciente",
      email: "paciente@example.com",
      phone: "+1",
      role: "Paciente",
      identificationNumber: "30111222",
      hashedPassword: hashedPin,
    });

    const result = await authenticatePatientCredentials("30111222", correctPin, userRepository);

    expect(result).toEqual({
      id: expect.any(String),
      name: "Paciente",
      email: "paciente@example.com",
      role: "Paciente",
    });
  });
});
