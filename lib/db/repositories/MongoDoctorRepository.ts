import type { HydratedDocument } from "mongoose";
import type { IDoctor } from "../models/Doctor";
import { Doctor } from "../models/Doctor";
import type {
  CreateDoctorInput,
  DoctorRecord,
  IDoctorRepository,
} from "../../repositories/IDoctorRepository";

function toDoctorRecord(doc: HydratedDocument<IDoctor>): DoctorRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    image: doc.image,
    specialty: doc.specialty,
    licenseNumber: doc.licenseNumber,
    availability: doc.availability.map(({ dayOfWeek, startTime, endTime }) => ({
      dayOfWeek,
      startTime,
      endTime,
    })),
    isActive: doc.isActive,
  };
}

export class MongoDoctorRepository implements IDoctorRepository {
  async create(input: CreateDoctorInput): Promise<DoctorRecord> {
    const doc = await Doctor.create(input);
    return toDoctorRecord(doc);
  }

  async findActive(): Promise<DoctorRecord[]> {
    const docs = await Doctor.find({ isActive: true }).sort({ name: 1 });
    return docs.map(toDoctorRecord);
  }
}
