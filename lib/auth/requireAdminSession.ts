import { getServerSession } from "next-auth/next";

import { authOptions } from "./authOptions";

// Defense in depth: middleware.ts already restricts /admin/* pages to the
// Administrador role, but Server Actions get their own HTTP endpoint under
// the hood and can be invoked directly, bypassing page-level middleware.
// Every mutating doctor action must check the session itself.
export async function requireAdminSession(): Promise<void> {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "Administrador") {
    throw new Error("Forbidden: Administrador role required");
  }
}
