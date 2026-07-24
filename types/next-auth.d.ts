import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/repositories/IUserRepository";

declare module "next-auth" {
  interface User {
    role: UserRole;
    doctorId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      doctorId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    doctorId?: string;
  }
}
