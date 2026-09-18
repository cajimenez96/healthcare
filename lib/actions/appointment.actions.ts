"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../auth/requireAdminSession";
import { requireDoctorSession } from "../auth/requireDoctorSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoAppointmentRepository } from "../db/repositories/MongoAppointmentRepository";
import { MongoDoctorRepository } from "../db/repositories/MongoDoctorRepository";
import { MongoTreatmentRepository } from "../db/repositories/MongoTreatmentRepository";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { buildAppointmentSmsMessage } from "../notifications/buildAppointmentSmsMessage";
import { TwilioNotificationService } from "../notifications/TwilioNotificationService";
import { getAvailableSlots } from "../scheduling/getAvailableSlots";
import { parseStringify } from "../utils";

import { toAppointment, toAppointmentWithPatient } from "./serializers";

const appointmentRepository = new MongoAppointmentRepository();
const doctorRepository = new MongoDoctorRepository();
const treatmentRepository = new MongoTreatmentRepository();
const userRepository = new MongoUserRepository();
const notificationService = new TwilioNotificationService();

//  CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    await connectToDatabase();

    // TASK-041: the estimated treatment is required at booking time — its
    // *current* estimatedDurationMinutes is looked up once, here, and
    // snapshotted onto the appointment (never recomputed from a live
    // Treatment lookup afterward, same principle as
    // ClinicalNote.treatments/Payment in TASK-012).
    const treatment = await treatmentRepository.findById(appointment.treatmentId);
    if (!treatment) {
      throw new Error("TREATMENT_NOT_FOUND");
    }
    const durationMinutes = treatment.estimatedDurationMinutes;

    const isTaken = await appointmentRepository.existsOverlapping(
      appointment.primaryPhysician,
      new Date(appointment.schedule),
      durationMinutes,
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
      treatmentId: appointment.treatmentId,
      durationMinutes,
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

// GET A DOCTOR'S APPOINTMENTS WITHIN A DATE RANGE (TASK-043 — the "Nuevo
// turno" calendar page's week view, scoped to the visible range rather than
// the doctor's whole history like findByDoctor/getMyAppointments below).
// Gated the same way findPatientByIdentificationNumber is (requireAdminSession)
// since the result carries patient names — this is only ever called from the
// admin-only booking page.
export const getDoctorAppointmentsInRange = async (
  primaryPhysician: string,
  start: Date,
  end: Date,
) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const appointments = await appointmentRepository.findByDoctorInRange(
      primaryPhysician,
      new Date(start),
      new Date(end),
    );

    return parseStringify(appointments.map(toAppointmentWithPatient));
  } catch (error) {
    console.error(
      "An error occurred while retrieving the doctor's appointments in range:",
      error,
    );
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

// LIST APPOINTMENTS WITH FILTERS (TASK-054 — combinable fecha/paciente/
// doctor/estado filters for the admin dashboard's recent-appointments
// table). Re-queries on every submit rather than filtering a client-side
// copy, same shape/rationale as listPatients (TASK-035): findRecent()
// already fetches the whole appointments collection unbounded (there's no
// existing "last N" limit to preserve), so pushing the filter into the query
// narrows what actually crosses the wire instead of shipping everything to
// the browser and filtering it there. Deliberately does NOT recompute the
// dashboard's status counters (scheduledCount/pendingCount/etc., see
// getRecentAppointmentList below) — those stay tied to the unfiltered
// totals; only the table itself is filtered.
export type AppointmentListFilterParams = {
  /** "YYYY-MM-DD" from a native <input type="date">, parsed as a local calendar day. */
  date?: string;
  patientSearch?: string;
  primaryPhysician?: string;
  status?: Status;
};

export const listAppointments = async (
  filters: AppointmentListFilterParams = {},
) => {
  try {
    await connectToDatabase();

    let date: Date | undefined;
    if (filters.date) {
      const [year, month, day] = filters.date.split("-").map(Number);
      if (year && month && day) {
        date = new Date(year, month - 1, day);
      }
    }

    const appointments = await appointmentRepository.findRecent({
      date,
      patientSearch: filters.patientSearch?.trim() || undefined,
      primaryPhysician: filters.primaryPhysician?.trim() || undefined,
      status: filters.status || undefined,
    });

    return parseStringify(appointments.map(toAppointmentWithPatient));
  } catch (error) {
    console.error("An error occurred while listing appointments:", error);
    return [];
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

    // TASK-056: reschedule mode (the unified "Nuevo turno" view) can change
    // the doctor/treatment while picking a new date, not just the date
    // itself (TASK-041 only ever changed date/doctor). When a treatmentId is
    // given, look up its *current* estimatedDurationMinutes and snapshot it
    // alongside — same one-time-lookup discipline createAppointment already
    // uses, never recomputed later from a live Treatment lookup.
    let newDurationMinutes: number | undefined;
    if (appointment.treatmentId) {
      const treatment = await treatmentRepository.findById(appointment.treatmentId);
      if (!treatment) {
        throw new Error("TREATMENT_NOT_FOUND");
      }
      newDurationMinutes = treatment.estimatedDurationMinutes;
    }

    if (type !== "cancel" && appointment.schedule && appointment.primaryPhysician) {
      // TASK-041: rescheduling without a treatment change doesn't touch the
      // duration snapshotted at booking time — read it back from the
      // existing appointment so the overlap check uses its real duration,
      // not a fixed assumption. A treatment change (TASK-056, above) uses
      // its freshly-looked-up duration instead.
      const existing = await appointmentRepository.findById(appointmentId);
      const durationMinutes =
        newDurationMinutes ?? existing?.durationMinutes ?? 30;

      const isTaken = await appointmentRepository.existsOverlapping(
        appointment.primaryPhysician,
        new Date(appointment.schedule),
        durationMinutes,
        appointmentId,
      );
      if (isTaken) {
        throw new Error("SLOT_TAKEN");
      }
    }

    const updatedAppointment = await appointmentRepository.update(appointmentId, {
      ...appointment,
      ...(newDurationMinutes !== undefined
        ? { durationMinutes: newDurationMinutes }
        : {}),
    });

    if (!updatedAppointment) throw Error;

    // No userId means this patient was created staff-side (TASK-023/024)
    // and has no linked User to resolve a phone number from — skip the SMS
    // rather than let it fail internally on every confirm/cancel.
    if (userId) {
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
    }

    revalidatePath("/admin");
    return parseStringify(toAppointment(updatedAppointment));
  } catch (error) {
    console.error("An error occurred while scheduling an appointment:", error);
  }
};

// GET APPOINTMENT (TASK-056: powers the unified "Nuevo turno" view's
// reschedule mode — fetches the existing appointment's
// patient/doctor/treatment to pre-fill from. Gated the same way
// getDoctorAppointmentsInRange is, since `reason`/`note` are health-adjacent
// and this is now load-bearing for an admin-only page rather than dead code.)
export const getAppointment = async (appointmentId: string) => {
  try {
    await requireAdminSession();
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
