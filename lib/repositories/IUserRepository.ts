// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export type UserRole = "Administrador" | "Secretaria" | "Doctor" | "Paciente";

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  hashedPassword?: string;
  doctorId?: string;
  identificationType?: string;
  identificationNumber?: string;
  isActive?: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  doctorId?: string;
  identificationType?: string;
  identificationNumber?: string;
  isActive?: boolean;
}

export interface UserCredentials extends UserRecord {
  hashedPassword?: string;
}

export interface UpdateUserProfileInput {
  name: string;
  email: string;
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
  findByDoctorId(doctorId: string): Promise<UserRecord | null>;
  /**
   * Flips isActive on the User linked to the given doctorId. Returns null
   * (no-op) when no User is linked to that doctorId — a Doctor may not have
   * a login yet ("Crear acceso" is a separate, optional step).
   */
  setActiveByDoctorId(
    doctorId: string,
    isActive: boolean,
  ): Promise<UserRecord | null>;
  /**
   * Updates a User's own editable profile fields (name, email) by its own
   * _id — unlike setActiveByDoctorId, this is not routed through a linked
   * Doctor profile. Does not touch hashedPassword or role.
   * Rejects with an Error whose message is "EMAIL_TAKEN" when the new email
   * already belongs to a different user (unique index violation).
   */
  update(id: string, input: UpdateUserProfileInput): Promise<UserRecord | null>;
  /**
   * Flips isActive on the User with the given id directly — the general-
   * purpose counterpart to setActiveByDoctorId, for entities (like
   * Secretaria) whose User document IS the managed entity, with no separate
   * linked profile to route through.
   */
  setActiveById(id: string, isActive: boolean): Promise<UserRecord | null>;
}
