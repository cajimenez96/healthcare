import { Schema, model, models, Types } from "mongoose";

export interface IInsuranceProvider {
  _id: Types.ObjectId;
  name: string;
  isActive: boolean;
}

const insuranceProviderSchema = new Schema<IInsuranceProvider>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const InsuranceProvider =
  models.InsuranceProvider ||
  model<IInsuranceProvider>("InsuranceProvider", insuranceProviderSchema);
