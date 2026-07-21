import { Schema, model, models, Types } from "mongoose";

export interface ITreatment {
  _id: Types.ObjectId;
  name: string;
  price: number;
  description?: string;
}

const treatmentSchema = new Schema<ITreatment>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
  },
  { timestamps: true },
);

export const Treatment =
  models.Treatment || model<ITreatment>("Treatment", treatmentSchema);
