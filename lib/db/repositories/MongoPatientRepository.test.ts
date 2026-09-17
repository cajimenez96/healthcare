import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import type { CreatePatientInput } from "../../repositories/IPatientRepository";
import { Patient } from "../models/Patient";
import { connectToDatabase } from "../mongodb";

import { MongoPatientRepository } from "./MongoPatientRepository";


const basePatient: CreatePatientInput = {
  userId: new mongoose.Types.ObjectId().toString(),
  name: "John Doe",
  email: "john@example.com",
  phone: "+123456",
  birthDate: new Date("1990-01-01"),
  gender: "Male",
  address: "123 Main St",
  occupation: "Engineer",
  emergencyContactName: "Jane Doe",
  emergencyContactNumber: "+654321",
  primaryPhysician: "Dr. Cameron",
  insuranceProvider: "BlueCross",
  insurancePolicyNumber: "ABC123",
  privacyConsent: true,
};

describe("MongoPatientRepository", () => {
  const repository = new MongoPatientRepository();

  beforeAll(async () => {
    await connectToDatabase();
    await Patient.init();
  });

  afterEach(async () => {
    await Patient.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a new patient and returns it with a string id and string userId", async () => {
      const patient = await repository.create(basePatient);

      expect(typeof patient.id).toBe("string");
      expect(patient.userId).toBe(basePatient.userId);
      expect(patient.name).toBe("John Doe");
      expect(patient.privacyConsent).toBe(true);
    });

    it("creates a patient without userId, emergency contact or insurance (TASK-023/024)", async () => {
      const {
        userId,
        emergencyContactName,
        emergencyContactNumber,
        insuranceProvider,
        insurancePolicyNumber,
        ...minimal
      } = basePatient;

      const patient = await repository.create(minimal);

      expect(typeof patient.id).toBe("string");
      expect(patient.userId).toBeUndefined();
      expect(patient.emergencyContactName).toBeUndefined();
      expect(patient.emergencyContactNumber).toBeUndefined();
      expect(patient.insuranceProvider).toBe("Particular / Sin Convenio");
      expect(patient.insurancePolicyNumber).toBeUndefined();
    });

    it("persists optional fields such as identification document info", async () => {
      const patient = await repository.create({
        ...basePatient,
        identificationDocumentId: "file-1",
        identificationDocumentUrl: "/api/files/file-1",
      });

      expect(patient.identificationDocumentId).toBe("file-1");
      expect(patient.identificationDocumentUrl).toBe("/api/files/file-1");
    });
  });

  describe("findById", () => {
    it("returns the patient matching the id", async () => {
      const created = await repository.create(basePatient);

      const result = await repository.findById(created.id);
      expect(result?.email).toBe("john@example.com");
    });

    it("returns null for a non-existent id", async () => {
      const result = await repository.findById(
        new mongoose.Types.ObjectId().toString(),
      );
      expect(result).toBeNull();
    });

    it("returns null for a malformed id instead of throwing", async () => {
      await expect(repository.findById("not-an-object-id")).resolves.toBeNull();
    });
  });

  describe("findByIdentificationNumber", () => {
    it("returns the patient matching by exact identification number", async () => {
      await repository.create({
        ...basePatient,
        identificationType: "National Identity Card",
        identificationNumber: "30111222",
      });

      const result = await repository.findByIdentificationNumber("30111222");
      expect(result?.identificationNumber).toBe("30111222");
    });

    it("returns null when nothing matches", async () => {
      const result = await repository.findByIdentificationNumber("99999999");
      expect(result).toBeNull();
    });
  });
});
