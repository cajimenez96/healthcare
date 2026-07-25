import mongoose, { type HydratedDocument } from "mongoose";

import type {
  CreateDoctorInput,
  DoctorRecord,
  IDoctorRepository,
  UpdateDoctorInput,
} from "../../repositories/IDoctorRepository";
import type { IDoctor } from "../models/Doctor";
import { Doctor } from "../models/Doctor";

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

  async findAll(): Promise<DoctorRecord[]> {
    const docs = await Doctor.find({}).sort({ name: 1 });
    return docs.map(toDoctorRecord);
  }

  async findByName(name: string): Promise<DoctorRecord | null> {
    const doc = await Doctor.findOne({ name });
    return doc ? toDoctorRecord(doc) : null;
  }

  async findById(id: string): Promise<DoctorRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Doctor.findById(id);
    return doc ? toDoctorRecord(doc) : null;
  }

  async update(
    id: string,
    input: UpdateDoctorInput,
  ): Promise<DoctorRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Doctor.findByIdAndUpdate(id, input, {
      returnDocument: "after",
    });
    return doc ? toDoctorRecord(doc) : null;
  }

  async setActive(id: string, isActive: boolean): Promise<DoctorRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Doctor.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" },
    );
    return doc ? toDoctorRecord(doc) : null;
  }
}
