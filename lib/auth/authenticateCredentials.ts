import bcrypt from "bcryptjs";
import type { IUserRepository, UserRole } from "../repositories/IUserRepository";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
