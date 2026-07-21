import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "../mongodb";
import { User } from "../models/User";
import { MongoUserRepository } from "./MongoUserRepository";

describe("MongoUserRepository", () => {
  const repository = new MongoUserRepository();

  beforeAll(async () => {
    await connectToDatabase();
    await User.init();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("create", () => {
    it("creates a new user and returns it with a string id", async () => {
      const user = await repository.create({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+5491122334455",
      });

      expect(typeof user.id).toBe("string");
      expect(user.name).toBe("Jane Doe");
      expect(user.email).toBe("jane@example.com");
      expect(user.phone).toBe("+5491122334455");
    });

    it("falls back to the existing user on a duplicate email instead of throwing", async () => {
      const original = await repository.create({
        name: "Original",
        email: "dup@example.com",
        phone: "+1",
      });

      const result = await repository.create({
        name: "Attempted Duplicate",
        email: "dup@example.com",
        phone: "+2",
      });

      expect(result.id).toBe(original.id);
      expect(result.name).toBe("Original");
      expect(result.phone).toBe("+1");
    });
  });

  describe("findByEmail", () => {
    it("returns null when no user matches", async () => {
      const result = await repository.findByEmail("missing@example.com");
      expect(result).toBeNull();
    });

    it("returns the user when found", async () => {
      await repository.create({
        name: "Found Me",
        email: "found@example.com",
        phone: "+123",
      });

      const result = await repository.findByEmail("found@example.com");
      expect(result?.name).toBe("Found Me");
    });
  });

  describe("findById", () => {
    it("returns null when no user matches a well-formed id", async () => {
      const result = await repository.findById(new mongoose.Types.ObjectId().toString());
      expect(result).toBeNull();
    });

    it("returns null for a malformed id instead of throwing", async () => {
      await expect(repository.findById("not-an-object-id")).resolves.toBeNull();
    });

    it("returns the user when found", async () => {
      const created = await repository.create({
        name: "By Id",
        email: "byid@example.com",
        phone: "+456",
      });

      const result = await repository.findById(created.id);
      expect(result?.email).toBe("byid@example.com");
    });
  });
});
