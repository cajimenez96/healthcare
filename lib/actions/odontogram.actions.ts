"use server";

import { revalidatePath } from "next/cache";

import { requireDoctorSession } from "../auth/requireDoctorSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoOdontogramRepository } from "../db/repositories/MongoOdontogramRepository";
import { createEmptyOdontogram, type Tooth } from "../odontogram/createEmptyOdontogram";
import { parseStringify } from "../utils";

const odontogramRepository = new MongoOdontogramRepository();

// GET ODONTOGRAM (creates an empty one on first read, so the doctor always has 32 teeth to work with)
export const getOdontogram = async (patientId: string) => {
  try {
    await requireDoctorSession();
    await connectToDatabase();

    const existing = await odontogramRepository.findByPatientId(patientId);
    if (existing) {
      return parseStringify(existing);
    }

    return parseStringify({
      id: null,
      patientId,
      teeth: createEmptyOdontogram(),
      updatedAt: null,
    });
  } catch (error) {
    console.error("An error occurred while retrieving the odontogram:", error);
    return null;
  }
};

// SAVE ODONTOGRAM
export const saveOdontogram = async (patientId: string, teeth: Tooth[]) => {
  try {
    await requireDoctorSession();
    await connectToDatabase();

    const saved = await odontogramRepository.upsertByPatientId(patientId, teeth);

    revalidatePath(`/doctor/patient/${patientId}`);
    return parseStringify(saved);
  } catch (error) {
    console.error("An error occurred while saving the odontogram:", error);
  }
};
