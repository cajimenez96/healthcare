import type { HydratedDocument } from "mongoose";

import type {
  ClinicalNoteRecord,
  CreateClinicalNoteInput,
  IClinicalNoteRepository,
} from "../../repositories/IClinicalNoteRepository";
import type { IClinicalNote } from "../models/ClinicalNote";
import { ClinicalNote } from "../models/ClinicalNote";

function toClinicalNoteRecord(
  doc: HydratedDocument<IClinicalNote>,
): ClinicalNoteRecord {
  return {
    id: doc._id.toString(),
    patientId: doc.patientId.toString(),
    appointmentId: doc.appointmentId.toString(),
    doctorName: doc.doctorName,
    note: doc.note,
    // Explicit field mapping, not a subdocument spread: spreading a Mongoose
    // subdocument copies its internal properties, not the actual values.
    treatments: doc.treatments.map((t) => ({
      treatmentId: t.treatmentId.toString(),
      name: t.name,
      price: t.price,
    })),
    createdAt: doc.createdAt,
  };
}

export class MongoClinicalNoteRepository implements IClinicalNoteRepository {
  async create(input: CreateClinicalNoteInput): Promise<ClinicalNoteRecord> {
    const doc = await ClinicalNote.create(input);
    return toClinicalNoteRecord(doc);
  }

  async findByPatientId(patientId: string): Promise<ClinicalNoteRecord[]> {
    const docs = await ClinicalNote.find({ patientId }).sort({ createdAt: -1 });
    return docs.map(toClinicalNoteRecord);
  }

  async findByAppointmentId(appointmentId: string): Promise<ClinicalNoteRecord[]> {
    const docs = await ClinicalNote.find({ appointmentId }).sort({ createdAt: 1 });
    return docs.map(toClinicalNoteRecord);
  }
}
