import mongoose, { type HydratedDocument } from "mongoose";

import type {
  CreateUserInput,
  IUserRepository,
  UpdateUserProfileInput,
  UserCredentials,
  UserRecord,
  UserRole,
} from "../../repositories/IUserRepository";
import type { IUser } from "../models/User";
import { User } from "../models/User";

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

function toUserRecord(doc: HydratedDocument<IUser>): UserRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    doctorId: doc.doctorId?.toString(),
    identificationType: doc.identificationType,
    identificationNumber: doc.identificationNumber,
    isActive: doc.isActive,
  };
}

export class MongoUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<UserRecord> {
    try {
      const doc = await User.create(input);
      return toUserRecord(doc);
    } catch (error: any) {
      if (error?.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
        const existing = await this.findByEmail(input.email);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const doc = await User.findOne({ email });
    return doc ? toUserRecord(doc) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await User.findById(id);
    return doc ? toUserRecord(doc) : null;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserCredentials | null> {
    const doc = await User.findOne({ email }).select("+hashedPassword");
    return doc ? { ...toUserRecord(doc), hashedPassword: doc.hashedPassword } : null;
  }

  async findByRole(role: UserRole): Promise<UserRecord[]> {
    const docs = await User.find({ role });
    return docs.map(toUserRecord);
  }

  async findByDoctorId(doctorId: string): Promise<UserRecord | null> {
    if (!mongoose.isValidObjectId(doctorId)) {
      return null;
    }
    const doc = await User.findOne({ doctorId });
    return doc ? toUserRecord(doc) : null;
  }

  async setActiveByDoctorId(
    doctorId: string,
    isActive: boolean,
  ): Promise<UserRecord | null> {
    if (!mongoose.isValidObjectId(doctorId)) {
      return null;
    }
    const doc = await User.findOneAndUpdate(
      { doctorId },
      { isActive },
      { returnDocument: "after" },
    );
    return doc ? toUserRecord(doc) : null;
  }

  async update(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<UserRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    try {
      const doc = await User.findByIdAndUpdate(id, input, {
        returnDocument: "after",
      });
      return doc ? toUserRecord(doc) : null;
    } catch (error: any) {
      if (error?.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
        throw new Error("EMAIL_TAKEN");
      }
      throw error;
    }
  }

  async setActiveById(
    id: string,
    isActive: boolean,
  ): Promise<UserRecord | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await User.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after" },
    );
    return doc ? toUserRecord(doc) : null;
  }
}
