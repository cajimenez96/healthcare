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

  describe("findAll", () => {
    it("returns every patient sorted by name when no filters are given", async () => {
      await repository.create({ ...basePatient, name: "Beatriz Gomez" });
      await repository.create({ ...basePatient, name: "Ana Perez" });

      const result = await repository.findAll();

      expect(result.map((patient) => patient.name)).toEqual([
        "Ana Perez",
        "Beatriz Gomez",
      ]);
    });

    it("filters by partial, case-insensitive name match", async () => {
      await repository.create({ ...basePatient, name: "Maria Rodriguez" });
      await repository.create({ ...basePatient, name: "Juan Gomez" });

      const result = await repository.findAll({ name: "rod" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Maria Rodriguez");
    });

    it("filters by partial identification number match", async () => {
      await repository.create({
        ...basePatient,
        name: "Patient A",
        identificationNumber: "30111222",
      });
      await repository.create({
        ...basePatient,
        name: "Patient B",
        identificationNumber: "40333444",
      });

      const result = await repository.findAll({ identificationNumber: "0111" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Patient A");
    });

    it("combines name and identification number filters", async () => {
      await repository.create({
        ...basePatient,
        name: "Carlos Diaz",
        identificationNumber: "11112222",
      });
      await repository.create({
        ...basePatient,
        name: "Carla Diaz",
        identificationNumber: "99998888",
      });

      const result = await repository.findAll({
        name: "car",
        identificationNumber: "1111",
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Carlos Diaz");
    });

    it("returns an empty array when nothing matches", async () => {
      await repository.create(basePatient);

      const result = await repository.findAll({ name: "nobody-matches-this" });

      expect(result).toEqual([]);
    });

    it("treats regex special characters in filters as literal text", async () => {
      await repository.create({ ...basePatient, name: "Ana (Test) Perez" });

      const result = await repository.findAll({ name: "(Test)" });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Ana (Test) Perez");
    });

    // TASK-050: single free-text `search` filter for NewAppointmentView's
    // combined name-or-DNI box — ORs across both fields, unlike the
    // name/identificationNumber filters above which AND together.
    describe("search filter (name OR identification number)", () => {
      it("matches by partial, case-insensitive name", async () => {
        await repository.create({ ...basePatient, name: "Maria Rodriguez" });
        await repository.create({ ...basePatient, name: "Juan Gomez" });

        const result = await repository.findAll({ search: "rod" });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Maria Rodriguez");
      });

      it("matches by partial identification number", async () => {
        await repository.create({
          ...basePatient,
          name: "Patient A",
          identificationNumber: "30111222",
        });
        await repository.create({
          ...basePatient,
          name: "Patient B",
          identificationNumber: "40333444",
        });

        const result = await repository.findAll({ search: "0111" });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Patient A");
      });

      it("returns every patient whose name OR identification number matches", async () => {
        await repository.create({
          ...basePatient,
          name: "Carlos Jimenez",
          identificationNumber: "11112222",
        });
        await repository.create({
          ...basePatient,
          name: "Ana Perez",
          identificationNumber: "99998888",
        });
        await repository.create({
          ...basePatient,
          name: "Beatriz Gomez",
          identificationNumber: "12345678",
        });

        const result = await repository.findAll({ search: "12" });

        expect(result.map((patient) => patient.name)).toEqual([
          "Beatriz Gomez",
          "Carlos Jimenez",
        ]);
      });

      it("returns an empty array when nothing matches either field", async () => {
        await repository.create(basePatient);

        const result = await repository.findAll({ search: "nobody-matches-this" });

        expect(result).toEqual([]);
      });

      it("treats regex special characters as literal text", async () => {
        await repository.create({ ...basePatient, name: "Ana (Test) Perez" });

        const result = await repository.findAll({ search: "(Test)" });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Ana (Test) Perez");
      });
    });
  });
});
