import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { ClinicalNote } from "../models/ClinicalNote";
import { MongoClinicalNoteRepository } from "./MongoClinicalNoteRepository";

function noteInput(patientId: string, appointmentId?: string) {
  return {
    patientId,
    appointmentId: appointmentId ?? new mongoose.Types.ObjectId().toString(),
    doctorName: "Dr. Cameron",
    note: "Control de rutina.",
    treatments: [],
  };
}

describe("MongoClinicalNoteRepository", () => {
  const repository = new MongoClinicalNoteRepository();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await ClinicalNote.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a clinical note", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();

      const note = await repository.create(noteInput(patientId));

      expect(typeof note.id).toBe("string");
      expect(note.patientId).toBe(patientId);
      expect(note.note).toBe("Control de rutina.");
    });
  });

  describe("findByPatientId", () => {
    it("returns notes for the patient, newest first", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const first = await repository.create(noteInput(patientId));
      const second = await repository.create({
        ...noteInput(patientId),
        note: "Segunda consulta.",
      });

      const result = await repository.findByPatientId(patientId);

      expect(result.map((n) => n.id)).toEqual([second.id, first.id]);
    });

    it("does not return notes from other patients", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const otherPatientId = new mongoose.Types.ObjectId().toString();
      await repository.create(noteInput(otherPatientId));

      const result = await repository.findByPatientId(patientId);

      expect(result).toEqual([]);
    });
  });

  describe("treatments", () => {
    it("persists the treatments performed during the visit", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const treatmentId = new mongoose.Types.ObjectId().toString();

      const note = await repository.create({
        ...noteInput(patientId),
        treatments: [{ treatmentId, name: "Limpieza Dental", price: 8000 }],
      });

      expect(note.treatments).toEqual([
        { treatmentId, name: "Limpieza Dental", price: 8000 },
      ]);
    });
  });

  describe("findByAppointmentId", () => {
    it("returns notes for the appointment, oldest first", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const appointmentId = new mongoose.Types.ObjectId().toString();
      const first = await repository.create(noteInput(patientId, appointmentId));
      const second = await repository.create({
        ...noteInput(patientId, appointmentId),
        note: "Segunda evolución del mismo turno.",
      });

      const result = await repository.findByAppointmentId(appointmentId);

      expect(result.map((n) => n.id)).toEqual([first.id, second.id]);
    });

    it("does not return notes from other appointments", async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const appointmentId = new mongoose.Types.ObjectId().toString();
      await repository.create(noteInput(patientId));

      const result = await repository.findByAppointmentId(appointmentId);

      expect(result).toEqual([]);
    });
  });
});
