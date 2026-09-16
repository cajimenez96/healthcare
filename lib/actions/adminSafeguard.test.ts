import { describe, it, expect } from "vitest";

import type { UserRecord } from "../repositories/IUserRepository";

import { isLastActiveAdmin } from "./adminSafeguard";

// isLastActiveAdmin is the last-active-Administrador safeguard: it must
// decide, from a plain list of Administrador UserRecords, whether
// deactivating `targetId` would leave zero active Administradores. It is a
// pure function (no requireAdminSession/DB dependency) precisely so it can be
// unit-tested directly, following this project's convention of testing what
// a gated Server Action calls rather than the gated action itself.

const admin = (id: string, isActive?: boolean): UserRecord => ({
  id,
  name: `Admin ${id}`,
  email: `${id}@example.com`,
  phone: "N/A",
  role: "Administrador",
  isActive,
});

describe("isLastActiveAdmin", () => {
  it("returns true when the target is the only active Administrador", () => {
    const admins = [admin("1", true)];

    expect(isLastActiveAdmin(admins, "1")).toBe(true);
  });

  it("returns false when another active Administrador exists besides the target", () => {
    const admins = [admin("1", true), admin("2", true)];

    expect(isLastActiveAdmin(admins, "1")).toBe(false);
  });

  it("does not count already-inactive Administradores as active", () => {
    const admins = [admin("1", true), admin("2", false)];

    expect(isLastActiveAdmin(admins, "1")).toBe(true);
  });

  it("treats isActive === undefined as active, per TASK-025 convention for pre-migration documents", () => {
    const admins = [admin("1", undefined), admin("2", undefined)];

    expect(isLastActiveAdmin(admins, "1")).toBe(false);
  });

  it("excludes the target itself from the 'other active admins' count", () => {
    const admins = [admin("1", true)];

    // Deactivating "1" should not count "1" itself as another active admin.
    expect(isLastActiveAdmin(admins, "1")).toBe(true);
  });
});
