/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

declare type Gender = "Male" | "Female" | "Other";
declare type Status = "pending" | "scheduled" | "cancelled" | "completed";

declare type CreateAppointmentParams = {
  // Optional since TASK-023/024: staff-created patients have no linked
  // User. Only used to resolve a phone number for the SMS confirmation —
  // see sendSMSNotification in appointment.actions.ts.
  userId?: string;
  patient: string;
  primaryPhysician: string;
  reason: string;
  schedule: Date;
  status: Status;
  note: string | undefined;
};

declare type UpdateAppointmentParams = {
  appointmentId: string;
  userId?: string;
  timeZone: string;
  appointment: {
    primaryPhysician?: string;
    schedule?: Date;
    status?: Status;
    cancellationReason?: string;
  };
  type: string;
};
