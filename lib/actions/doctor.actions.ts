"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "../auth/requireAdminSession";
import { connectToDatabase } from "../db/mongodb";
import { MongoDoctorRepository } from "../db/repositories/MongoDoctorRepository";
import { GridFsFileStorage } from "../storage/GridFsFileStorage";
import { parseStringify } from "../utils";
import type { CreateDoctorInput } from "../repositories/IDoctorRepository";

const doctorRepository = new MongoDoctorRepository();
const fileStorage = new GridFsFileStorage();

async function uploadPhoto(photo: FormData): Promise<string> {
  const blobFile = photo.get("blobFile") as Blob | null;
  const fileName = photo.get("fileName") as string | null;

  if (!blobFile || !fileName) {
    throw new Error("A photo is required");
  }

  const uploadedFile = await fileStorage.upload(blobFile, fileName);
  return uploadedFile.url;
}

export type CreateDoctorParams = Omit<CreateDoctorInput, "image"> & {
  photo: FormData;
};

// CREATE DOCTOR
export const createDoctor = async ({ photo, ...doctor }: CreateDoctorParams) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const image = await uploadPhoto(photo);
    const newDoctor = await doctorRepository.create({ ...doctor, image });

    revalidatePath("/admin/doctors");
    return parseStringify(newDoctor);
  } catch (error) {
    console.error("An error occurred while creating a new doctor:", error);
  }
};

export type UpdateDoctorParams = {
  id: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  availability: CreateDoctorInput["availability"];
  existingImage: string;
  photo?: FormData;
};

// UPDATE DOCTOR
export const updateDoctor = async ({
  id,
  existingImage,
  photo,
  ...doctor
}: UpdateDoctorParams) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const image = photo ? await uploadPhoto(photo) : existingImage;
    const updatedDoctor = await doctorRepository.update(id, {
      ...doctor,
      image,
    });

    revalidatePath("/admin/doctors");
    return updatedDoctor ? parseStringify(updatedDoctor) : undefined;
  } catch (error) {
    console.error("An error occurred while updating the doctor:", error);
  }
};

// DEACTIVATE / REACTIVATE DOCTOR
export const setDoctorActive = async (id: string, isActive: boolean) => {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const updatedDoctor = await doctorRepository.setActive(id, isActive);

    revalidatePath("/admin/doctors");
    return updatedDoctor ? parseStringify(updatedDoctor) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while changing the doctor's active status:",
      error,
    );
  }
};

// GET ACTIVE DOCTORS (for booking flows — patients/staff must only pick an active doctor)
export const getActiveDoctors = async () => {
  try {
    await connectToDatabase();
    const doctors = await doctorRepository.findActive();

    return parseStringify(doctors);
  } catch (error) {
    console.error("An error occurred while retrieving active doctors:", error);
    return [];
  }
};

// GET ALL DOCTORS (for admin management and historical display, includes inactive)
export const getAllDoctors = async () => {
  try {
    await connectToDatabase();
    const doctors = await doctorRepository.findAll();

    return parseStringify(doctors);
  } catch (error) {
    console.error("An error occurred while retrieving doctors:", error);
    return [];
  }
};
