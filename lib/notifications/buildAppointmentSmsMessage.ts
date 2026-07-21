import { formatDateTime } from "../utils";

export interface AppointmentSmsInput {
  schedule: Date;
  primaryPhysician: string;
  cancellationReason?: string | null;
}

/**
 * Builds the SMS greeting sent to a patient when their appointment is
 * scheduled or cancelled. Pure function — wording preserved verbatim from
 * the original Appwrite-based `updateAppointment` implementation.
 */
export function buildAppointmentSmsMessage(
  type: string,
  appointment: AppointmentSmsInput,
  timeZone: string,
): string {
  return `Greetings from CarePulse. ${
    type === "schedule"
      ? `Your appointment is confirmed for ${formatDateTime(appointment.schedule, timeZone).dateTime} with Dr. ${appointment.primaryPhysician}`
      : `We regret to inform that your appointment for ${formatDateTime(appointment.schedule, timeZone).dateTime} is cancelled. Reason:  ${appointment.cancellationReason}`
  }.`;
}
