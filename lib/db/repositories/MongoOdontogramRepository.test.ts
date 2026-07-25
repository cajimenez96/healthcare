import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { createEmptyOdontogram } from "../../odontogram/createEmptyOdontogram";
import { Odontogram } from "../models/Odontogram";
import { connectToDatabase } from "../mongodb";

import { MongoOdontogramRepository } from "./MongoOdontogramRepository";

describe("MongoOdontogramRepository", () => {
  const repository = new MongoOdontogramRepository();

  beforeAll(async () => {
    await connectToDatabase();
    await Odontogram.init();
  });

  afterEach(async () => {
    await Odontogram.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("findByPatientId", () => {
    it("returns null when the patient has no odontogram yet", async () => {
      const result = await repository.findByPatientId(
        new mongoose.Types.ObjectId().toString(),
      );

      expect(result).toBeNull();
    });

    it("returns the odontogram when it exists", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      await repository.upsertByPatientId(patientId, createEmptyOdontogram());

      const result = await repository.findByPatientId(patientId);

      expect(result?.teeth).toHaveLength(32);
    });

    it("returns real face values on a fresh read, not just document shape", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const teeth = createEmptyOdontogram();
      teeth.find((t) => t.toothNumber === 16)!.faces.oclusal = "Caries";
      await repository.upsertByPatientId(patientId, teeth);

      const result = await repository.findByPatientId(patientId);
      const tooth16 = result?.teeth.find((t) => t.toothNumber === 16);

      expect(tooth16?.faces.oclusal).toBe("Caries");
    });
  });

  describe("upsertByPatientId", () => {
    it("creates a new odontogram when none exists", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();

      const result = await repository.upsertByPatientId(
        patientId,
        createEmptyOdontogram(),
      );

      expect(result.patientId).toBe(patientId);
      expect(result.teeth).toHaveLength(32);
    });

    it("returns the saved face values directly in its own result", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const teeth = createEmptyOdontogram();
      teeth.find((t) => t.toothNumber === 21)!.faces = {
        mesial: "Ausente",
        distal: "Ausente",
        vestibular: "Ausente",
        palatal: "Ausente",
        oclusal: "Ausente",
      };

      const result = await repository.upsertByPatientId(patientId, teeth);
      const tooth21 = result.teeth.find((t) => t.toothNumber === 21);

      expect(tooth21?.faces).toEqual({
        mesial: "Ausente",
        distal: "Ausente",
        vestibular: "Ausente",
        palatal: "Ausente",
        oclusal: "Ausente",
      });
    });

    it("replaces the teeth of an existing odontogram instead of duplicating it", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      await repository.upsertByPatientId(patientId, createEmptyOdontogram());

      const updatedTeeth = createEmptyOdontogram();
      updatedTeeth[0].faces.oclusal = "Caries";
      await repository.upsertByPatientId(patientId, updatedTeeth);

      const all = await Odontogram.find({ patientId });
      expect(all).toHaveLength(1);
      expect(all[0].teeth[0].faces.oclusal).toBe("Caries");
    });
  });
});
