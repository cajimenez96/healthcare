import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { ClinicalNote } from "./ClinicalNote";

const validNote = {
  patientId: new mongoose.Types.ObjectId(),
  appointmentId: new mongoose.Types.ObjectId(),
  doctorName: "Dr. Cameron",
  note: "Paciente sin dolor, se realiza limpieza.",
};

describe("ClinicalNote model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await ClinicalNote.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires patientId, appointmentId, doctorName and note", async () => {
    const error = await getValidationError(new ClinicalNote({}));

    expect(error.errors.patientId).toBeDefined();
    expect(error.errors.appointmentId).toBeDefined();
    expect(error.errors.doctorName).toBeDefined();
    expect(error.errors.note).toBeDefined();
  });

  it("creates a valid clinical note", async () => {
    const note = await ClinicalNote.create(validNote);

    expect(note.doctorName).toBe("Dr. Cameron");
    expect(note.note).toBe("Paciente sin dolor, se realiza limpieza.");
    expect(note.createdAt).toBeInstanceOf(Date);
  });
});
