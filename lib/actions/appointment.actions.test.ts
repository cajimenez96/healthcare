import { describe, it, expect, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../db/mongodb";
import { Appointment } from "../db/models/Appointment";
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
