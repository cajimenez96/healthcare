import mongoose, { type HydratedDocument } from "mongoose";
import type { IPatient } from "../models/Patient";
import { Patient } from "../models/Patient";
import type {
  CreatePatientInput,
  IPatientRepository,
  PatientRecord,
} from "../../repositories/IPatientRepository";

function toPatientRecord(doc: HydratedDocument<IPatient>): PatientRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    birthDate: doc.birthDate,
    gender: doc.gender,
    address: doc.address,
    occupation: doc.occupation,
    emergencyContactName: doc.emergencyContactName,
    emergencyContactNumber: doc.emergencyContactNumber,
    primaryPhysician: doc.primaryPhysician,
    insuranceProvider: doc.insuranceProvider,
    insurancePolicyNumber: doc.insurancePolicyNumber,
    allergies: doc.allergies,
    currentMedication: doc.currentMedication,
    familyMedicalHistory: doc.familyMedicalHistory,
    pastMedicalHistory: doc.pastMedicalHistory,
    identificationType: doc.identificationType,
    identificationNumber: doc.identificationNumber,
    identificationDocumentId: doc.identificationDocumentId,
    identificationDocumentUrl: doc.identificationDocumentUrl,
    privacyConsent: doc.privacyConsent,
  };
}

export class MongoPatientRepository implements IPatientRepository {
  async create(input: CreatePatientInput): Promise<PatientRecord> {
    const doc = await Patient.create(input);
    return toPatientRecord(doc);
  }

  async findByUserId(userId: string): Promise<PatientRecord | null> {
    if (!mongoose.isValidObjectId(userId)) {
      return null;
    }
    const doc = await Patient.findOne({ userId });
    return doc ? toPatientRecord(doc) : null;
  }
}
