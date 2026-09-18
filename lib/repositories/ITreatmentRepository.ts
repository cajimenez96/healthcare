// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export interface TreatmentRecord {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  estimatedDurationMinutes: number;
}

export type CreateTreatmentInput = Omit<TreatmentRecord, "id" | "isActive">;
export type UpdateTreatmentInput = Omit<TreatmentRecord, "id" | "isActive">;

export interface ITreatmentRepository {
  create(input: CreateTreatmentInput): Promise<TreatmentRecord>;
  findById(id: string): Promise<TreatmentRecord | null>;
  findActive(): Promise<TreatmentRecord[]>;
  findAll(): Promise<TreatmentRecord[]>;
  update(id: string, input: UpdateTreatmentInput): Promise<TreatmentRecord | null>;
  setActive(id: string, isActive: boolean): Promise<TreatmentRecord | null>;
}
