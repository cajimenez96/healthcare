import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { connectToDatabase } from "../mongodb";

import { Appointment } from "./Appointment";
import { getValidationError } from "./testHelpers";

const validAppointment = {
  userId: new mongoose.Types.ObjectId(),
  patientId: new mongoose.Types.ObjectId(),
  primaryPhysician: "Dr. Cameron",
  schedule: new Date("2026-08-01T10:00:00Z"),
  status: "pending" as const,
  reason: "Annual checkup",
  treatmentId: new mongoose.Types.ObjectId(),
};

describe("Appointment model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Appointment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires core fields", async () => {
    const error = await getValidationError(new Appointment({}));

    expect(error.errors.patientId).toBeDefined();
    expect(error.errors.schedule).toBeDefined();
    expect(error.errors.reason).toBeDefined();
    expect(error.errors.treatmentId).toBeDefined();
  });

  it("does not require userId (TASK-023/024: staff-created patients have no linked User)", async () => {
    const { userId, ...withoutUserId } = validAppointment;
    const doc = new Appointment(withoutUserId);

    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it("rejects an invalid status value", async () => {
    const error = await getValidationError(
      new Appointment({ ...validAppointment, status: "done" }),
    );

    expect(error.errors.status).toBeDefined();
  });

  it("defaults status to pending when omitted", () => {
    const { status, ...withoutStatus } = validAppointment;
    const appointment = new Appointment(withoutStatus);

    expect(appointment.status).toBe("pending");
  });

  it("creates indexes on userId, patientId, status and schedule", () => {
    const indexedPaths = Appointment.schema
      .indexes()
      .flatMap((index: [Record<string, unknown>, unknown]) =>
        Object.keys(index[0]),
      );

    expect(indexedPaths).toEqual(
      expect.arrayContaining(["userId", "patientId", "status", "schedule"]),
    );
  });

  it("creates a valid appointment", async () => {
    const appointment = await Appointment.create(validAppointment);

    expect(appointment.reason).toBe("Annual checkup");
    expect(appointment.status).toBe("pending");
  });

  // TASK-041: treatmentId/durationMinutes are snapshotted at booking time —
  // see MongoAppointmentRepository/appointment.actions.ts for how the
  // duration used at overlap-checking time is resolved.
  it("defaults durationMinutes to 30 when not provided", async () => {
    const appointment = await Appointment.create(validAppointment);

    expect(appointment.durationMinutes).toBe(30);
  });

  it("persists an explicit durationMinutes", async () => {
    const appointment = await Appointment.create({
      ...validAppointment,
      durationMinutes: 45,
    });

    expect(appointment.durationMinutes).toBe(45);
  });

  // Same precedent as Treatment.test.ts (TASK-040): a schema `default` only
  // fires for documents created/hydrated as new — it does NOT retroactively
  // backfill documents persisted before this field existed. Inserting
  // directly through the native driver simulates exactly that pre-migration
  // shape (no treatmentId, no durationMinutes at all).
  it("does not backfill treatmentId/durationMinutes on documents that predate this field", async () => {
    const inserted = await Appointment.collection.insertOne({
      patientId: new mongoose.Types.ObjectId(),
      primaryPhysician: "Dr. Cameron",
      schedule: new Date("2026-08-01T10:00:00Z"),
      status: "pending",
      reason: "Annual checkup",
    });

    const raw = await Appointment.collection.findOne({ _id: inserted.insertedId });

    expect(raw?.treatmentId).toBeUndefined();
    expect(raw?.durationMinutes).toBeUndefined();
  });
});
