// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
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
}
