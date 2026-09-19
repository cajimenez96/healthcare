import { getServerSession } from "next-auth/next";

import { authOptions } from "./authOptions";

export interface StaffSession {
  userId: string;
  name: string;
  role: "Secretaria" | "Administrador";
}

// Same defense-in-depth rationale as requireAdminSession/requireSecretariaSession:
// Server Actions bypass page-level middleware if invoked directly. Patient
// management (create/list/edit/deactivate — TASK-024/035/059) is shared by
// two roles at once — Secretaria (primary flow, /recepcion/pacientes) and
// Administrador (/admin/pacientes) — so this checks for either instead of a
// single fixed role, mirroring the single-role guards' shape.
export async function requireSecretariaOrAdminSession(): Promise<StaffSession> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (role !== "Secretaria" && role !== "Administrador") {
    throw new Error("Forbidden: Secretaria or Administrador role required");
  }

  return {
    userId: session!.user.id,
    name: session!.user.name ?? "",
    role,
  };
}
