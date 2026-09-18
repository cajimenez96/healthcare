import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import type { CreateAppointmentInput } from "../../repositories/IAppointmentRepository";
import type { CreatePatientInput } from "../../repositories/IPatientRepository";
import { Appointment } from "../models/Appointment";
import { Patient } from "../models/Patient";
import { connectToDatabase } from "../mongodb";

import { MongoAppointmentRepository } from "./MongoAppointmentRepository";


const patientInput: CreatePatientInput = {
  userId: new mongoose.Types.ObjectId().toString(),
  name: "John Doe",
  email: "john@example.com",
  phone: "+123456",
  birthDate: new Date("1990-01-01"),
  gender: "Male",
  address: "123 Main St",
  occupation: "Engineer",
  emergencyContactName: "Jane Doe",
  emergencyContactNumber: "+654321",
  primaryPhysician: "Dr. Cameron",
  insuranceProvider: "BlueCross",
  insurancePolicyNumber: "ABC123",
  privacyConsent: true,
};

async function createPatient(overrides: Partial<CreatePatientInput> = {}) {
  const doc = await Patient.create({ ...patientInput, ...overrides });
  return doc._id.toString();
}

function appointmentInput(patientId: string): CreateAppointmentInput {
  return {
    userId: new mongoose.Types.ObjectId().toString(),
    patientId,
    primaryPhysician: "Dr. Cameron",
    schedule: new Date("2026-08-01T10:00:00Z"),
    reason: "Annual checkup",
    treatmentId: new mongoose.Types.ObjectId().toString(),
    durationMinutes: 30,
  };
}

