// Domain types shared with client components. These used to extend Appwrite's
// `Models.Document` (which supplied `$id`, `$createdAt`, etc.). The Mongo-backed
// repositories/actions now populate `$id` explicitly so existing components
// (CreatePatientForm, AppointmentForm, columns.tsx, AppointmentModal) that
// read `.patient.$id` / `.$id` keep working unchanged.

export interface Patient {
  $id: string;
  // Optional since TASK-023/024 — staff-created patients have no linked
  // User, emergency contact or insurance policy number.
  userId: string | undefined;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string | undefined;
  emergencyContactNumber: string | undefined;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string | undefined;
  allergies: string | undefined;
  currentMedication: string | undefined;
  familyMedicalHistory: string | undefined;
  pastMedicalHistory: string | undefined;
  identificationType: string | undefined;
  identificationNumber: string | undefined;
  identificationDocument: FormData | undefined;
  privacyConsent: boolean;
}

export interface Appointment {
  $id: string;
  patient: Patient;
  schedule: Date;
  status: Status;
  primaryPhysician: string;
  reason: string;
  note: string;
  userId: string | undefined;
  cancellationReason: string | null;
}
