import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { connectToDatabase } from "../mongodb";

import { Patient } from "./Patient";
import { getValidationError } from "./testHelpers";

const validPatient = {
  userId: new mongoose.Types.ObjectId(),
  name: "John Doe",
  email: "john@example.com",
  phone: "+5491122334455",
  birthDate: new Date("1990-01-01"),
  gender: "Male" as const,
  address: "123 Main St",
  occupation: "Engineer",
  emergencyContactName: "Jane Doe",
  emergencyContactNumber: "+5491122334456",
  primaryPhysician: "Dr. Cameron",
  insuranceProvider: "Particular",
  insurancePolicyNumber: "N/A",
  privacyConsent: true,
};

describe("Patient model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Patient.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires core fields", async () => {
    const error = await getValidationError(new Patient({}));

    expect(error.errors.userId).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.gender).toBeDefined();
    expect(error.errors.privacyConsent).toBeDefined();
  });

  it("rejects an invalid gender value", async () => {
    const error = await getValidationError(
      new Patient({ ...validPatient, gender: "Alien" }),
    );

    expect(error.errors.gender).toBeDefined();
  });

  it("rejects privacyConsent set to false", async () => {
    const error = await getValidationError(
      new Patient({ ...validPatient, privacyConsent: false }),
    );

    expect(error.errors.privacyConsent).toBeDefined();
  });

  it("creates a valid patient", async () => {
    const patient = await Patient.create(validPatient);

    expect(patient.name).toBe("John Doe");
    expect(patient.gender).toBe("Male");
  });
});
