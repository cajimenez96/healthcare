import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { InsuranceProvider } from "../models/InsuranceProvider";
import { connectToDatabase } from "../mongodb";

import { MongoInsuranceProviderRepository } from "./MongoInsuranceProviderRepository";

describe("MongoInsuranceProviderRepository", () => {
  const repository = new MongoInsuranceProviderRepository();

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

  describe("create", () => {
    it("creates a provider active by default", async () => {
      const provider = await repository.create("Particular / Sin Convenio");

      expect(typeof provider.id).toBe("string");
      expect(provider.name).toBe("Particular / Sin Convenio");
      expect(provider.isActive).toBe(true);
    });

    it("falls back to the existing provider on a duplicate name instead of throwing", async () => {
      const original = await repository.create("OSDE");
      const result = await repository.create("OSDE");

      expect(result.id).toBe(original.id);
    });
  });

  describe("findActive", () => {
    it("returns only active providers", async () => {
      await repository.create("Particular / Sin Convenio");
      await InsuranceProvider.create({ name: "Discontinued", isActive: false });

      const result = await repository.findActive();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Particular / Sin Convenio");
    });
  });
});
