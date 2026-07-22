import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { Doctor } from "../models/Doctor";
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
});
