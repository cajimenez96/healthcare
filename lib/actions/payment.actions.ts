"use server";

import { revalidatePath } from "next/cache";
import { requireSecretariaSession } from "../auth/requireSecretariaSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoAppointmentRepository } from "../db/repositories/MongoAppointmentRepository";
import { MongoClinicalNoteRepository } from "../db/repositories/MongoClinicalNoteRepository";
import { MongoPatientRepository } from "../db/repositories/MongoPatientRepository";
import { MongoPaymentRepository } from "../db/repositories/MongoPaymentRepository";
import { parseStringify } from "../utils";
import type { PaymentMethod } from "../repositories/IPaymentRepository";

const appointmentRepository = new MongoAppointmentRepository();
const clinicalNoteRepository = new MongoClinicalNoteRepository();
const patientRepository = new MongoPatientRepository();
const paymentRepository = new MongoPaymentRepository();

// GET BILLABLE APPOINTMENTS (scheduled appointments with treatments charted, not yet paid)
export const getBillableAppointments = async () => {
  try {
    await requireSecretariaSession();
    await connectToDatabase();

    const appointments = await appointmentRepository.findRecent();
    const scheduled = appointments.filter((a) => a.status === "scheduled");

    const billable = await Promise.all(
      scheduled.map(async (appointment) => {
        const notes = await clinicalNoteRepository.findByAppointmentId(appointment.id);
        const items = notes.flatMap((note) =>
          note.treatments.map((t) => ({ name: t.name, price: t.price })),
        );

        if (items.length === 0) {
          return null;
        }

        const alreadyPaid = await paymentRepository.findByAppointmentId(appointment.id);
        if (alreadyPaid) {
          return null;
        }

        return {
          appointmentId: appointment.id,
          patientName: appointment.patient.name,
          doctorName: appointment.primaryPhysician,
          schedule: appointment.schedule,
          items,
          totalAmount: items.reduce((sum, item) => sum + item.price, 0),
        };
      }),
    );

    return parseStringify(billable.filter((entry) => entry !== null));
  } catch (error) {
    console.error("An error occurred while retrieving billable appointments:", error);
    return [];
  }
};

// CLOSE APPOINTMENT BILLING (records payment, marks the appointment as completed)
export const closeAppointmentBilling = async (
  appointmentId: string,
  paymentMethod: PaymentMethod,
) => {
  try {
    const secretariaSession = await requireSecretariaSession();
    await connectToDatabase();

    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.status !== "scheduled") {
      throw new Error("Appointment is not billable");
    }

    const notes = await clinicalNoteRepository.findByAppointmentId(appointmentId);
    const items = notes.flatMap((note) =>
      note.treatments.map((t) => ({ name: t.name, price: t.price })),
    );
    if (items.length === 0) {
      throw new Error("No treatments charted for this appointment");
    }

    const existingPayment = await paymentRepository.findByAppointmentId(appointmentId);
    if (existingPayment) {
      throw new Error("Appointment already billed");
    }

    const patient = await patientRepository.findById(appointment.patientId);
    if (!patient) {
      throw new Error("Patient not found for this appointment");
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const payment = await paymentRepository.create({
      appointmentId,
      patientId: appointment.patientId,
      patientName: patient.name,
      doctorName: appointment.primaryPhysician,
      items,
      totalAmount,
      paymentMethod,
      registeredBy: secretariaSession.name,
    });

    await appointmentRepository.update(appointmentId, { status: "completed" });

    revalidatePath("/recepcion");
    return parseStringify(payment);
  } catch (error) {
    console.error("An error occurred while closing the appointment billing:", error);
  }
};

// GET PAYMENT FOR AN APPOINTMENT (used to display/reprint the receipt)
export const getPaymentByAppointment = async (appointmentId: string) => {
  try {
    await requireSecretariaSession();
    await connectToDatabase();

    const payment = await paymentRepository.findByAppointmentId(appointmentId);
    return payment ? parseStringify(payment) : undefined;
  } catch (error) {
    console.error("An error occurred while retrieving the payment:", error);
  }
};
