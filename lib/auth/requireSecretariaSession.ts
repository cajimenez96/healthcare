import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export interface SecretariaSession {
  userId: string;
  name: string;
}

// Same defense-in-depth rationale as requireAdminSession/requireDoctorSession:
// Server Actions bypass page-level middleware if invoked directly, so the
// billing/close-out actions must check the session themselves.
export async function requireSecretariaSession(): Promise<SecretariaSession> {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "Secretaria") {
    throw new Error("Forbidden: Secretaria role required");
  }

  return {
    userId: session.user.id,
    name: session.user.name ?? "",
  };
}
