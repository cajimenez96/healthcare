import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { Treatment } from "../models/Treatment";
import { connectToDatabase } from "../mongodb";

import { MongoTreatmentRepository } from "./MongoTreatmentRepository";

const validTreatment = {
  name: "Consulta Odontológica",
  price: 5000,
  description: "Consulta y diagnóstico inicial",
  estimatedDurationMinutes: 30,
};

describe("MongoTreatmentRepository", () => {
  const repository = new MongoTreatmentRepository();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Treatment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a treatment active by default", async () => {
      const treatment = await repository.create(validTreatment);

      expect(typeof treatment.id).toBe("string");
      expect(treatment.name).toBe("Consulta Odontológica");
      expect(treatment.isActive).toBe(true);
    });

    it("persists the given estimatedDurationMinutes", async () => {
      const treatment = await repository.create({
        ...validTreatment,
        estimatedDurationMinutes: 45,
      });

      expect(treatment.estimatedDurationMinutes).toBe(45);
    });

    // Genuine simulation of a pre-existing Treatment created before this
    // migration: inserted directly through the native driver, bypassing the
    // model's `default: 30` entirely (which only fires for newly-created
    // documents — see Treatment.test.ts). TASK-041 depends on every
    // treatment, old or new, always resolving to a usable number here, so
    // the repository — not just the schema — must guarantee it.
    it("returns 30 for a treatment that predates this field", async () => {
      const inserted = await Treatment.collection.insertOne({
        name: "Prestación previa a la migración",
        price: 5000,
        isActive: true,
      });

      const result = await repository.findAll();

      const legacyTreatment = result.find(
        (treatment) => treatment.id === inserted.insertedId.toString(),
      );
      expect(legacyTreatment?.estimatedDurationMinutes).toBe(30);
    });
  });

  describe("findById", () => {
    it("returns the treatment when found", async () => {
      const created = await repository.create(validTreatment);

      const result = await repository.findById(created.id);

      expect(result?.name).toBe("Consulta Odontológica");
    });

    it("returns null when no treatment matches", async () => {
      const result = await repository.findById(
        new mongoose.Types.ObjectId().toString(),
      );

      expect(result).toBeNull();
    });

    it("returns null for a malformed id instead of throwing", async () => {
      await expect(repository.findById("not-an-object-id")).resolves.toBeNull();
    });
  });

  describe("findActive", () => {
    it("returns only active treatments", async () => {
      await repository.create(validTreatment);
      await Treatment.create({ ...validTreatment, name: "Discontinued", isActive: false });

      const result = await repository.findActive();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Consulta Odontológica");
    });
  });

  describe("findAll", () => {
    it("returns both active and inactive treatments", async () => {
      await repository.create(validTreatment);
      await Treatment.create({ ...validTreatment, name: "Discontinued", isActive: false });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("updates a treatment's fields", async () => {
      const created = await repository.create(validTreatment);

      const updated = await repository.update(created.id, {
        ...validTreatment,
        price: 6000,
      });

      expect(updated?.price).toBe(6000);
    });

    it("returns null for a non-existent id", async () => {
      const result = await repository.update(
        new mongoose.Types.ObjectId().toString(),
        validTreatment,
      );

      expect(result).toBeNull();
    });
  });

  describe("setActive", () => {
    it("deactivates and reactivates a treatment", async () => {
      const created = await repository.create(validTreatment);

      const deactivated = await repository.setActive(created.id, false);
      expect(deactivated?.isActive).toBe(false);

      const reactivated = await repository.setActive(created.id, true);
      expect(reactivated?.isActive).toBe(true);
    });
  });
});
