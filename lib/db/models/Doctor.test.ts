import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { Doctor } from "./Doctor";

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

  it("requires name and image", async () => {
    const error = await getValidationError(new Doctor({}));

    expect(error.errors.name).toBeDefined();
    expect(error.errors.image).toBeDefined();
  });

  it("creates a valid doctor with optional specialty", async () => {
    const doctor = await Doctor.create({
      name: "Dr. Cameron",
      image: "/assets/images/dr-cameron.png",
      specialty: "Odontología General",
    });

    expect(doctor.name).toBe("Dr. Cameron");
    expect(doctor.specialty).toBe("Odontología General");
  });
});
