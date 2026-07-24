import type { HydratedDocument } from "mongoose";
import type { IOdontogram } from "../models/Odontogram";
import { Odontogram } from "../models/Odontogram";
import type { Tooth } from "../../odontogram/createEmptyOdontogram";
import type {
  IOdontogramRepository,
  OdontogramRecord,
} from "../../repositories/IOdontogramRepository";

function toOdontogramRecord(
  doc: HydratedDocument<IOdontogram>,
): OdontogramRecord {
  return {
    id: doc._id.toString(),
    patientId: doc.patientId.toString(),
    // `faces` is a Mongoose single-nested subdocument, not a plain object —
    // its real values live behind getters, so a shallow `{ ...faces }`
    // spread only copies Mongoose's own internal properties ($__parent,
    // _doc, etc.) and silently drops every face value. Access each field
    // explicitly instead.
    teeth: doc.teeth.map(({ toothNumber, faces }) => ({
      toothNumber,
      faces: {
        mesial: faces.mesial,
        distal: faces.distal,
        vestibular: faces.vestibular,
        palatal: faces.palatal,
        oclusal: faces.oclusal,
      },
    })),
    updatedAt: doc.updatedAt,
  };
}

export class MongoOdontogramRepository implements IOdontogramRepository {
  async findByPatientId(patientId: string): Promise<OdontogramRecord | null> {
    const doc = await Odontogram.findOne({ patientId });
    return doc ? toOdontogramRecord(doc) : null;
  }

  async upsertByPatientId(
    patientId: string,
    teeth: Tooth[],
  ): Promise<OdontogramRecord> {
    const doc = await Odontogram.findOneAndUpdate(
      { patientId },
      { patientId, teeth },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    return toOdontogramRecord(doc);
  }
}
