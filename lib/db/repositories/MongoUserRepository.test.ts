import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { User } from "../models/User";
import { connectToDatabase } from "../mongodb";

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

  describe("doctorId", () => {
    it("persists and returns doctorId for a Doctor-role user", async () => {
      const doctorId = new mongoose.Types.ObjectId().toString();

      const user = await repository.create({
        name: "Dr. Cameron",
        email: "drcameron2@example.com",
        phone: "+1",
        role: "Doctor",
        hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
        doctorId,
      });

      expect(user.doctorId).toBe(doctorId);
    });
  });

  describe("role", () => {
    it("defaults new users to the Paciente role", async () => {
      const user = await repository.create({
        name: "Default Role",
        email: "defaultrole@example.com",
        phone: "+1",
      });

      expect(user.role).toBe("Paciente");
    });

    it("persists a staff role and hashed password when provided", async () => {
      const user = await repository.create({
        name: "Staff",
        email: "staffrole@example.com",
        phone: "+1",
        role: "Administrador",
        hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
      });

      expect(user.role).toBe("Administrador");
    });
  });

  describe("findByEmailWithPassword", () => {
    it("returns null when no user matches", async () => {
      const result = await repository.findByEmailWithPassword(
        "missing@example.com",
      );

      expect(result).toBeNull();
    });

    it("includes the hashed password and role", async () => {
      await repository.create({
        name: "Staff",
        email: "creds@example.com",
        phone: "+1",
        role: "Doctor",
        hashedPassword: "$2a$10$abcdefghijklmnopqrstuv",
      });

      const result = await repository.findByEmailWithPassword(
        "creds@example.com",
      );

      expect(result?.role).toBe("Doctor");
      expect(result?.hashedPassword).toBe("$2a$10$abcdefghijklmnopqrstuv");
    });
  });

  describe("findByRole", () => {
    it("returns only users with the given role", async () => {
      await repository.create({
        name: "Secretaria Uno",
        email: "sec1@example.com",
        phone: "+1",
        role: "Secretaria",
      });
      await repository.create({
        name: "Secretaria Dos",
        email: "sec2@example.com",
        phone: "+1",
        role: "Secretaria",
      });
      await repository.create({
        name: "Doctor Uno",
        email: "doc1@example.com",
        phone: "+1",
        role: "Doctor",
      });

      const result = await repository.findByRole("Secretaria");

      expect(result.map((u) => u.email).sort()).toEqual([
        "sec1@example.com",
        "sec2@example.com",
      ]);
    });

    it("returns an empty array when no user has that role", async () => {
      const result = await repository.findByRole("Secretaria");
      expect(result).toEqual([]);
    });
  });
});
