import { Schema, model, models, Types } from "mongoose";

export interface IDoctor {
  _id: Types.ObjectId;
  name: string;
  image: string;
  specialty?: string;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    specialty: String,
  },
  { timestamps: true },
);

export const Doctor = models.Doctor || model<IDoctor>("Doctor", doctorSchema);
