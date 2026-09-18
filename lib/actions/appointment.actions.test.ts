import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";

import { Appointment } from "../db/models/Appointment";
import { Patient } from "../db/models/Patient";
import { Treatment } from "../db/models/Treatment";
import { connectToDatabase } from "../db/mongodb";

import {
  createAppointment,
  getRecentAppointmentList,
  updateAppointment,
} from "./appointment.actions";

// createAppointment/updateAppointment call revalidatePath("/admin") on
// success, which throws "static generation store missing" when invoked
// directly from Vitest (no Next.js request-scoped context to revalidate
// against) — that's why no test exercised either action directly before
// this one. Mocked as a no-op so their actual orchestration logic (overlap
// checks, treatment duration snapshotting) can be tested here instead of
// only at the repository layer.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("appointment actions - connection handling", () => {
  afterEach(async () => {
    await connectToDatabase();
    await Appointment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("getRecentAppointmentList establishes its own database connection instead of relying on a prior connect() call", async () => {
    await mongoose.disconnect();
    global._mongooseCache = undefined;
    mongoose.set("bufferTimeoutMS", 2000);

    const result = await getRecentAppointmentList();

    expect(result?.scheduledCount).toBe(0);
    expect(result?.pendingCount).toBe(0);
    expect(result?.cancelledCount).toBe(0);
    expect(result?.documents).toEqual([]);
  });
});

