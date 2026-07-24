// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DoctorRecord {
  id: string;
  name: string;
  image: string;
  specialty: string;
  licenseNumber: string;
  availability: DoctorAvailability[];
  isActive: boolean;
}

export type CreateDoctorInput = Omit<DoctorRecord, "id" | "isActive">;
export type UpdateDoctorInput = Omit<DoctorRecord, "id" | "isActive">;

export interface IDoctorRepository {
  create(input: CreateDoctorInput): Promise<DoctorRecord>;
  findActive(): Promise<DoctorRecord[]>;
  findAll(): Promise<DoctorRecord[]>;
  findByName(name: string): Promise<DoctorRecord | null>;
  update(id: string, input: UpdateDoctorInput): Promise<DoctorRecord | null>;
  setActive(id: string, isActive: boolean): Promise<DoctorRecord | null>;
}
