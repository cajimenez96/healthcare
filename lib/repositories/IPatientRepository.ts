// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.
// `Gender` is the global ambient type declared in types/index.d.ts.

export interface PatientRecord {
  id: string;
  userId: string;
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

export type CreatePatientInput = Omit<PatientRecord, "id">;

export interface IPatientRepository {
  create(input: CreatePatientInput): Promise<PatientRecord>;
  findByUserId(userId: string): Promise<PatientRecord | null>;
  findById(id: string): Promise<PatientRecord | null>;
}
