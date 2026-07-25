import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { Payment } from "../models/Payment";
import { connectToDatabase } from "../mongodb";

import { MongoPaymentRepository } from "./MongoPaymentRepository";

function paymentInput(appointmentId: string) {
  return {
    appointmentId,
    patientId: new mongoose.Types.ObjectId().toString(),
    patientName: "Juan Pérez",
    doctorName: "Dr. Cameron",
    items: [{ name: "Consulta Odontológica", price: 5000 }],
    totalAmount: 5000,
    paymentMethod: "cash" as const,
    registeredBy: "Secretaria Pérez",
  };
}

describe("MongoPaymentRepository", () => {
  const repository = new MongoPaymentRepository();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a payment with a snapshot of the billed items", async () => {
      const appointmentId = new mongoose.Types.ObjectId().toString();

      const payment = await repository.create(paymentInput(appointmentId));

      expect(typeof payment.id).toBe("string");
      expect(payment.appointmentId).toBe(appointmentId);
      expect(payment.patientName).toBe("Juan Pérez");
      expect(payment.items).toEqual([
        { name: "Consulta Odontológica", price: 5000 },
      ]);
      expect(payment.totalAmount).toBe(5000);
      expect(payment.paymentMethod).toBe("cash");
      expect(payment.paidAt).toBeInstanceOf(Date);
    });
  });

  describe("findByAppointmentId", () => {
    it("returns the payment for that appointment", async () => {
      const appointmentId = new mongoose.Types.ObjectId().toString();
      const created = await repository.create(paymentInput(appointmentId));

      const found = await repository.findByAppointmentId(appointmentId);

      expect(found?.id).toBe(created.id);
    });

    it("returns null when the appointment has not been billed yet", async () => {
      const appointmentId = new mongoose.Types.ObjectId().toString();

      const found = await repository.findByAppointmentId(appointmentId);

      expect(found).toBeNull();
    });
  });

  describe("uniqueness", () => {
    it("does not allow billing the same appointment twice", async () => {
      const appointmentId = new mongoose.Types.ObjectId().toString();
      await repository.create(paymentInput(appointmentId));

      await expect(repository.create(paymentInput(appointmentId))).rejects.toThrow();
    });
  });
});
