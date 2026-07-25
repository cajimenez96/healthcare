import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { Doctor } from "../models/Doctor";
import { connectToDatabase } from "../mongodb";

import { MongoDoctorRepository } from "./MongoDoctorRepository";

const validDoctor = {
  name: "Dr. Cameron",
  image: "/api/files/507f1f77bcf86cd799439011",
  specialty: "Odontología General",
  licenseNumber: "MP-12345",
  availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
};

describe("MongoDoctorRepository", () => {
  const repository = new MongoDoctorRepository();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Doctor.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a doctor active by default", async () => {
      const doctor = await repository.create(validDoctor);

      expect(typeof doctor.id).toBe("string");
      expect(doctor.name).toBe("Dr. Cameron");
      expect(doctor.isActive).toBe(true);
    });
  });

  describe("findActive", () => {
    it("returns only active doctors", async () => {
      await repository.create(validDoctor);
      await Doctor.create({ ...validDoctor, name: "Dr. Inactive", isActive: false });

      const result = await repository.findActive();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Dr. Cameron");
    });

    it("returns an empty array when there are no active doctors", async () => {
      const result = await repository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe("findAll", () => {
    it("returns both active and inactive doctors", async () => {
      await repository.create(validDoctor);
      await Doctor.create({ ...validDoctor, name: "Dr. Inactive", isActive: false });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe("findByName", () => {
    it("returns the doctor matching the exact name", async () => {
      await repository.create(validDoctor);

      const result = await repository.findByName("Dr. Cameron");

      expect(result?.licenseNumber).toBe("MP-12345");
    });

    it("returns null when no doctor matches", async () => {
      const result = await repository.findByName("Dr. Missing");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("returns the doctor matching the id", async () => {
      const created = await repository.create(validDoctor);

      const result = await repository.findById(created.id);

      expect(result?.name).toBe("Dr. Cameron");
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

  describe("update", () => {
    it("updates a doctor's fields", async () => {
      const created = await repository.create(validDoctor);

      const updated = await repository.update(created.id, {
        ...validDoctor,
        specialty: "Ortodoncia",
      });

      expect(updated?.specialty).toBe("Ortodoncia");
    });

    it("returns null for a non-existent id", async () => {
      const result = await repository.update(
        new mongoose.Types.ObjectId().toString(),
        validDoctor,
      );

      expect(result).toBeNull();
    });

    it("returns null for a malformed id instead of throwing", async () => {
      await expect(
        repository.update("not-an-object-id", validDoctor),
      ).resolves.toBeNull();
    });
  });

  describe("setActive", () => {
    it("deactivates a doctor", async () => {
      const created = await repository.create(validDoctor);

      const updated = await repository.setActive(created.id, false);

      expect(updated?.isActive).toBe(false);
    });

    it("reactivates a doctor", async () => {
      const created = await repository.create(validDoctor);
      await repository.setActive(created.id, false);

      const updated = await repository.setActive(created.id, true);

      expect(updated?.isActive).toBe(true);
    });
  });
});
