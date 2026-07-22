"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "../db/mongodb";
import { MongoAppointmentRepository } from "../db/repositories/MongoAppointmentRepository";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { buildAppointmentSmsMessage } from "../notifications/buildAppointmentSmsMessage";
import { TwilioNotificationService } from "../notifications/TwilioNotificationService";
import { parseStringify } from "../utils";
import { toAppointment, toAppointmentWithPatient } from "./serializers";

const appointmentRepository = new MongoAppointmentRepository();
const userRepository = new MongoUserRepository();
const notificationService = new TwilioNotificationService();

//  CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    await connectToDatabase();
    const newAppointment = await appointmentRepository.create({
      userId: appointment.userId,
      patientId: appointment.patient,
      primaryPhysician: appointment.primaryPhysician,
      schedule: appointment.schedule,
      status: appointment.status,
      reason: appointment.reason,
      note: appointment.note,
    });

    revalidatePath("/admin");
    return parseStringify(toAppointment(newAppointment));
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
  }
};

//  GET RECENT APPOINTMENTS
export const getRecentAppointmentList = async () => {
  try {
    await connectToDatabase();
    const appointments = await appointmentRepository.findRecent();

    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = appointments.reduce((acc, appointment) => {
      switch (appointment.status) {
        case "scheduled":
          acc.scheduledCount++;
          break;
        case "pending":
          acc.pendingCount++;
          break;
        case "cancelled":
          acc.cancelledCount++;
          break;
      }
      return acc;
    }, initialCounts);

    const data = {
      totalCount: appointments.length,
      ...counts,
      documents: appointments.map(toAppointmentWithPatient),
    };

    return parseStringify(data);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the recent appointments:",
      error
    );
  }
};

//  SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    await connectToDatabase();
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error(`Cannot send SMS: user ${userId} was not found`);
    }

    await notificationService.sendSms(user.phone, content);
  } catch (error) {
    console.error("An error occurred while sending sms:", error);
  }
};

//  UPDATE APPOINTMENT
export const updateAppointment = async ({
  appointmentId,
  userId,
  timeZone,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    await connectToDatabase();
    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      appointment
    );

    if (!updatedAppointment) throw Error;

    const smsMessage = buildAppointmentSmsMessage(
      type,
      {
        schedule: appointment.schedule!,
        primaryPhysician: appointment.primaryPhysician!,
        cancellationReason: appointment.cancellationReason,
      },
      timeZone
    );
    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(toAppointment(updatedAppointment));
  } catch (error) {
    console.error("An error occurred while scheduling an appointment:", error);
  }
};

// GET APPOINTMENT
export const getAppointment = async (appointmentId: string) => {
  try {
    await connectToDatabase();
    const appointment = await appointmentRepository.findById(appointmentId);

    return appointment ? parseStringify(toAppointment(appointment)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while retrieving the existing patient:",
      error
    );
  }
};
