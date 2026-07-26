// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export type UserRole = "Administrador" | "Secretaria" | "Doctor" | "Paciente";

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  hashedPassword?: string;
  doctorId?: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  doctorId?: string;
}

export interface UserCredentials extends UserRecord {
  hashedPassword?: string;
}

export interface IUserRepository {
  /**
   * Creates a new user. If a user with the same email already exists
   * (unique constraint violation), implementations must fall back to
   * returning the existing user instead of throwing.
   */
  create(input: CreateUserInput): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /**
   * Same lookup as findByEmail, but also includes hashedPassword (excluded
   * by default via the schema's `select: false`). Only for use by the
   * authentication flow — never expose this result outside it.
   */
  findByEmailWithPassword(email: string): Promise<UserCredentials | null>;
  findByRole(role: UserRole): Promise<UserRecord[]>;
}
