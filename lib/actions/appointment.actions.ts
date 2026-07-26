"use server";

import { revalidatePath } from "next/cache";

import { requireDoctorSession } from "../auth/requireDoctorSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoAppointmentRepository } from "../db/repositories/MongoAppointmentRepository";
import { MongoDoctorRepository } from "../db/repositories/MongoDoctorRepository";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { buildAppointmentSmsMessage } from "../notifications/buildAppointmentSmsMessage";
import { TwilioNotificationService } from "../notifications/TwilioNotificationService";
import { getAvailableSlots } from "../scheduling/getAvailableSlots";
import { parseStringify } from "../utils";

import { toAppointment, toAppointmentWithPatient } from "./serializers";

const appointmentRepository = new MongoAppointmentRepository();
const doctorRepository = new MongoDoctorRepository();
const userRepository = new MongoUserRepository();
const notificationService = new TwilioNotificationService();

//  CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    await connectToDatabase();

    const isTaken = await appointmentRepository.existsOverlapping(
      appointment.primaryPhysician,
      new Date(appointment.schedule),
    );
    if (isTaken) {
      throw new Error("SLOT_TAKEN");
    }

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

// GET AVAILABLE SLOTS
export const getAvailableSlotsForDoctor = async (
  primaryPhysician: string,
  date: Date,
) => {
  try {
    await connectToDatabase();

    const doctor = await doctorRepository.findByName(primaryPhysician);
    if (!doctor) {
      return [];
    }

    const bookedTimes = await appointmentRepository.findBookedTimes(
      primaryPhysician,
      new Date(date),
    );

    return getAvailableSlots(doctor.availability, new Date(date), bookedTimes);
  } catch (error) {
    console.error("An error occurred while retrieving available slots:", error);
    return [];
  }
};

// GET MY APPOINTMENTS (the logged-in Doctor's own agenda)
export const getMyAppointments = async () => {
  let doctorSession;
  try {
    doctorSession = await requireDoctorSession();
  } catch (error) {
    console.error("An error occurred while retrieving your appointments:", error);
    return { appointments: [], hasLinkedProfile: false };
  }

  try {
    await connectToDatabase();

    const doctor = await doctorRepository.findById(doctorSession.doctorId);
    if (!doctor) {
      return { appointments: [], hasLinkedProfile: false };
    }

    const appointments = await appointmentRepository.findByDoctor(doctor.name);
    return {
      appointments: parseStringify(appointments.map(toAppointmentWithPatient)),
      hasLinkedProfile: true,
    };
  } catch (error) {
    console.error("An error occurred while retrieving your appointments:", error);
    return { appointments: [], hasLinkedProfile: true };
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
      completedCount: 0,
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
        case "completed":
          acc.completedCount++;
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

    if (type !== "cancel" && appointment.schedule && appointment.primaryPhysician) {
      const isTaken = await appointmentRepository.existsOverlapping(
        appointment.primaryPhysician,
        new Date(appointment.schedule),
        appointmentId,
      );
      if (isTaken) {
        throw new Error("SLOT_TAKEN");
      }
    }

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
