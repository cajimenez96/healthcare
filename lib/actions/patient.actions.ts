"use server";

import { MongoUserRepository } from "../db/repositories/MongoUserRepository";
import { MongoPatientRepository } from "../db/repositories/MongoPatientRepository";
import { GridFsFileStorage } from "../storage/GridFsFileStorage";
import { parseStringify } from "../utils";
import { toPatient, toUser } from "./serializers";

const userRepository = new MongoUserRepository();
const patientRepository = new MongoPatientRepository();
const fileStorage = new GridFsFileStorage();

// CREATE USER
export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await userRepository.create(user);

    return parseStringify(toUser(newUser));
  } catch (error) {
    console.error("An error occurred while creating a new user:", error);
  }
};

// GET USER
export const getUser = async (userId: string) => {
  try {
    const user = await userRepository.findById(userId);

    return user ? parseStringify(toUser(user)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while retrieving the user details:",
      error
    );
  }
};

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let uploadedFile: { id: string; url: string } | undefined;

    if (identificationDocument) {
      const blobFile = identificationDocument.get("blobFile") as Blob | null;
      const fileName = identificationDocument.get("fileName") as
        | string
        | null;

      if (blobFile && fileName) {
        uploadedFile = await fileStorage.upload(blobFile, fileName);
      }
    }

    const newPatient = await patientRepository.create({
      ...patient,
      identificationDocumentId: uploadedFile?.id,
      identificationDocumentUrl: uploadedFile?.url,
    });

    return parseStringify(toPatient(newPatient));
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
  }
};

// GET PATIENT
export const getPatient = async (userId: string) => {
  try {
    const patient = await patientRepository.findByUserId(userId);

    return patient ? parseStringify(toPatient(patient)) : undefined;
  } catch (error) {
    console.error(
      "An error occurred while retrieving the patient details:",
      error
    );
  }
};
