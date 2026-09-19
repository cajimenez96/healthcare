"use server";

import { revalidatePath } from "next/cache";

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
  occupation?: string;
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

// GET PATIENT FOR AN APPOINTMENT (TASK-056: the unified "Nuevo turno" view's
// reschedule mode pre-fills the existing appointment's patient — gated like
// listPatients/findPatientByIdentificationNumber (Secretaria or Admin, the
// same roles that can reach that view), unlike getPatientById above which is
// Doctor-only and therefore unusable from an admin page.)
export const getPatientForAppointment = async (id: string) => {
  try {
    await requireSecretariaOrAdminSession();
    await connectToDatabase();
    const patient = await patientRepository.findById(id);

    return patient ? parseStringify(toPatient(patient)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while retrieving the patient for an appointment:",
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

export type ListPatientsFilters = {
  name?: string;
  identificationNumber?: string;
  // TASK-050: single free-text filter matching name OR identification
  // number — see IPatientRepository.PatientListFilters.search.
  search?: string;
};

// LIST PATIENTS (list + filter screen, TASK-035. Same dual-role access as
// createPatient — Secretaria is the primary front-desk user, Administrador
// also has access — no editing/creation happens from this screen. Also
// reused by NewAppointmentView's combined name-or-DNI patient search,
// TASK-050, via the `search` filter.)
export const listPatients = async (filters: ListPatientsFilters = {}) => {
  try {
    await requireSecretariaOrAdminSession();
    await connectToDatabase();

    const patients = await patientRepository.findAll({
      name: filters.name?.trim() || undefined,
      identificationNumber: filters.identificationNumber?.trim() || undefined,
      search: filters.search?.trim() || undefined,
    });

    return parseStringify(patients.map(toPatient));
  } catch (error) {
    console.error("An error occurred while listing patients:", error);
    return [];
  }
};

export type UpdatePatientParams = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  identificationType?: string;
  identificationNumber?: string;
  // Optional re-upload — omit to keep whatever document is already on file
  // (same "leave it as-is unless provided" shape as updateDoctor's `photo`,
  // TASK-036).
  identificationDocument?: FormData;
};

// UPDATE PATIENT (TASK-059: unified list+Dialog CRUD — same dual-role
// gating as createPatient/listPatients, editable field set matches
// CreatePatientForm's).
export const updatePatient = async ({
  id,
  identificationDocument,
  ...patient
}: UpdatePatientParams) => {
  try {
    await requireSecretariaOrAdminSession();
    await connectToDatabase();

    const existing = await patientRepository.findById(id);
    if (!existing) {
      return undefined;
    }

    let identificationDocumentId = existing.identificationDocumentId;
    let identificationDocumentUrl = existing.identificationDocumentUrl;

    const blobFile = identificationDocument?.get("blobFile") as Blob | null;
    const fileName = identificationDocument?.get("fileName") as string | null;

    if (blobFile && fileName) {
      const uploadedFile = await fileStorage.upload(blobFile, fileName);
      identificationDocumentId = uploadedFile.id;
      identificationDocumentUrl = uploadedFile.url;
    }

    const updated = await patientRepository.update(id, {
      ...patient,
      identificationDocumentId,
      identificationDocumentUrl,
    });

    revalidatePath("/admin/pacientes");
    revalidatePath("/recepcion/pacientes");

    return updated ? parseStringify(toPatient(updated)) : undefined;
  } catch (error) {
    console.error("An error occurred while updating the patient:", error);
  }
};

export type UpdatePatientMedicalBackgroundParams = {
  id: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
};

// UPDATE PATIENT MEDICAL BACKGROUND (antecedentes médicos) — TASK-069.
// Doctor-only, separate from updatePatient above (Secretaria/Admin,
// demographic/administrative fields): these are clinical fields nobody but
// the treating doctor should edit, and nothing in the app ever set them
// before this ticket — they existed on the Patient model/read views only.
// Uses MongoPatientRepository.updateMedicalBackground's $set-style partial
// update rather than update() (which replaces the full editable field set).
export const updatePatientMedicalBackground = async ({
  id,
  ...fields
}: UpdatePatientMedicalBackgroundParams) => {
  try {
    await requireDoctorSession();
    await connectToDatabase();

    const updated = await patientRepository.updateMedicalBackground(id, fields);

    revalidatePath(`/doctor/patient/${id}`);

    return updated ? parseStringify(toPatient(updated)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while updating the patient's medical background:",
      error
    );
  }
};

// DEACTIVATE / REACTIVATE PATIENT (TASK-059: soft-delete — a patient has
// turnos/historia clínica/facturación tied to it, so this never deletes the
// record, only flips isActive — same pattern as
// setDoctorActive/setSecretariaActive).
export const setPatientActive = async (id: string, isActive: boolean) => {
  try {
    await requireSecretariaOrAdminSession();
    await connectToDatabase();

    const updated = await patientRepository.setActiveById(id, isActive);

    revalidatePath("/admin/pacientes");
    revalidatePath("/recepcion/pacientes");

    return updated ? parseStringify(toPatient(updated)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while changing the patient's active status:",
      error,
    );
  }
};
