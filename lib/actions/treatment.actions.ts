"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../auth/requireAdminSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoTreatmentRepository } from "../db/repositories/MongoTreatmentRepository";
import type { CreateTreatmentInput, UpdateTreatmentInput } from "../repositories/ITreatmentRepository";
import { parseStringify } from "../utils";

const treatmentRepository = new MongoTreatmentRepository();

// CREATE TREATMENT
export const createTreatment = async (input: CreateTreatmentInput) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const created = await treatmentRepository.create(input);

    revalidatePath("/admin/treatments");
    return parseStringify(created);
  } catch (error) {
    console.error("An error occurred while creating a new treatment:", error);
  }
};

// UPDATE TREATMENT
export const updateTreatment = async (id: string, input: UpdateTreatmentInput) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const updated = await treatmentRepository.update(id, input);

    revalidatePath("/admin/treatments");
    return updated ? parseStringify(updated) : undefined;
  } catch (error) {
    console.error("An error occurred while updating the treatment:", error);
  }
};

// DEACTIVATE / REACTIVATE TREATMENT
export const setTreatmentActive = async (id: string, isActive: boolean) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const updated = await treatmentRepository.setActive(id, isActive);

    revalidatePath("/admin/treatments");
    return updated ? parseStringify(updated) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while changing the treatment's active status:",
      error,
    );
  }
};

// GET ACTIVE TREATMENTS (for future use in TASK-012's billing flow)
export const getActiveTreatments = async () => {
  try {
    await connectToDatabase();
    const treatments = await treatmentRepository.findActive();

    return parseStringify(treatments);
  } catch (error) {
    console.error("An error occurred while retrieving active treatments:", error);
    return [];
  }
};

// GET ALL TREATMENTS (for admin management, includes inactive)
export const getAllTreatments = async () => {
  try {
    await connectToDatabase();
    const treatments = await treatmentRepository.findAll();

    return parseStringify(treatments);
  } catch (error) {
    console.error("An error occurred while retrieving treatments:", error);
    return [];
  }
};
