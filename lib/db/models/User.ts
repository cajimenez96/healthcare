import { Schema, model, models, Types } from "mongoose";

export type UserRole = "Administrador" | "Secretaria" | "Doctor" | "Paciente";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hashedPassword?: string;
  doctorId?: Types.ObjectId;
  // Paciente-only — the DNI/document number doubles as the login username
  // for the DNI+PIN credentials provider (hashedPassword holds the PIN).
  identificationType?: string;
  identificationNumber?: string;
  // Login gate, independent of Doctor.isActive (public-directory visibility).
  // Schema defaults only apply to newly-created documents — existing users
  // persisted before this field existed will read back as `undefined`, not
  // `true`. Callers must treat `undefined` as active (see
  // authenticateCredentials, which checks `=== false`, never `!isActive`).
  isActive?: boolean;
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
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    identificationType: String,
    identificationNumber: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = models.User || model<IUser>("User", userSchema);
