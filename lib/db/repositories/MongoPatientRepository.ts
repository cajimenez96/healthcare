import mongoose, { type HydratedDocument } from "mongoose";

import type {
  CreatePatientInput,
  IPatientRepository,
  PatientListFilters,
  PatientRecord,
  UpdatePatientInput,
  UpdatePatientMedicalBackgroundInput,
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
    isActive: doc.isActive,
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

    if (filters.search) {
      const regex = { $regex: escapeRegExp(filters.search), $options: "i" };
      query.$or = [{ name: regex }, { identificationNumber: regex }];
    } else {
      if (filters.name) {
        query.name = { $regex: escapeRegExp(filters.name), $options: "i" };
      }

      if (filters.identificationNumber) {
        query.identificationNumber = {
          $regex: escapeRegExp(filters.identificationNumber),
        };
      }
    }

    const docs = await Patient.find(query).sort({ name: 1 });
    return docs.map(toPatientRecord);
  }

  async update(
    id: string,
    input: UpdatePatientInput,
  ): Promise<PatientRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    // Unlike MongoUserRepository.update, Patient has no unique index on
    // email/identificationNumber today, so there's no EMAIL_TAKEN-style
    // conflict to translate here — a plain update is enough (TASK-059).
    const doc = await Patient.findByIdAndUpdate(id, input, {
      returnDocument: "after",
    });
    return doc ? toPatientRecord(doc) : null;
  }

  async updateMedicalBackground(
    id: string,
    input: UpdatePatientMedicalBackgroundInput,
  ): Promise<PatientRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    // Explicit $set, unlike update() above — a plain object without $
    // operators makes findByIdAndUpdate replace the whole document, which
    // would wipe every field this method isn't given.
    const doc = await Patient.findByIdAndUpdate(
      id,
      { $set: input },
      { returnDocument: "after" },
    );
    return doc ? toPatientRecord(doc) : null;
  }

  async setActiveById(
    id: string,
    isActive: boolean,
  ): Promise<PatientRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Patient.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" },
    );
    return doc ? toPatientRecord(doc) : null;
  }
}
