// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export interface ClinicalNoteTreatment {
  treatmentId: string;
  name: string;
  price: number;
}

export interface ClinicalNoteRecord {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorName: string;
  note: string;
  treatments: ClinicalNoteTreatment[];
  createdAt: Date;
}

export type CreateClinicalNoteInput = Omit<ClinicalNoteRecord, "id" | "createdAt">;

export interface IClinicalNoteRepository {
  create(input: CreateClinicalNoteInput): Promise<ClinicalNoteRecord>;
  /** Chronological history for a patient, newest first. */
  findByPatientId(patientId: string): Promise<ClinicalNoteRecord[]>;
  /** Notes charted for a single appointment/visit, oldest first (billing reads treatments from these). */
  findByAppointmentId(appointmentId: string): Promise<ClinicalNoteRecord[]>;
}
