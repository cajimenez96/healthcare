import type { Document , Error as MongooseError } from "mongoose";

export async function getValidationError(
  doc: Document,
): Promise<MongooseError.ValidationError> {
  try {
    await doc.validate();
    throw new Error("Expected validation to fail, but it passed");
  } catch (error) {
    return error as MongooseError.ValidationError;
  }
}
