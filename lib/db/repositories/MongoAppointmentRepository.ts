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

    return docs.map((doc) => {
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
}
