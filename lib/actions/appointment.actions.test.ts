import mongoose from "mongoose";
import { describe, it, expect, afterEach, afterAll } from "vitest";

import { Appointment } from "../db/models/Appointment";
import { Patient } from "../db/models/Patient";
import { connectToDatabase } from "../db/mongodb";

import { getRecentAppointmentList } from "./appointment.actions";

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
