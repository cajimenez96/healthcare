import { describe, it, expect } from "vitest";

import { getRequiredRoleForPath } from "./getRequiredRoleForPath";

describe("getRequiredRoleForPath", () => {
  it("requires Administrador for /admin", () => {
    expect(getRequiredRoleForPath("/admin")).toBe("Administrador");
  });

  it("requires Administrador for nested /admin paths", () => {
    expect(getRequiredRoleForPath("/admin/settings")).toBe("Administrador");
  });

  it("requires Doctor for /doctor", () => {
    expect(getRequiredRoleForPath("/doctor")).toBe("Doctor");
  });

  it("requires Secretaria for /recepcion", () => {
    expect(getRequiredRoleForPath("/recepcion")).toBe("Secretaria");
  });

  it("returns undefined for unprotected paths", () => {
    expect(getRequiredRoleForPath("/")).toBeUndefined();
    expect(getRequiredRoleForPath("/login")).toBeUndefined();
    expect(getRequiredRoleForPath("/patients/123/register")).toBeUndefined();
  });
});
