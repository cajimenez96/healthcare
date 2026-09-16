"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../auth/requireAdminSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { parseStringify } from "../utils";

import { isLastActiveAdmin } from "./adminSafeguard";

const userRepository = new MongoUserRepository();

// CREATE ADMIN ACCESS (no linked entity, unlike Doctor's doctorId)
export const createAdminAccess = async (
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
      role: "Administrador",
      hashedPassword,
    });

    revalidatePath("/admin/admins");
    return parseStringify(user);
  } catch (error) {
    console.error("An error occurred while creating admin access:", error);
  }
};

// GET ADMINS
export const getAdmins = async () => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const admins = await userRepository.findByRole("Administrador");
    return parseStringify(admins);
  } catch (error) {
    console.error("An error occurred while retrieving admins:", error);
    return [];
  }
};

// UPDATE ADMIN (name, email — no password/role change, see IUserRepository.update)
export const updateAdmin = async (
  id: string,
  name: string,
  email: string,
) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const updated = await userRepository.update(id, { name, email });

    revalidatePath("/admin/admins");
    return updated ? parseStringify(updated) : undefined;
  } catch (error: any) {
    if (error?.message === "EMAIL_TAKEN") {
      return { error: "EMAIL_TAKEN" as const };
    }
    console.error("An error occurred while updating the admin:", error);
  }
};

// DEACTIVATE / REACTIVATE ADMIN (revokes/restores login via User.isActive)
// Deactivation is refused when the target is the last active Administrador —
// see isLastActiveAdmin above.
export const setAdminActive = async (id: string, isActive: boolean) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    if (!isActive) {
      const admins = await userRepository.findByRole("Administrador");
      if (isLastActiveAdmin(admins, id)) {
        return { error: "LAST_ADMIN" as const };
      }
    }

    const updated = await userRepository.setActiveById(id, isActive);

    revalidatePath("/admin/admins");
    return updated ? parseStringify(updated) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while changing the admin's active status:",
      error,
    );
  }
};
