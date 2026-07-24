// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export interface InsuranceProviderRecord {
  id: string;
  name: string;
  isActive: boolean;
}

export interface IInsuranceProviderRepository {
  /**
   * Creates a new provider. If one with the same name already exists
   * (unique constraint violation), implementations must fall back to
   * returning the existing provider instead of throwing — mirrors
   * MongoUserRepository.create()'s idempotent-seed behavior.
   */
  create(name: string): Promise<InsuranceProviderRecord>;
  findActive(): Promise<InsuranceProviderRecord[]>;
}