describe("MongoAppointmentRepository", () => {
  const repository = new MongoAppointmentRepository();

  beforeAll(async () => {
    await connectToDatabase();
    await Appointment.init();
    await Patient.init();
  });

  afterEach(async () => {
    await Appointment.deleteMany({});
    await Patient.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates an appointment defaulting status to pending when omitted", async () => {
      const patientId = await createPatient();
      const created = await repository.create(appointmentInput(patientId));

      expect(typeof created.id).toBe("string");
      expect(created.status).toBe("pending");
      expect(created.patientId).toBe(patientId);
      expect(created.reason).toBe("Annual checkup");
    });

    it("honors an explicit status", async () => {
      const patientId = await createPatient();
      const created = await repository.create({
        ...appointmentInput(patientId),
        status: "scheduled",
      });

      expect(created.status).toBe("scheduled");
    });

    // TASK-041: treatmentId/durationMinutes are snapshotted at creation.
    it("snapshots the given treatmentId and durationMinutes", async () => {
      const patientId = await createPatient();
      const treatmentId = new mongoose.Types.ObjectId().toString();
      const created = await repository.create({
        ...appointmentInput(patientId),
        treatmentId,
        durationMinutes: 45,
      });

      expect(created.treatmentId).toBe(treatmentId);
      expect(created.durationMinutes).toBe(45);
    });

    // Same migration discipline as MongoTreatmentRepository (TASK-040): a
    // pre-existing appointment inserted directly through the native driver
    // (bypassing the model's `default: 30` entirely) must still read back a
    // usable durationMinutes through the repository.
    it("falls back to 30 minutes for an appointment that predates durationMinutes", async () => {
      const patientId = await createPatient();
      const inserted = await Appointment.collection.insertOne({
        patientId: new mongoose.Types.ObjectId(patientId),
        primaryPhysician: "Dr. Cameron",
        schedule: new Date("2026-08-01T10:00:00Z"),
        status: "scheduled",
        reason: "Annual checkup",
      });

      const result = await repository.findById(inserted.insertedId.toString());

      expect(result?.durationMinutes).toBe(30);
      expect(result?.treatmentId).toBeUndefined();
    });
  });

  describe("findRecent", () => {
    it("returns appointments newest first with the patient populated", async () => {
      const patientId = await createPatient();
      const first = await repository.create(appointmentInput(patientId));
      const second = await repository.create(appointmentInput(patientId));

      const results = await repository.findRecent();

      expect(results.map((r) => r.id)).toEqual([second.id, first.id]);
      expect(results[0].patient.name).toBe("John Doe");
      expect(results[0].patient.id).toBe(patientId);
    });

    // TASK-054: combinable fecha/paciente/doctor/estado filters for the
    // admin dashboard's turnos list.
    it("filters by an exact calendar day", async () => {
      const patientId = await createPatient();
      const onTargetDay = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 9, 0),
      });
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 2, 9, 0),
      });

      const results = await repository.findRecent({
        date: new Date(2026, 7, 1),
      });

      expect(results.map((r) => r.id)).toEqual([onTargetDay.id]);
    });

    it("filters by doctor (primaryPhysician), exact match", async () => {
      const patientId = await createPatient();
      const cameron = await repository.create({
        ...appointmentInput(patientId),
        primaryPhysician: "Dr. Cameron",
      });
      await repository.create({
        ...appointmentInput(patientId),
        primaryPhysician: "Dr. House",
      });

      const results = await repository.findRecent({
        primaryPhysician: "Dr. Cameron",
      });

      expect(results.map((r) => r.id)).toEqual([cameron.id]);
    });

    it("filters by status, exact match", async () => {
      const patientId = await createPatient();
      const scheduled = await repository.create({
        ...appointmentInput(patientId),
        status: "scheduled",
      });
      await repository.create({
        ...appointmentInput(patientId),
        status: "cancelled",
      });

      const results = await repository.findRecent({ status: "scheduled" });

      expect(results.map((r) => r.id)).toEqual([scheduled.id]);
    });

    it("filters by patient name, partial and case-insensitive", async () => {
      const janePatientId = await createPatient({
        name: "Jane Smith",
        identificationNumber: "11111111",
      });
      const johnPatientId = await createPatient({
        name: "John Doe",
        identificationNumber: "22222222",
      });
      const janeAppointment = await repository.create(
        appointmentInput(janePatientId),
      );
      await repository.create(appointmentInput(johnPatientId));

      const results = await repository.findRecent({ patientSearch: "jane" });

      expect(results.map((r) => r.id)).toEqual([janeAppointment.id]);
    });

    it("filters by patient identification number (DNI), partial match", async () => {
      const janePatientId = await createPatient({
        name: "Jane Smith",
        identificationNumber: "11112222",
      });
      const johnPatientId = await createPatient({
        name: "John Doe",
        identificationNumber: "99998888",
      });
      const janeAppointment = await repository.create(
        appointmentInput(janePatientId),
      );
      await repository.create(appointmentInput(johnPatientId));

      const results = await repository.findRecent({ patientSearch: "1112" });

      expect(results.map((r) => r.id)).toEqual([janeAppointment.id]);
    });

    it("combines filters with AND", async () => {
      const janePatientId = await createPatient({
        name: "Jane Smith",
        identificationNumber: "33334444",
      });
      const matching = await repository.create({
        ...appointmentInput(janePatientId),
        primaryPhysician: "Dr. Cameron",
        status: "scheduled",
        schedule: new Date(2026, 7, 1, 9, 0),
      });
      // Same patient/day, different doctor — must be excluded by the doctor filter.
      await repository.create({
        ...appointmentInput(janePatientId),
        primaryPhysician: "Dr. House",
        status: "scheduled",
        schedule: new Date(2026, 7, 1, 10, 0),
      });

      const results = await repository.findRecent({
        date: new Date(2026, 7, 1),
        patientSearch: "jane",
        primaryPhysician: "Dr. Cameron",
        status: "scheduled",
      });

      expect(results.map((r) => r.id)).toEqual([matching.id]);
    });

    it("returns an empty list when no patient matches patientSearch", async () => {
      const patientId = await createPatient();
      await repository.create(appointmentInput(patientId));

      const results = await repository.findRecent({
        patientSearch: "nonexistent-name-xyz",
      });

      expect(results).toEqual([]);
    });
  });

  describe("findByDoctor", () => {
    it("returns only that doctor's appointments, soonest first, with the patient populated", async () => {
      const patientId = await createPatient();
      const earlier = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 9, 0),
      });
      const later = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 2, 9, 0),
      });
      await repository.create({
        ...appointmentInput(patientId),
        primaryPhysician: "Dr. Other",
        schedule: new Date(2026, 7, 1, 10, 0),
      });

      const result = await repository.findByDoctor("Dr. Cameron");

      expect(result.map((r) => r.id)).toEqual([earlier.id, later.id]);
      expect(result[0].patient.name).toBe("John Doe");
    });
  });

  // TASK-043: powers the new "Nuevo turno" calendar page's week view — the
  // doctor's busy events for whatever range is currently visible, not their
  // entire history (findByDoctor above, used for the Doctor's own agenda).
  describe("findByDoctorInRange", () => {
    it("returns only that doctor's non-cancelled appointments within the range, soonest first, with the patient populated", async () => {
      const patientId = await createPatient();
      const inRangeEarlier = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 6, 6, 9, 0),
      });
      const inRangeLater = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 6, 7, 9, 0),
      });
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 6, 6, 11, 0),
        status: "cancelled",
      });
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 6, 10, 9, 0), // outside the queried range
      });
      await repository.create({
        ...appointmentInput(patientId),
        primaryPhysician: "Dr. Other",
        schedule: new Date(2026, 6, 6, 9, 0),
      });

      const result = await repository.findByDoctorInRange(
        "Dr. Cameron",
        new Date(2026, 6, 5),
        new Date(2026, 6, 9),
      );

      expect(result.map((r) => r.id)).toEqual([inRangeEarlier.id, inRangeLater.id]);
      expect(result[0].patient.name).toBe("John Doe");
    });

    it("returns an empty array when the doctor has no appointments in range", async () => {
      const result = await repository.findByDoctorInRange(
        "Dr. Cameron",
        new Date(2026, 6, 5),
        new Date(2026, 6, 9),
      );

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("updates fields and returns the updated appointment", async () => {
      const patientId = await createPatient();
      const created = await repository.create(appointmentInput(patientId));

      const updated = await repository.update(created.id, {
        status: "scheduled",
        primaryPhysician: "Dr. House",
      });

      expect(updated?.status).toBe("scheduled");
      expect(updated?.primaryPhysician).toBe("Dr. House");
    });

    it("returns null when the appointment does not exist", async () => {
      const result = await repository.update(
        new mongoose.Types.ObjectId().toString(),
        { status: "cancelled" },
      );
      expect(result).toBeNull();
    });

    // TASK-056: rescheduling through the unified "Nuevo turno" view can
    // change the treatment (not just the date/doctor, TASK-041) — the
    // repository must persist both treatmentId and its recomputed
    // durationMinutes together, same snapshot discipline as create.
    it("updates treatmentId and durationMinutes when rescheduling to a different treatment", async () => {
      const patientId = await createPatient();
      const created = await repository.create(appointmentInput(patientId));
      const newTreatmentId = new mongoose.Types.ObjectId().toString();

      const updated = await repository.update(created.id, {
        treatmentId: newTreatmentId,
        durationMinutes: 60,
      });

      expect(updated?.treatmentId).toBe(newTreatmentId);
      expect(updated?.durationMinutes).toBe(60);
    });
  });

  describe("findById", () => {
    it("returns null when no appointment matches", async () => {
      const result = await repository.findById(
        new mongoose.Types.ObjectId().toString(),
      );
      expect(result).toBeNull();
    });

    it("returns null for a malformed id instead of throwing", async () => {
      await expect(repository.findById("not-an-object-id")).resolves.toBeNull();
    });

    it("returns the appointment when found", async () => {
      const patientId = await createPatient();
      const created = await repository.create(appointmentInput(patientId));

      const result = await repository.findById(created.id);
      expect(result?.reason).toBe("Annual checkup");
    });
  });

  describe("findBookedTimes", () => {
    it("returns HH:mm times booked for the doctor on that day, excluding cancelled", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 10, 0),
        status: "scheduled",
      });
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 11, 0),
        status: "cancelled",
      });
      await repository.create({
        ...appointmentInput(patientId),
        primaryPhysician: "Dr. Other",
        schedule: new Date(2026, 7, 1, 12, 0),
        status: "scheduled",
      });

      const result = await repository.findBookedTimes(
        "Dr. Cameron",
        new Date(2026, 7, 1),
      );

      expect(result).toEqual(["10:00"]);
    });

    it("returns an empty array when nothing is booked that day", async () => {
      const result = await repository.findBookedTimes(
        "Dr. Cameron",
        new Date("2026-08-01T00:00:00Z"),
      );

      expect(result).toEqual([]);
    });
  });

  describe("existsOverlapping", () => {
    it("returns true when the doctor has a non-cancelled appointment at that exact time", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date("2026-08-01T10:00:00Z"),
        status: "scheduled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date("2026-08-01T10:00:00Z"),
        30,
      );

      expect(result).toBe(true);
    });

    it("returns false when the conflicting appointment is cancelled", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date("2026-08-01T10:00:00Z"),
        status: "cancelled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date("2026-08-01T10:00:00Z"),
        30,
      );

      expect(result).toBe(false);
    });

    it("excludes the given appointment id (for rescheduling in place)", async () => {
      const patientId = await createPatient();
      const created = await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date("2026-08-01T10:00:00Z"),
        status: "scheduled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date("2026-08-01T10:00:00Z"),
        30,
        created.id,
      );

      expect(result).toBe(false);
    });

    // TASK-041: a 45-minute appointment starting at 10:00 occupies until
    // 10:45 — a fixed-30-minute assumption would only have blocked another
    // request landing at exactly 10:00, missing a genuine overlap like one
    // requested for 10:30.
    it("blocks a new request that starts mid-way through an existing longer appointment", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 10, 0),
        durationMinutes: 45,
        status: "scheduled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date(2026, 7, 1, 10, 30),
        30,
      );

      expect(result).toBe(true);
    });

    it("blocks a new longer request that would swallow an existing shorter appointment", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 10, 15),
        durationMinutes: 15,
        status: "scheduled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date(2026, 7, 1, 10, 0),
        60,
      );

      expect(result).toBe(true);
    });

    it("allows a back-to-back appointment that starts exactly when the previous one ends", async () => {
      const patientId = await createPatient();
      await repository.create({
        ...appointmentInput(patientId),
        schedule: new Date(2026, 7, 1, 10, 0),
        durationMinutes: 30,
        status: "scheduled",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date(2026, 7, 1, 10, 30),
        30,
      );

      expect(result).toBe(false);
    });

    // Same migration discipline as the model/repository tests above: an
    // appointment inserted before durationMinutes existed must still block
    // real overlaps using the 30-minute fallback, not be silently ignored.
    it("uses the 30-minute fallback duration for a pre-existing appointment without durationMinutes", async () => {
      const patientId = await createPatient();
      await Appointment.collection.insertOne({
        patientId: new mongoose.Types.ObjectId(patientId),
        primaryPhysician: "Dr. Cameron",
        schedule: new Date(2026, 7, 1, 10, 0),
        status: "scheduled",
        reason: "Annual checkup",
      });

      const result = await repository.existsOverlapping(
        "Dr. Cameron",
        new Date(2026, 7, 1, 10, 15),
        30,
      );

      expect(result).toBe(true);
    });
  });
});
