// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.
// `Status` is the global ambient type declared in types/index.d.ts.

import type { PatientRecord } from "./IPatientRepository";

export interface AppointmentRecord {
  id: string;
  userId: string;
  patientId: string;
  primaryPhysician: string;
  schedule: Date;
  status: Status;
  reason: string;
  note?: string;
  cancellationReason?: string;
}

/** Appointment shape returned by findRecent(), with the referenced patient populated. */
export interface AppointmentWithPatient extends AppointmentRecord {
  patient: PatientRecord;
}

export type CreateAppointmentInput = Omit<AppointmentRecord, "id" | "status"> & {
  status?: Status;
};

export type UpdateAppointmentInput = Partial<
  Pick<AppointmentRecord, "primaryPhysician" | "schedule" | "status" | "cancellationReason">
>;

export interface IAppointmentRepository {
  create(input: CreateAppointmentInput): Promise<AppointmentRecord>;
  findRecent(): Promise<AppointmentWithPatient[]>;
  update(id: string, data: UpdateAppointmentInput): Promise<AppointmentRecord | null>;
  findById(id: string): Promise<AppointmentRecord | null>;
  /** "HH:mm" times already booked (non-cancelled) for a doctor on a given calendar day. */
  findBookedTimes(primaryPhysician: string, date: Date): Promise<string[]>;
  /** Whether a doctor already has a non-cancelled appointment at that exact time. */
  existsOverlapping(
    primaryPhysician: string,
    schedule: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean>;
  /** A doctor's own appointments (their agenda), soonest first, with the patient populated. */
  findByDoctor(primaryPhysician: string): Promise<AppointmentWithPatient[]>;
}
