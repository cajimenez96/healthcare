import { Schema, model, models, Types } from "mongoose";

export interface IClinicalNoteTreatment {
  treatmentId: Types.ObjectId;
  name: string;
  price: number;
}

export interface IClinicalNote {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  doctorName: string;
  note: string;
  treatments: IClinicalNoteTreatment[];
  createdAt: Date;
}

const clinicalNoteTreatmentSchema = new Schema<IClinicalNoteTreatment>(
  {
    treatmentId: { type: Schema.Types.ObjectId, ref: "Treatment", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

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
    treatments: { type: [clinicalNoteTreatmentSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export const ClinicalNote =
  models.ClinicalNote || model<IClinicalNote>("ClinicalNote", clinicalNoteSchema);
