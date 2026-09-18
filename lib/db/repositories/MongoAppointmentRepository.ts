import mongoose, { type HydratedDocument } from "mongoose";

import { DEFAULT_TREATMENT_DURATION_MINUTES } from "../../../constants";
import type {
  AppointmentRecord,
  AppointmentWithPatient,
  CreateAppointmentInput,
  IAppointmentRepository,
  UpdateAppointmentInput,
} from "../../repositories/IAppointmentRepository";
import type { PatientRecord } from "../../repositories/IPatientRepository";
import type { IAppointment } from "../models/Appointment";
import { Appointment } from "../models/Appointment";
import type { IPatient } from "../models/Patient";

function toAppointmentRecord(
  doc: HydratedDocument<IAppointment>,
): AppointmentRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString(),
    patientId: doc.patientId.toString(),
    primaryPhysician: doc.primaryPhysician,
    schedule: doc.schedule,
    status: doc.status,
    reason: doc.reason,
    note: doc.note,
    cancellationReason: doc.cancellationReason,
    // TASK-041: no fallback for treatmentId — an appointment that predates
    // this field genuinely has no treatment reference.
    treatmentId: doc.treatmentId?.toString(),
    // Schema `default: 30` only fires for newly-created documents (same
    // caveat as Treatment.estimatedDurationMinutes, TASK-040) — this
    // fallback guarantees existsOverlapping always has a real duration to
    // compute a real end time with, old appointment or new.
    durationMinutes: doc.durationMinutes ?? DEFAULT_TREATMENT_DURATION_MINUTES,
  };
}

function toPatientRecord(patient: IPatient): PatientRecord {
  return {
    id: patient._id.toString(),
    userId: patient.userId?.toString(),
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    birthDate: patient.birthDate,
    gender: patient.gender,
    address: patient.address,
    occupation: patient.occupation,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactNumber: patient.emergencyContactNumber,
    primaryPhysician: patient.primaryPhysician,
    insuranceProvider: patient.insuranceProvider,
    insurancePolicyNumber: patient.insurancePolicyNumber,
    allergies: patient.allergies,
    currentMedication: patient.currentMedication,
    familyMedicalHistory: patient.familyMedicalHistory,
    pastMedicalHistory: patient.pastMedicalHistory,
    identificationType: patient.identificationType,
    identificationNumber: patient.identificationNumber,
    identificationDocumentId: patient.identificationDocumentId,
    identificationDocumentUrl: patient.identificationDocumentUrl,
    privacyConsent: patient.privacyConsent,
  };
}

export class MongoAppointmentRepository implements IAppointmentRepository {
  async create(input: CreateAppointmentInput): Promise<AppointmentRecord> {
    const doc = await Appointment.create(input);
    return toAppointmentRecord(doc);
  }

  async findRecent(): Promise<AppointmentWithPatient[]> {
    const docs = await Appointment.find({})
      .sort({ createdAt: -1, _id: -1 })
      .populate<{ patientId: IPatient }>("patientId");

    return this.mapWithPatient(docs);
  }

  async findByDoctor(primaryPhysician: string): Promise<AppointmentWithPatient[]> {
    const docs = await Appointment.find({ primaryPhysician })
      .sort({ schedule: 1 })
      .populate<{ patientId: IPatient }>("patientId");

    return this.mapWithPatient(docs);
  }

  async findByDoctorInRange(
    primaryPhysician: string,
    start: Date,
    end: Date,
  ): Promise<AppointmentWithPatient[]> {
    const docs = await Appointment.find({
      primaryPhysician,
      status: { $ne: "cancelled" },
      schedule: { $gte: start, $lt: end },
    })
      .sort({ schedule: 1 })
      .populate<{ patientId: IPatient }>("patientId");

    return this.mapWithPatient(docs);
  }

  private mapWithPatient(docs: unknown[]): AppointmentWithPatient[] {
    return docs.map((rawDoc) => {
      const doc = rawDoc as HydratedDocument<IAppointment> & {
        patientId: IPatient;
      };
      const populatedPatient = doc.patientId as unknown as IPatient;
      const record = toAppointmentRecord(
        doc as unknown as HydratedDocument<IAppointment>,
      );
      return {
        ...record,
        patientId: populatedPatient._id.toString(),
        patient: toPatientRecord(populatedPatient),
      };
    });
  }

  async update(
    id: string,
    data: UpdateAppointmentInput,
  ): Promise<AppointmentRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Appointment.findByIdAndUpdate(id, data, {
      returnDocument: "after",
    });
    return doc ? toAppointmentRecord(doc) : null;
  }

  async findById(id: string): Promise<AppointmentRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Appointment.findById(id);
    return doc ? toAppointmentRecord(doc) : null;
  }

  async findBookedTimes(primaryPhysician: string, date: Date): Promise<string[]> {
    // Local time throughout, matching getAvailableSlots()'s use of
    // date.getDay() and the doctor availability picker's plain <input
    // type="time">: neither carries a timezone, both implicitly assume
    // "server-local = clinic time" for this MVP. Mixing UTC boundaries here
    // with local day-of-week there caused every slot to look booked/closed
    // whenever the server's local offset wasn't UTC+0.
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const docs = await Appointment.find({
      primaryPhysician,
      schedule: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: "cancelled" },
    });

    return docs.map((doc) => {
      const hours = doc.schedule.getHours().toString().padStart(2, "0");
      const minutes = doc.schedule.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    });
  }

  async existsOverlapping(
    primaryPhysician: string,
    schedule: Date,
    durationMinutes: number,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    // TASK-041: real overlap, not a fixed 30-minute/exact-time assumption.
    // Every non-cancelled appointment for this doctor that could possibly
    // overlap starts before the new appointment's end — narrow down with
    // that (indexed) range first, then compute each candidate's real end
    // time in-memory using its own snapshotted durationMinutes (falling
    // back to 30 for appointments that predate that field) and check for a
    // genuine interval overlap.
    const newStart = schedule.getTime();
    const newEnd = newStart + durationMinutes * 60_000;

    const candidates = await Appointment.find({
      primaryPhysician,
      status: { $ne: "cancelled" },
      schedule: { $lt: new Date(newEnd) },
      ...(excludeAppointmentId && mongoose.isValidObjectId(excludeAppointmentId)
        ? { _id: { $ne: excludeAppointmentId } }
        : {}),
    });

    return candidates.some((doc) => {
      const existingStart = doc.schedule.getTime();
      const existingDuration =
        doc.durationMinutes ?? DEFAULT_TREATMENT_DURATION_MINUTES;
      const existingEnd = existingStart + existingDuration * 60_000;
      return existingStart < newEnd && existingEnd > newStart;
    });
  }
}
