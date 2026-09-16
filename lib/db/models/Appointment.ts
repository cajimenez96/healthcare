import { Schema, model, models, Types } from "mongoose";

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
  },
  { timestamps: true },
);

export const Appointment =
  models.Appointment || model<IAppointment>("Appointment", appointmentSchema);
