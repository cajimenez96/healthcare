import { Schema, model, models, Types } from "mongoose";

export type Gender = "Male" | "Female" | "Other";

export interface IPatient {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocumentId?: string;
  identificationDocumentUrl?: string;
  privacyConsent: boolean;
}

const patientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    address: { type: String, required: true },
    occupation: { type: String, required: true },
    emergencyContactName: { type: String, required: true },
    emergencyContactNumber: { type: String, required: true },
    primaryPhysician: { type: String, required: true },
    insuranceProvider: { type: String, required: true },
    insurancePolicyNumber: { type: String, required: true },
    allergies: String,
    currentMedication: String,
    familyMedicalHistory: String,
    pastMedicalHistory: String,
    identificationType: String,
    identificationNumber: String,
    identificationDocumentId: String,
    identificationDocumentUrl: String,
    privacyConsent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value: boolean) => value === true,
        message: "privacyConsent must be accepted",
      },
    },
  },
  { timestamps: true },
);

export const Patient =
  models.Patient || model<IPatient>("Patient", patientSchema);
