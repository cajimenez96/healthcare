import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// QA-only helper: reads directly from Mongo to fetch data the UI never
// renders back (e.g. the uploaded identification document's fileId, needed
// for SEG-02). Sniffing the Server Action's RSC network response for this
// proved unreliable in Playwright (CDP loses the body on fast
// redirects/streamed responses), so this is the robust alternative -
// read-only, same pattern as scripts/qa-seed-secretaria.ts.
export async function getPatientIdentificationFileId(
  userId: string,
): Promise<string | undefined> {
  const { connectToDatabase } = await import("../lib/db/mongodb");
  const { Patient } = await import("../lib/db/models/Patient");

  await connectToDatabase();
  const patient = await Patient.findOne({ userId });
  return patient?.identificationDocumentId || undefined;
}
