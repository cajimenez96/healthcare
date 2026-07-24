import { Schema, model, models, Types } from "mongoose";
import type { ToothCondition } from "../../odontogram/createEmptyOdontogram";

const TOOTH_CONDITIONS = ["Caries", "Obturado", "Ausente", "Endodoncia", "Corona"];

export interface ITooth {
  toothNumber: number;
  faces: {
    mesial?: ToothCondition;
    distal?: ToothCondition;
    vestibular?: ToothCondition;
    palatal?: ToothCondition;
    oclusal?: ToothCondition;
  };
}

export interface IOdontogram {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  teeth: ITooth[];
  updatedAt: Date;
}

const toothFacesSchema = new Schema(
  {
    mesial: { type: String, enum: TOOTH_CONDITIONS },
    distal: { type: String, enum: TOOTH_CONDITIONS },
    vestibular: { type: String, enum: TOOTH_CONDITIONS },
    palatal: { type: String, enum: TOOTH_CONDITIONS },
    oclusal: { type: String, enum: TOOTH_CONDITIONS },
  },
  { _id: false },
);

const toothSchema = new Schema<ITooth>(
  {
    toothNumber: { type: Number, required: true, min: 11, max: 48 },
    faces: { type: toothFacesSchema, default: {} },
  },
  { _id: false },
);

const odontogramSchema = new Schema<IOdontogram>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    teeth: { type: [toothSchema], default: [] },
  },
  { timestamps: true },
);

export const Odontogram =
  models.Odontogram || model<IOdontogram>("Odontogram", odontogramSchema);
