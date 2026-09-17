// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.
// `Gender` is the global ambient type declared in types/index.d.ts.

export interface PatientRecord {
  id: string;
  // Optional since TASK-023: staff-created patients have no linked login
  // User (same pattern as Doctor — see IDoctorRepository/createDoctorAccess).
  userId?: string;
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
  // Optional at the input boundary (defaults to DEFAULT_INSURANCE_PROVIDER
  // at the Mongoose level — see lib/db/models/Patient.ts) — but always
  // present once read back, since the schema default guarantees a value.
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

// insuranceProvider is optional here specifically (unlike on PatientRecord,
// where it's always present) — omitting it at creation falls back to
// DEFAULT_INSURANCE_PROVIDER at the Mongoose level.
export type CreatePatientInput = Omit<PatientRecord, "id" | "insuranceProvider"> & {
  insuranceProvider?: string;
};

export interface IPatientRepository {
  create(input: CreatePatientInput): Promise<PatientRecord>;
  findById(id: string): Promise<PatientRecord | null>;
  /** Exact match on identification number (DNI) — used by Admin to find one patient to book a direct appointment for (TASK-033). */
  findByIdentificationNumber(identificationNumber: string): Promise<PatientRecord | null>;
}
