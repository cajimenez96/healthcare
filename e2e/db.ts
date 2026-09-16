import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

// QA-only helper: reads directly from Mongo to fetch data the UI never
// renders back (e.g. the uploaded identification document's fileId, needed
// for SEG-02). Sniffing the Server Action's RSC network response for this
// proved unreliable in Playwright (CDP loses the body on fast
// redirects/streamed responses), so this is the robust alternative -
// read-only, same pattern as scripts/qa-seed-secretaria.ts.
//
// Looked up by email since TASK-023/024: staff-created patients have no
// userId to key off of anymore (createPatient never touches the User
// collection) — email is unique per QA run (see uniqueSuffix()) so it's an
// equally safe lookup key here.
export async function getPatientIdentificationFileIdByEmail(
  email: string,
): Promise<string | undefined> {
  const { connectToDatabase } = await import("../lib/db/mongodb");
  const { Patient } = await import("../lib/db/models/Patient");

  await connectToDatabase();
  const patient = await Patient.findOne({ email });
  return patient?.identificationDocumentId || undefined;
}
