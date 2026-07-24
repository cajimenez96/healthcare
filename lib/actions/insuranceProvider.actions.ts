"use server";

import { connectToDatabase } from "../db/mongodb";
import { MongoInsuranceProviderRepository } from "../db/repositories/MongoInsuranceProviderRepository";
import { parseStringify } from "../utils";

const insuranceProviderRepository = new MongoInsuranceProviderRepository();

// GET ACTIVE INSURANCE PROVIDERS (public — used in patient onboarding)
export const getActiveInsuranceProviders = async () => {
  try {
    await connectToDatabase();
    const providers = await insuranceProviderRepository.findActive();

    return parseStringify(providers);
  } catch (error) {
    console.error(
      "An error occurred while retrieving active insurance providers:",
      error,
    );
    return [];
  }
};
