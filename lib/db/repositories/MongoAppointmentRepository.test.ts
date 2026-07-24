import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { Appointment } from "../models/Appointment";
import { Patient } from "../models/Patient";
import { MongoAppointmentRepository } from "./MongoAppointmentRepository";
import type { CreateAppointmentInput } from "../../repositories/IAppointmentRepository";
import type { CreatePatientInput } from "../../repositories/IPatientRepository";

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

async function createPatient() {
  const doc = await Patient.create(patientInput);
  return doc._id.toString();
}

function appointmentInput(patientId: string): CreateAppointmentInput {
  return {
    userId: new mongoose.Types.ObjectId().toString(),
    patientId,
    primaryPhysician: "Dr. Cameron",
    schedule: new Date("2026-08-01T10:00:00Z"),
    reason: "Annual checkup",
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
        created.id,
      );

      expect(result).toBe(false);
    });
  });
});
