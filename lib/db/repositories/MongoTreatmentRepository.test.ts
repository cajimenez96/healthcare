import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { Treatment } from "../models/Treatment";
import { connectToDatabase } from "../mongodb";

import { MongoTreatmentRepository } from "./MongoTreatmentRepository";

const validTreatment = {
  name: "Consulta Odontológica",
  price: 5000,
  description: "Consulta y diagnóstico inicial",
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
