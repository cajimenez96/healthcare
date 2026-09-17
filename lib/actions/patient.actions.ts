"use server";

import { requireAdminSession } from "../auth/requireAdminSession";
import { requireDoctorSession } from "../auth/requireDoctorSession";
import { requireSecretariaOrAdminSession } from "../auth/requireSecretariaOrAdminSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoPatientRepository } from "../db/repositories/MongoPatientRepository";
import { GridFsFileStorage } from "../storage/GridFsFileStorage";
import { parseStringify } from "../utils";

import { toPatient } from "./serializers";

const patientRepository = new MongoPatientRepository();
const fileStorage = new GridFsFileStorage();

export type CreatePatientParams = {
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  identificationType: string;
  identificationNumber: string;
  identificationDocument: FormData;
};

// CREATE PATIENT (staff-side onboarding — TASK-023/024. Patients no longer
// have any login of their own, so this never touches the User collection;
// the record stands on its own, same pattern as a Doctor profile with no
// linked login access yet — see createDoctorAccess in doctor.actions.ts).
export const createPatient = async ({
  identificationDocument,
  ...patient
}: CreatePatientParams) => {
  try {
    await requireSecretariaOrAdminSession();
    await connectToDatabase();

    let uploadedFile: { id: string; url: string } | undefined;
    const blobFile = identificationDocument.get("blobFile") as Blob | null;
    const fileName = identificationDocument.get("fileName") as string | null;

    if (blobFile && fileName) {
      uploadedFile = await fileStorage.upload(blobFile, fileName);
    }

    const newPatient = await patientRepository.create({
      ...patient,
      // Consent is captured by the front desk as part of staff-mediated
      // onboarding (paper/verbal, outside this system) rather than through
      // a checkbox in this form — there's no patient present at a keyboard
      // to tick one themselves anymore.
      privacyConsent: true,
      identificationDocumentId: uploadedFile?.id,
      identificationDocumentUrl: uploadedFile?.url,
    });

    return parseStringify(toPatient(newPatient));
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
  }
};

// GET PATIENT BY ID (for the Doctor's clinical view — patientId, not userId)
export const getPatientById = async (id: string) => {
  try {
    await requireDoctorSession();
    await connectToDatabase();
    const patient = await patientRepository.findById(id);

    return patient ? parseStringify(toPatient(patient)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while retrieving the patient details:",
      error
    );
  }
};

// FIND PATIENT BY IDENTIFICATION NUMBER (Admin — direct appointment booking,
// TASK-018/033. Front-desk staff identify patients by DNI, not email/phone.)
export const findPatientByIdentificationNumber = async (query: string) => {
  try {
    await requireAdminSession();
    await connectToDatabase();
    const patient = await patientRepository.findByIdentificationNumber(query.trim());

    return patient ? parseStringify(toPatient(patient)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while searching for the patient:",
      error
    );
  }
};
