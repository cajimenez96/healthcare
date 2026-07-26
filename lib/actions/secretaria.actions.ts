"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../auth/requireAdminSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { parseStringify } from "../utils";

const userRepository = new MongoUserRepository();

// CREATE SECRETARIA ACCESS (no linked entity, unlike Doctor's doctorId)
export const createSecretariaAccess = async (
  name: string,
  email: string,
  password: string,
) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      name,
      email,
      phone: "N/A",
      role: "Secretaria",
      hashedPassword,
    });

    revalidatePath("/admin/secretarias");
    return parseStringify(user);
  } catch (error) {
    console.error("An error occurred while creating secretaria access:", error);
  }
};

// GET SECRETARIAS
export const getSecretarias = async () => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const secretarias = await userRepository.findByRole("Secretaria");
    return parseStringify(secretarias);
  } catch (error) {
    console.error("An error occurred while retrieving secretarias:", error);
    return [];
  }
};
