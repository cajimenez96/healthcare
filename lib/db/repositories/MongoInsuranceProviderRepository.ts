import type { HydratedDocument } from "mongoose";

import type {
  IInsuranceProviderRepository,
  InsuranceProviderRecord,
} from "../../repositories/IInsuranceProviderRepository";
import type { IInsuranceProvider } from "../models/InsuranceProvider";
import { InsuranceProvider } from "../models/InsuranceProvider";

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

function toInsuranceProviderRecord(
  doc: HydratedDocument<IInsuranceProvider>,
): InsuranceProviderRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    isActive: doc.isActive,
  };
}

export class MongoInsuranceProviderRepository
  implements IInsuranceProviderRepository
{
  async create(name: string): Promise<InsuranceProviderRecord> {
    try {
      const doc = await InsuranceProvider.create({ name });
      return toInsuranceProviderRecord(doc);
    } catch (error: any) {
      if (error?.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
        const existing = await InsuranceProvider.findOne({ name });
        if (existing) {
          return toInsuranceProviderRecord(existing);
        }
      }
      throw error;
    }
  }

  async findActive(): Promise<InsuranceProviderRecord[]> {
    const docs = await InsuranceProvider.find({ isActive: true }).sort({ name: 1 });
    return docs.map(toInsuranceProviderRecord);
  }
}
