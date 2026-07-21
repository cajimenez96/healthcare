// Domain types shared with client components. These used to extend Appwrite's
// `Models.Document` (which supplied `$id`, `$createdAt`, etc.). The Mongo-backed
// repositories/actions now populate `$id` explicitly so existing components
// (RegisterForm, AppointmentForm, columns.tsx, AppointmentModal) that read
// `.patient.$id` / `.$id` keep working unchanged.

export interface Patient {
  $id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
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
  userId: string;
  cancellationReason: string | null;
}
