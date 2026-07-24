import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export interface DoctorSession {
  userId: string;
  doctorId: string;
  name: string;
}

// Same defense-in-depth rationale as requireAdminSession: Server Actions
// bypass page-level middleware if invoked directly, so clinical actions
// must check the session (and the doctorId link from TASK-008) themselves.
export async function requireDoctorSession(): Promise<DoctorSession> {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "Doctor" || !session.user.doctorId) {
    throw new Error("Forbidden: Doctor role with a linked doctor profile required");
  }

  return {
    userId: session.user.id,
    doctorId: session.user.doctorId,
    name: session.user.name ?? "",
  };
}
