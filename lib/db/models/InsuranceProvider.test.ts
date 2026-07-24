import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { getValidationError } from "./testHelpers";
import { InsuranceProvider } from "./InsuranceProvider";

describe("InsuranceProvider model", () => {
  beforeAll(async () => {
    await connectToDatabase();
    await InsuranceProvider.init();
  });

  afterEach(async () => {
    await InsuranceProvider.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("requires name", async () => {
    const error = await getValidationError(new InsuranceProvider({}));

    expect(error.errors.name).toBeDefined();
  });

  it("creates a valid insurance provider, active by default", async () => {
    const provider = await InsuranceProvider.create({
      name: "Particular / Sin Convenio",
    });

    expect(provider.name).toBe("Particular / Sin Convenio");
    expect(provider.isActive).toBe(true);
  });

  it("rejects a duplicate name", async () => {
    await InsuranceProvider.create({ name: "OSDE" });

    await expect(
      InsuranceProvider.create({ name: "OSDE" }),
    ).rejects.toThrow();
  });
});
