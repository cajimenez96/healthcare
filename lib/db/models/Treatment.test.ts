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

  it("defaults estimatedDurationMinutes to 30 when not provided", async () => {
    const treatment = await Treatment.create({
      name: "Limpieza dental",
      price: 8000,
    });

    expect(treatment.estimatedDurationMinutes).toBe(30);
  });

  it("persists an explicit estimatedDurationMinutes", async () => {
    const treatment = await Treatment.create({
      name: "Obturación de resina",
      price: 15000,
      estimatedDurationMinutes: 45,
    });

    expect(treatment.estimatedDurationMinutes).toBe(45);
  });

  // Same precedent already established for User.isActive in TASK-025: a
  // Mongoose schema `default` only fires when a document is created/hydrated
  // as new — it does NOT retroactively backfill documents that were already
  // persisted before this field existed. Inserting directly through the
  // native driver (bypassing the model entirely) simulates exactly that
  // pre-migration document shape.
  it("does not backfill estimatedDurationMinutes on documents that predate this field", async () => {
    const inserted = await Treatment.collection.insertOne({
      name: "Prestación previa a la migración",
      price: 5000,
      isActive: true,
    });

    const raw = await Treatment.collection.findOne({ _id: inserted.insertedId });

    expect(raw?.estimatedDurationMinutes).toBeUndefined();
  });
});
