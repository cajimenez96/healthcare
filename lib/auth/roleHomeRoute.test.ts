import { describe, it, expect } from "vitest";
import { getRoleHomeRoute } from "./roleHomeRoute";

describe("getRoleHomeRoute", () => {
  it("routes Administrador to /admin", () => {
    expect(getRoleHomeRoute("Administrador")).toBe("/admin");
  });

  it("routes Secretaria to /recepcion", () => {
    expect(getRoleHomeRoute("Secretaria")).toBe("/recepcion");
  });

  it("routes Doctor to /doctor", () => {
    expect(getRoleHomeRoute("Doctor")).toBe("/doctor");
  });

  it("routes Paciente to /", () => {
    expect(getRoleHomeRoute("Paciente")).toBe("/");
  });
});
