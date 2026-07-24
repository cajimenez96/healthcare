import mongoose, { type HydratedDocument } from "mongoose";
import type { IAppointment } from "../models/Appointment";
import { Appointment } from "../models/Appointment";
import type { IPatient } from "../models/Patient";
import type {
  AppointmentRecord,
  AppointmentWithPatient,
  CreateAppointmentInput,
  IAppointmentRepository,
  UpdateAppointmentInput,
} from "../../repositories/IAppointmentRepository";
import type { PatientRecord } from "../../repositories/IPatientRepository";

function toAppointmentRecord(
  doc: HydratedDocument<IAppointment>,
): AppointmentRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    patientId: doc.patientId.toString(),
    primaryPhysician: doc.primaryPhysician,
    schedule: doc.schedule,
    status: doc.status,
    reason: doc.reason,
    note: doc.note,
    cancellationReason: doc.cancellationReason,
  };
}

function toPatientRecord(patient: IPatient): PatientRecord {
  return {
    id: patient._id.toString(),
    userId: patient.userId.toString(),
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
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const count = await Appointment.countDocuments({
      primaryPhysician,
      schedule,
      status: { $ne: "cancelled" },
      ...(excludeAppointmentId && mongoose.isValidObjectId(excludeAppointmentId)
        ? { _id: { $ne: excludeAppointmentId } }
        : {}),
    });
    return count > 0;
  }
}
