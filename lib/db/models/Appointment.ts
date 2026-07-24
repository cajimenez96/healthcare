import { Schema, model, models, Types } from "mongoose";

export type AppointmentStatus = "pending" | "scheduled" | "cancelled" | "completed";

export interface IAppointment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
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
      required: true,
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
