import mongoose, { type HydratedDocument } from "mongoose";
import type { ITreatment } from "../models/Treatment";
import { Treatment } from "../models/Treatment";
import type {
  CreateTreatmentInput,
  ITreatmentRepository,
  TreatmentRecord,
  UpdateTreatmentInput,
} from "../../repositories/ITreatmentRepository";

function toTreatmentRecord(doc: HydratedDocument<ITreatment>): TreatmentRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    description: doc.description,
    isActive: doc.isActive,
  };
}

export class MongoTreatmentRepository implements ITreatmentRepository {
  async create(input: CreateTreatmentInput): Promise<TreatmentRecord> {
    const doc = await Treatment.create(input);
    return toTreatmentRecord(doc);
  }

  async findActive(): Promise<TreatmentRecord[]> {
    const docs = await Treatment.find({ isActive: true }).sort({ name: 1 });
    return docs.map(toTreatmentRecord);
  }

  async findAll(): Promise<TreatmentRecord[]> {
    const docs = await Treatment.find({}).sort({ name: 1 });
    return docs.map(toTreatmentRecord);
  }

  async update(
    id: string,
    input: UpdateTreatmentInput,
  ): Promise<TreatmentRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Treatment.findByIdAndUpdate(id, input, {
      returnDocument: "after",
    });
    return doc ? toTreatmentRecord(doc) : null;
  }

  async setActive(id: string, isActive: boolean): Promise<TreatmentRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await Treatment.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" },
    );
    return doc ? toTreatmentRecord(doc) : null;
  }
}
