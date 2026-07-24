import { Schema, model, models, Types } from "mongoose";

export interface ITreatment {
  _id: Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
}

const treatmentSchema = new Schema<ITreatment>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const Treatment =
  models.Treatment || model<ITreatment>("Treatment", treatmentSchema);
