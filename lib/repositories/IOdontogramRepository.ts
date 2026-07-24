// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

import type { Tooth } from "../odontogram/createEmptyOdontogram";

export interface OdontogramRecord {
  id: string;
  patientId: string;
  teeth: Tooth[];
  updatedAt: Date;
}

export interface IOdontogramRepository {
  findByPatientId(patientId: string): Promise<OdontogramRecord | null>;
  /** Creates the odontogram for a patient if none exists yet, or replaces its teeth otherwise. */
  upsertByPatientId(patientId: string, teeth: Tooth[]): Promise<OdontogramRecord>;
}
