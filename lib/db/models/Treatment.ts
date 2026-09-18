import { Schema, model, models, Types } from "mongoose";

import { DEFAULT_TREATMENT_DURATION_MINUTES } from "../../../constants";

export interface ITreatment {
  _id: Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  // Required for new writes (default 30 for anything that doesn't specify
  // one explicitly). This default only fires when a document is
  // created/hydrated as new — it does NOT retroactively backfill documents
  // persisted before this field existed (same behavior already documented
  // for User.isActive in TASK-025). MongoTreatmentRepository applies the
  // same 30-minute fallback explicitly so every treatment, old or new,
  // always resolves to a real number for TASK-041.
  estimatedDurationMinutes: number;
}

const treatmentSchema = new Schema<ITreatment>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    isActive: { type: Boolean, required: true, default: true },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
      default: DEFAULT_TREATMENT_DURATION_MINUTES,
    },
  },
  { timestamps: true },
);

export const Treatment =
  models.Treatment || model<ITreatment>("Treatment", treatmentSchema);
