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
  occupation?: string;
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
  // Soft-delete flag (TASK-059) — same `undefined`-is-active discipline as
  // TASK-025's User.isActive (see lib/db/models/Patient.ts).
  isActive?: boolean;
}

// insuranceProvider is optional here specifically (unlike on PatientRecord,
// where it's always present) — omitting it at creation falls back to
// DEFAULT_INSURANCE_PROVIDER at the Mongoose level.
export type CreatePatientInput = Omit<PatientRecord, "id" | "insuranceProvider"> & {
  insuranceProvider?: string;
};

// TASK-059: editable fields on an existing patient — the same field set
// CreatePatientForm collects, minus userId/privacyConsent (not user-editable)
// and isActive (its own dedicated setActiveById seam, mirroring
// IUserRepository's update()/setActiveById() split from TASK-026).
export type UpdatePatientInput = Omit<
  CreatePatientInput,
  "userId" | "privacyConsent" | "isActive"
>;

// TASK-069: the doctor-editable subset of PatientRecord — nothing else in
// the app ever set these fields before this ticket. Kept as its own
// Pick<> input/seam rather than reusing UpdatePatientInput's full-replace
// shape (see updateMedicalBackground below).
export type UpdatePatientMedicalBackgroundInput = Pick<
  PatientRecord,
  "allergies" | "currentMedication" | "familyMedicalHistory" | "pastMedicalHistory"
>;

export interface PatientListFilters {
  /** Partial, case-insensitive match on name. */
  name?: string;
  /** Partial match on identification number (DNI) — front-desk staff rarely have the full number at hand. */
  identificationNumber?: string;
  /**
   * Partial, case-insensitive free-text match against name OR identification
   * number (TASK-050) — a single search box where the user might type
   * either (NewAppointmentView's combined patient search). ORs across both
   * fields and takes precedence over name/identificationNumber above when
   * present, rather than ANDing with them — those two exist for
   * PatientsList's separate name+DNI filter fields (TASK-035), a distinct
   * use case from this single combined box.
   */
  search?: string;
}

export interface IPatientRepository {
  create(input: CreatePatientInput): Promise<PatientRecord>;
  findById(id: string): Promise<PatientRecord | null>;
  /** Exact match on identification number (DNI) — used by Admin to find one patient to book a direct appointment for (TASK-033). */
  findByIdentificationNumber(identificationNumber: string): Promise<PatientRecord | null>;
  /** Lists patients sorted by name, optionally narrowed by name/DNI filters (TASK-035). */
  findAll(filters?: PatientListFilters): Promise<PatientRecord[]>;
  /**
   * Updates a patient's own editable fields by its own _id (TASK-059) — no
   * unique index on email/identificationNumber today, so unlike
   * IUserRepository.update() this never needs to reject a conflict.
   */
  update(id: string, input: UpdatePatientInput): Promise<PatientRecord | null>;
  /**
   * Updates only the doctor-editable antecedentes médicos fields (TASK-069)
   * — a $set-style partial merge, unlike update() above which replaces the
   * full editable field set (Mongoose's findByIdAndUpdate with a plain,
   * non-$ object performs a full document replacement, so a genuinely
   * partial change like this needs its own seam rather than reusing
   * update() with a subset of fields).
   */
  updateMedicalBackground(
    id: string,
    input: UpdatePatientMedicalBackgroundInput,
  ): Promise<PatientRecord | null>;
  /**
   * Flips isActive on the patient with the given id (TASK-059) — same
   * general-purpose shape as IUserRepository.setActiveById().
   */
  setActiveById(id: string, isActive: boolean): Promise<PatientRecord | null>;
}
