import mongoose, { type HydratedDocument } from "mongoose";

import type {
  CreatePatientInput,
  IPatientRepository,
  PatientListFilters,
  PatientRecord,
} from "../../repositories/IPatientRepository";
import type { IPatient } from "../models/Patient";
import { Patient } from "../models/Patient";

// Escapes regex metacharacters so a filter value (e.g. a DNI containing
// nothing special, but defensively for names like "Ana (Test)") is matched
// as literal text rather than interpreted as a regex pattern.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPatientRecord(doc: HydratedDocument<IPatient>): PatientRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString(),
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

  async findById(id: string): Promise<PatientRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Patient.findById(id);
    return doc ? toPatientRecord(doc) : null;
  }

  async findByIdentificationNumber(identificationNumber: string): Promise<PatientRecord | null> {
    const doc = await Patient.findOne({ identificationNumber });
    return doc ? toPatientRecord(doc) : null;
  }

  async findAll(filters: PatientListFilters = {}): Promise<PatientRecord[]> {
    const query: Record<string, unknown> = {};

    if (filters.name) {
      query.name = { $regex: escapeRegExp(filters.name), $options: "i" };
    }

    if (filters.identificationNumber) {
      query.identificationNumber = {
        $regex: escapeRegExp(filters.identificationNumber),
      };
    }

    const docs = await Patient.find(query).sort({ name: 1 });
    return docs.map(toPatientRecord);
  }
}
