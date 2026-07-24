import { Schema, model, models, Types } from "mongoose";

export interface IClinicalNote {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  doctorName: string;
  note: string;
  createdAt: Date;
}

const clinicalNoteSchema = new Schema<IClinicalNote>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    doctorName: { type: String, required: true },
    note: { type: String, required: true },
  },
  { timestamps: true },
);

export const ClinicalNote =
  models.ClinicalNote || model<IClinicalNote>("ClinicalNote", clinicalNoteSchema);
