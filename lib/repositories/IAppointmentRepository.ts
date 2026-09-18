// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.
// `Status` is the global ambient type declared in types/index.d.ts.

import type { PatientRecord } from "./IPatientRepository";

export interface AppointmentRecord {
  id: string;
  // Optional since TASK-023/024 — see IAppointment.userId in
  // lib/db/models/Appointment.ts for the rationale.
  userId?: string;
  patientId: string;
  primaryPhysician: string;
  schedule: Date;
  status: Status;
  reason: string;
  note?: string;
  cancellationReason?: string;
  // TASK-041: optional here because appointments created before this
  // migration have no treatment reference at all — there's no meaningful
  // value to fall back to (unlike durationMinutes below). Required on
  // CreateAppointmentInput for every new appointment going forward.
  treatmentId?: string;
  // Always resolves to a real number — MongoAppointmentRepository falls
  // back to DEFAULT_TREATMENT_DURATION_MINUTES for appointments created
  // before this field existed, mirroring
  // TreatmentRecord.estimatedDurationMinutes (TASK-040).
  durationMinutes: number;
}

/** Appointment shape returned by findRecent(), with the referenced patient populated. */
export interface AppointmentWithPatient extends AppointmentRecord {
  patient: PatientRecord;
}

/**
 * Combinable (AND) filters for findRecent() — TASK-054, admin dashboard
 * filtering. Same overall shape/spirit as PatientListFilters (TASK-035):
 * each key is optional and independently ANDed with the others.
 */
export interface AppointmentListFilters {
  /**
   * A single calendar day (local time, same start/end-of-day convention as
   * findBookedTimes below) — TASK-054 picked a single-day filter over a
   * date range because "who's on today's board" is the dashboard's everyday
   * front-desk use case; nothing here rules a range filter out later, but a
   * range wasn't the common case worth building yet.
   */
  date?: Date;
  /** Partial, case-insensitive match against the patient's name OR identification number (same combined shape as PatientListFilters.search). */
  patientSearch?: string;
  /** Exact match on primaryPhysician — populated from a bounded doctor picker (getAllDoctors), not free text. */
  primaryPhysician?: string;
  /** Exact match on one of the 4 status values. */
  status?: Status;
}

export type CreateAppointmentInput = Omit<
  AppointmentRecord,
  "id" | "status" | "treatmentId"
> & {
  status?: Status;
  // Genuinely required for new appointments (TASK-041) — snapshotted once
  // at creation, never recomputed from a live Treatment lookup afterward.
  treatmentId: string;
};

export type UpdateAppointmentInput = Partial<
  Pick<
    AppointmentRecord,
    | "primaryPhysician"
    | "schedule"
    | "status"
    | "cancellationReason"
    // TASK-056: rescheduling through the unified "Nuevo turno" view lets the
    // doctor/treatment be changed too, not just the date — treatmentId's
    // duration is recomputed by the action and both are snapshotted here
    // together, same discipline as create's initial snapshot (TASK-041).
    | "treatmentId"
    | "durationMinutes"
  >
>;

export interface IAppointmentRepository {
  create(input: CreateAppointmentInput): Promise<AppointmentRecord>;
  /** Newest-first, with the patient populated, optionally narrowed by combinable filters (TASK-054). */
  findRecent(filters?: AppointmentListFilters): Promise<AppointmentWithPatient[]>;
  update(id: string, data: UpdateAppointmentInput): Promise<AppointmentRecord | null>;
  findById(id: string): Promise<AppointmentRecord | null>;
  /** "HH:mm" times already booked (non-cancelled) for a doctor on a given calendar day. */
  findBookedTimes(primaryPhysician: string, date: Date): Promise<string[]>;
  /**
   * Whether a doctor already has a non-cancelled appointment whose real
   * [schedule, schedule + durationMinutes) interval overlaps the given one
   * (TASK-041 — no longer a fixed 30-minute/exact-time assumption).
   */
  existsOverlapping(
    primaryPhysician: string,
    schedule: Date,
    durationMinutes: number,
    excludeAppointmentId?: string,
  ): Promise<boolean>;
  /** A doctor's own appointments (their agenda), soonest first, with the patient populated. */
  findByDoctor(primaryPhysician: string): Promise<AppointmentWithPatient[]>;
  /**
   * That doctor's non-cancelled appointments whose schedule falls within
   * [start, end), soonest first, with the patient populated — TASK-043's
   * "Nuevo turno" calendar week view, scoped to whatever range is currently
   * visible rather than the doctor's entire history (unlike findByDoctor).
   */
  findByDoctorInRange(
    primaryPhysician: string,
    start: Date,
    end: Date,
  ): Promise<AppointmentWithPatient[]>;
}
