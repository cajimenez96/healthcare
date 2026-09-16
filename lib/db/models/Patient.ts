import { Schema, model, models, Types } from "mongoose";

import { DEFAULT_INSURANCE_PROVIDER } from "../../../constants";

export type Gender = "Male" | "Female" | "Other";

export interface IPatient {
  _id: Types.ObjectId;
  // Optional since TASK-023: patients are created 100% staff-side now (see
  // createPatient in lib/actions/patient.actions.ts) and never get a linked
  // login User — same pattern already established for Doctor (a clinical
  // profile can exist with no User/login attached, see createDoctorAccess).
  userId?: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber?: string;
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
      required: false,
      index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    address: { type: String, required: true },
    occupation: { type: String, required: true },
    emergencyContactName: { type: String, required: false },
    emergencyContactNumber: { type: String, required: false },
    primaryPhysician: { type: String, required: true },
    insuranceProvider: {
      type: String,
      required: false,
      default: DEFAULT_INSURANCE_PROVIDER,
    },
    insurancePolicyNumber: { type: String, required: false },
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
