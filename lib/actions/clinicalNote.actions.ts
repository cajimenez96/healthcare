"use server";

import { revalidatePath } from "next/cache";
import { requireDoctorSession } from "../auth/requireDoctorSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoClinicalNoteRepository } from "../db/repositories/MongoClinicalNoteRepository";
import { parseStringify } from "../utils";

const clinicalNoteRepository = new MongoClinicalNoteRepository();

// CREATE CLINICAL NOTE
export const createClinicalNote = async (
  patientId: string,
  appointmentId: string,
  note: string,
) => {
  try {
    const doctorSession = await requireDoctorSession();
    await connectToDatabase();

    const created = await clinicalNoteRepository.create({
      patientId,
      appointmentId,
      doctorName: doctorSession.name,
      note,
    });

    revalidatePath(`/doctor/patient/${patientId}`);
    return parseStringify(created);
  } catch (error) {
    console.error("An error occurred while creating a clinical note:", error);
  }
};

// GET CLINICAL NOTES FOR A PATIENT
export const getClinicalNotesForPatient = async (patientId: string) => {
  try {
    await requireDoctorSession();
    await connectToDatabase();

    const notes = await clinicalNoteRepository.findByPatientId(patientId);
    return parseStringify(notes);
  } catch (error) {
    console.error("An error occurred while retrieving clinical notes:", error);
    return [];
  }
};
