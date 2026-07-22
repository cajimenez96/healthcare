import { Schema, model, models, Types } from "mongoose";

export type UserRole = "Administrador" | "Secretaria" | "Doctor" | "Paciente";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hashedPassword?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["Administrador", "Secretaria", "Doctor", "Paciente"],
      required: true,
      default: "Paciente",
    },
    hashedPassword: { type: String, select: false },
  },
  { timestamps: true },
);

export const User = models.User || model<IUser>("User", userSchema);
