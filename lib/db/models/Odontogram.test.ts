import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { Odontogram } from "./Odontogram";
import { createEmptyOdontogram } from "../../odontogram/createEmptyOdontogram";

describe("Odontogram model", () => {
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

  it("requires patientId", async () => {
    const error = await getValidationError(new Odontogram({}));

    expect(error.errors.patientId).toBeDefined();
  });

  it("creates a valid odontogram with 32 teeth", async () => {
    const patientId = new mongoose.Types.ObjectId();

    const odontogram = await Odontogram.create({
      patientId,
      teeth: createEmptyOdontogram(),
    });

    expect(odontogram.teeth).toHaveLength(32);
    expect(odontogram.teeth[0].toothNumber).toBe(11);
  });

  it("rejects an invalid face condition", async () => {
    const patientId = new mongoose.Types.ObjectId();
    const teeth = createEmptyOdontogram();
    (teeth[0].faces as any).oclusal = "NotARealCondition";

    const error = await getValidationError(new Odontogram({ patientId, teeth }));

    expect(error.errors["teeth.0.faces.oclusal"]).toBeDefined();
  });

  it("enforces one odontogram per patient", async () => {
    const patientId = new mongoose.Types.ObjectId();
    await Odontogram.create({ patientId, teeth: createEmptyOdontogram() });

    await expect(
      Odontogram.create({ patientId, teeth: createEmptyOdontogram() }),
    ).rejects.toThrow();
  });
});
