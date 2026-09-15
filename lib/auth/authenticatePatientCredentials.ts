import bcrypt from "bcryptjs";

import type { IUserRepository, UserRole } from "../repositories/IUserRepository";

export interface AuthenticatedPatient {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function authenticatePatientCredentials(
  identificationNumber: string | undefined,
  pin: string | undefined,
  userRepository: Pick<IUserRepository, "findByIdentificationNumberWithPassword">,
): Promise<AuthenticatedPatient | null> {
  if (!identificationNumber || !pin) {
    return null;
  }

  const user = await userRepository.findByIdentificationNumberWithPassword(identificationNumber);
  if (!user?.hashedPassword) {
    return null;
  }

  // Defense in depth: this provider only ever authenticates the Paciente
  // role, even if a staff account somehow had an identificationNumber set.
  if (user.role !== "Paciente") {
    return null;
  }

  const isValid = await bcrypt.compare(pin, user.hashedPassword);
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
