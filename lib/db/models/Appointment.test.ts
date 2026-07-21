import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { Appointment } from "./Appointment";

const validAppointment = {
  userId: new mongoose.Types.ObjectId(),
  patientId: new mongoose.Types.ObjectId(),
  primaryPhysician: "Dr. Cameron",
  schedule: new Date("2026-08-01T10:00:00Z"),
  status: "pending" as const,
  reason: "Annual checkup",
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

    expect(error.errors.userId).toBeDefined();
    expect(error.errors.patientId).toBeDefined();
    expect(error.errors.schedule).toBeDefined();
    expect(error.errors.reason).toBeDefined();
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
});
