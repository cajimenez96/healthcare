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

  describe("findByUserId", () => {
    it("returns null when no patient matches", async () => {
      const result = await repository.findByUserId(
        new mongoose.Types.ObjectId().toString(),
      );
      expect(result).toBeNull();
    });

    it("returns null for a malformed userId instead of throwing", async () => {
      await expect(
        repository.findByUserId("not-an-object-id"),
      ).resolves.toBeNull();
    });

    it("returns the patient registered for that user", async () => {
      const created = await repository.create(basePatient);

      const result = await repository.findByUserId(basePatient.userId);
      expect(result?.id).toBe(created.id);
      expect(result?.email).toBe("john@example.com");
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

  describe("findByEmailOrPhone", () => {
    it("returns the patient matching by exact email", async () => {
      await repository.create(basePatient);

      const result = await repository.findByEmailOrPhone("john@example.com");
      expect(result?.email).toBe("john@example.com");
    });

    it("returns the patient matching by exact phone", async () => {
      await repository.create(basePatient);

      const result = await repository.findByEmailOrPhone("+123456");
      expect(result?.phone).toBe("+123456");
    });

    it("returns null when nothing matches", async () => {
      const result = await repository.findByEmailOrPhone("nobody@example.com");
      expect(result).toBeNull();
    });
  });
});
