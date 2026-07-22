"use server";

import { connectToDatabase } from "../db/mongodb";
import { MongoDoctorRepository } from "../db/repositories/MongoDoctorRepository";
import { GridFsFileStorage } from "../storage/GridFsFileStorage";
import { parseStringify } from "../utils";
import type { CreateDoctorInput } from "../repositories/IDoctorRepository";

const doctorRepository = new MongoDoctorRepository();
const fileStorage = new GridFsFileStorage();

export type CreateDoctorParams = Omit<CreateDoctorInput, "image"> & {
  photo: FormData;
};

// CREATE DOCTOR
export const createDoctor = async ({ photo, ...doctor }: CreateDoctorParams) => {
  try {
    await connectToDatabase();

    const blobFile = photo.get("blobFile") as Blob | null;
    const fileName = photo.get("fileName") as string | null;

    if (!blobFile || !fileName) {
      throw new Error("A photo is required to create a doctor");
    }

    const uploadedFile = await fileStorage.upload(blobFile, fileName);

    const newDoctor = await doctorRepository.create({
      ...doctor,
      image: uploadedFile.url,
    });

    return parseStringify(newDoctor);
  } catch (error) {
    console.error("An error occurred while creating a new doctor:", error);
  }
};

// GET ACTIVE DOCTORS
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
