import { Schema, model, models, Types } from "mongoose";

import { DEFAULT_TREATMENT_DURATION_MINUTES } from "../../../constants";

export type AppointmentStatus = "pending" | "scheduled" | "cancelled" | "completed";

export interface IAppointment {
  _id: Types.ObjectId;
  // Optional since TASK-023/024: appointments for staff-created patients
  // have no Paciente User to point to (the patient has no login at all
  // anymore). Only used today to resolve a phone number for SMS
  // notifications — see sendSMSNotification in appointment.actions.ts,
  // which now skips silently when this is absent.
  userId?: Types.ObjectId;
  patientId: Types.ObjectId;
  primaryPhysician: string;
  schedule: Date;
  status: AppointmentStatus;
  reason: string;
  note?: string;
  cancellationReason?: string;
  // TASK-041: the estimated treatment picked at booking time and the
  // duration it implied, both SNAPSHOTTED at creation — same pattern as
  // ClinicalNote.treatments/Payment (TASK-012): a later edit to the
  // Treatment's own estimatedDurationMinutes must not retroactively change
  // an already-booked appointment. Required going forward (no default —
  // there's no meaningful treatment to default to), but appointments
  // created before this migration won't have it on read (see
  // MongoAppointmentRepository.toAppointmentRecord for the fallback).
  treatmentId: Types.ObjectId;
  // Required going forward, defaults to 30 like Treatment.estimatedDurationMinutes
  // (TASK-040) for any new document that doesn't specify one explicitly.
  // Like that default, this one only fires for documents created/hydrated
  // as new — it does not backfill appointments persisted before this field
  // existed (MongoAppointmentRepository applies the same 30-minute fallback
  // there too, so existsOverlapping always has a real number to work with).
  durationMinutes: number;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    primaryPhysician: { type: String, required: true },
    schedule: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "scheduled", "cancelled", "completed"],
      required: true,
      default: "pending",
      index: true,
    },
    reason: { type: String, required: true },
    note: String,
    cancellationReason: String,
    treatmentId: {
      type: Schema.Types.ObjectId,
      ref: "Treatment",
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: DEFAULT_TREATMENT_DURATION_MINUTES,
    },
  },
  { timestamps: true },
);

export const Appointment =
  models.Appointment || model<IAppointment>("Appointment", appointmentSchema);
