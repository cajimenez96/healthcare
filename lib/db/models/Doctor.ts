import { Schema, model, models, Types } from "mongoose";

export interface IDoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IDoctor {
  _id: Types.ObjectId;
  name: string;
  image: string;
  specialty: string;
  licenseNumber: string;
  availability: IDoctorAvailability[];
  isActive: boolean;
}

const doctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    specialty: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    availability: { type: [doctorAvailabilitySchema], default: [] },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const Doctor = models.Doctor || model<IDoctor>("Doctor", doctorSchema);
