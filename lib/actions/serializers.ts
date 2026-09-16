// Maps repository domain records (Mongo `id`) back onto the `$id`-shaped
// contract the frontend components were built against under Appwrite
// (CreatePatientForm, AppointmentForm, columns.tsx, AppointmentModal all
// read `.$id` / `.patient.$id`). Keeping the mapping here means the
// Mongoose schemas and repository ports stay Mongo-shaped and framework
// agnostic, while callers need no changes.

import type {
  AppointmentRecord,
  AppointmentWithPatient,
} from "../repositories/IAppointmentRepository";
import type { PatientRecord } from "../repositories/IPatientRepository";

export function toPatient(record: PatientRecord) {
  const { id, ...rest } = record;
  return { $id: id, ...rest };
}

export function toAppointment(record: AppointmentRecord) {
  const { id, ...rest } = record;
  return { $id: id, ...rest };
}

export function toAppointmentWithPatient(record: AppointmentWithPatient) {
  const { id, patient, ...rest } = record;
  return { $id: id, ...rest, patient: toPatient(patient) };
}
