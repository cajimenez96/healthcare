import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { connectToDatabase } from "../mongodb";

import { getValidationError } from "./testHelpers";
import { Treatment } from "./Treatment";

describe("Treatment model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Treatment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires name and price", async () => {
    const error = await getValidationError(new Treatment({}));

    expect(error.errors.name).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  it("creates a valid treatment", async () => {
    const treatment = await Treatment.create({
      name: "Obturación de resina",
      price: 15000,
    });

    expect(treatment.name).toBe("Obturación de resina");
    expect(treatment.price).toBe(15000);
  });

  it("defaults isActive to true", async () => {
    const treatment = await Treatment.create({
      name: "Limpieza dental",
      price: 8000,
    });

    expect(treatment.isActive).toBe(true);
  });
});
