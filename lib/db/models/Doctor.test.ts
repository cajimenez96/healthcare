import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { Doctor } from "./Doctor";

const validDoctor = {
  name: "Dr. Cameron",
  image: "/api/files/507f1f77bcf86cd799439011",
  specialty: "Odontología General",
  licenseNumber: "MP-12345",
  availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
};

describe("Doctor model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Doctor.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires name, image, specialty and licenseNumber", async () => {
    const error = await getValidationError(new Doctor({}));

    expect(error.errors.name).toBeDefined();
    expect(error.errors.image).toBeDefined();
    expect(error.errors.specialty).toBeDefined();
    expect(error.errors.licenseNumber).toBeDefined();
  });

  it("rejects an invalid dayOfWeek in availability", async () => {
    const error = await getValidationError(
      new Doctor({
        ...validDoctor,
        availability: [{ dayOfWeek: 7, startTime: "09:00", endTime: "17:00" }],
      }),
    );

    expect(error.errors["availability.0.dayOfWeek"]).toBeDefined();
  });

  it("defaults isActive to true", async () => {
    const doctor = await Doctor.create(validDoctor);

    expect(doctor.isActive).toBe(true);
  });

  it("creates a valid doctor with availability", async () => {
    const doctor = await Doctor.create(validDoctor);

    expect(doctor.name).toBe("Dr. Cameron");
    expect(doctor.licenseNumber).toBe("MP-12345");
    expect(doctor.availability).toHaveLength(1);
    expect(doctor.availability[0].startTime).toBe("09:00");
  });
});