describe("getRecentAppointmentList - status counts", () => {
  afterEach(async () => {
    await connectToDatabase();
    await Appointment.deleteMany({});
    await Patient.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("counts appointments per status, including completed", async () => {
    // The previous describe block's afterAll disconnects mongoose but
    // leaves connectToDatabase()'s module-level cache pointing at that now-
    // dead connection (its cache-hit check doesn't know it was closed) —
    // clear it so this test reconnects for real instead of reusing it.
    global._mongooseCache = undefined;
    await connectToDatabase();

    const patient = await Patient.create({
      userId: new mongoose.Types.ObjectId(),
      name: "Paciente de Prueba",
      email: "paciente@example.com",
      phone: "+5491100000000",
      birthDate: new Date(1990, 0, 1),
      gender: "Other",
      address: "Calle Falsa 123",
      occupation: "Test",
      emergencyContactName: "Contacto",
      emergencyContactNumber: "+5491100000001",
      primaryPhysician: "Dr. Cameron",
      insuranceProvider: "Particular / Sin Convenio",
      insurancePolicyNumber: "N/A",
      privacyConsent: true,
    });

    const base = {
      userId: new mongoose.Types.ObjectId(),
      patientId: patient._id,
      primaryPhysician: "Dr. Cameron",
      schedule: new Date(),
      reason: "Control",
      // TASK-041: now required on the model — irrelevant to what this test
      // actually verifies (status counting), just needs a valid value.
      treatmentId: new mongoose.Types.ObjectId(),
    };

    await Appointment.create({ ...base, status: "scheduled" });
    await Appointment.create({ ...base, status: "pending" });
    await Appointment.create({ ...base, status: "pending" });
    await Appointment.create({ ...base, status: "cancelled" });
    await Appointment.create({ ...base, status: "completed" });
    await Appointment.create({ ...base, status: "completed" });
    await Appointment.create({ ...base, status: "completed" });

    const result = await getRecentAppointmentList();

    expect(result?.scheduledCount).toBe(1);
    expect(result?.pendingCount).toBe(2);
    expect(result?.cancelledCount).toBe(1);
    expect(result?.completedCount).toBe(3);
    expect(result?.totalCount).toBe(7);
  });
});

// TASK-056: rescheduling through the unified "Nuevo turno" view can change
// the doctor/treatment while picking a new date (not just the date,
// TASK-041) — updateAppointment must look up the new treatment's current
// estimatedDurationMinutes and use it (rather than the appointment's
// already-snapshotted one) both for the overlap check and for what gets
// persisted. updateAppointment itself has no session gate (defense-in-depth
// checks live on getAppointment/getDoctorAppointmentsInRange, which do — see
// adminSafeguard.test.ts for why this project tests gated logic at the
// ungated layer instead of fighting next-auth in Vitest), so it's directly
// testable here like getRecentAppointmentList above.
describe("updateAppointment - treatment change on reschedule", () => {
  // Same reconnect-cache reset as "getRecentAppointmentList - status counts"
  // above — the previous describe block's afterAll disconnected mongoose but
  // left connectToDatabase()'s module-level cache pointing at that now-dead
  // connection.
  beforeAll(async () => {
    global._mongooseCache = undefined;
    await connectToDatabase();
  });

  afterEach(async () => {
    await connectToDatabase();
    await Appointment.deleteMany({});
    await Patient.deleteMany({});
    await Treatment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  async function seedPatient() {
    await connectToDatabase();
    const patient = await Patient.create({
      userId: new mongoose.Types.ObjectId(),
      name: "Paciente Reagendado",
      email: "reagendado@example.com",
      phone: "+5491100000002",
      birthDate: new Date(1990, 0, 1),
      gender: "Other",
      address: "Calle Falsa 123",
      occupation: "Test",
      primaryPhysician: "Dr. Cameron",
      insuranceProvider: "Particular / Sin Convenio",
      privacyConsent: true,
    });
    return patient._id.toString();
  }

  it("persists the new treatmentId and its recomputed durationMinutes when there's no overlap", async () => {
    const patientId = await seedPatient();
    const shortTreatment = await Treatment.create({
      name: "Consulta",
      price: 1000,
      estimatedDurationMinutes: 15,
    });
    const longTreatment = await Treatment.create({
      name: "Cirugía",
      price: 5000,
      estimatedDurationMinutes: 60,
    });

    const created = await createAppointment({
      patient: patientId,
      primaryPhysician: "Dr. Cameron",
      treatmentId: shortTreatment._id.toString(),
      schedule: new Date(2026, 8, 1, 10, 0),
      reason: "Consulta",
      status: "pending",
      note: undefined,
    });

    const updated = await updateAppointment({
      appointmentId: created.$id,
      timeZone: "America/Argentina/Buenos_Aires",
      appointment: {
        primaryPhysician: "Dr. Cameron",
        schedule: new Date(2026, 8, 1, 11, 0),
        status: "scheduled",
        treatmentId: longTreatment._id.toString(),
      },
      type: "schedule",
    });

    expect(updated?.treatmentId).toBe(longTreatment._id.toString());
    expect(updated?.durationMinutes).toBe(60);
    expect(updated?.status).toBe("scheduled");
  });

  it("blocks the reschedule when the new treatment's longer duration would overlap another appointment", async () => {
    const patientId = await seedPatient();
    const shortTreatment = await Treatment.create({
      name: "Consulta",
      price: 1000,
      estimatedDurationMinutes: 15,
    });
    const longTreatment = await Treatment.create({
      name: "Cirugía",
      price: 5000,
      estimatedDurationMinutes: 60,
    });

    const created = await createAppointment({
      patient: patientId,
      primaryPhysician: "Dr. Cameron",
      treatmentId: shortTreatment._id.toString(),
      schedule: new Date(2026, 8, 1, 10, 0),
      reason: "Consulta",
      status: "pending",
      note: undefined,
    });

    // Sits right after the original 15-minute slot (10:15) — irrelevant
    // until the reschedule below extends the appointment's own duration to
    // 60 minutes, which would swallow it.
    await createAppointment({
      patient: patientId,
      primaryPhysician: "Dr. Cameron",
      treatmentId: shortTreatment._id.toString(),
      schedule: new Date(2026, 8, 1, 10, 15),
      reason: "Otra consulta",
      status: "scheduled",
      note: undefined,
    });

    const updated = await updateAppointment({
      appointmentId: created.$id,
      timeZone: "America/Argentina/Buenos_Aires",
      appointment: {
        primaryPhysician: "Dr. Cameron",
        schedule: new Date(2026, 8, 1, 10, 0),
        status: "scheduled",
        treatmentId: longTreatment._id.toString(),
      },
      type: "schedule",
    });

    expect(updated).toBeUndefined();

    const untouched = await Appointment.findById(created.$id);
    expect(untouched?.treatmentId?.toString()).toBe(shortTreatment._id.toString());
    expect(untouched?.durationMinutes).toBe(15);
  });
});
