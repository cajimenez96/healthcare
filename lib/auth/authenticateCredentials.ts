import bcrypt from "bcryptjs";

import type { IUserRepository, UserRole } from "../repositories/IUserRepository";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
}

export async function authenticateCredentials(
  email: string | undefined,
  password: string | undefined,
  userRepository: Pick<IUserRepository, "findByEmailWithPassword">,
): Promise<AuthenticatedUser | null> {
  if (!email || !password) {
    return null;
  }

  const user = await userRepository.findByEmailWithPassword(email);
  if (!user?.hashedPassword) {
    return null;
  }

  // Explicit `=== false` only: schema defaults don't backfill existing
  // documents, so pre-existing users read back with isActive === undefined
  // and must remain able to log in. Never use `!user.isActive` here.
  if (user.isActive === false) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctorId,
  };
}
