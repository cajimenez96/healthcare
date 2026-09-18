export const GenderOptions = ["Male", "Female", "Other"];

// Display-only labels — the enum values above stay in English because
// they're validated by lib/validation.ts and persisted in Mongo as-is.
export const GenderLabels: Record<string, string> = {
  Male: "Masculino",
  Female: "Femenino",
  Other: "Otro",
};

export const DEFAULT_INSURANCE_PROVIDER = "Particular / Sin Convenio";

// TASK-040: the duration every appointment already assumed fixed before
// treatments carried their own. Schema-level default for new Treatment
// writes; also used as the repository-level fallback for documents that
// predate this field (see MongoTreatmentRepository.toTreatmentRecord).
export const DEFAULT_TREATMENT_DURATION_MINUTES = 30;

export const PatientFormDefaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: new Date(Date.now()),
  gender: "Male" as Gender,
  address: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  primaryPhysician: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  allergies: "",
  currentMedication: "",
  familyMedicalHistory: "",
  pastMedicalHistory: "",
  identificationType: "Birth Certificate",
  identificationNumber: "",
  identificationDocument: [],
  treatmentConsent: false,
  disclosureConsent: false,
  privacyConsent: false,
};

export const IdentificationTypes = [
  "Birth Certificate",
  "Driver's License",
  "Medical Insurance Card/Policy",
  "Military ID Card",
  "National Identity Card",
  "Passport",
  "Resident Alien Card (Green Card)",
  "Social Security Card",
  "State ID Card",
  "Student ID Card",
  "Voter ID Card",
];

// Display-only labels — same rationale as GenderLabels above.
export const IdentificationTypeLabels: Record<string, string> = {
  "Birth Certificate": "Partida de nacimiento",
  "Driver's License": "Licencia de conducir",
  "Medical Insurance Card/Policy": "Carnet/póliza de obra social",
  "Military ID Card": "Cédula militar",
  "National Identity Card": "Documento Nacional de Identidad (DNI)",
  Passport: "Pasaporte",
  "Resident Alien Card (Green Card)": "Residencia permanente (Green Card)",
  "Social Security Card": "Número de Seguridad Social",
  "State ID Card": "Cédula de identidad provincial",
  "Student ID Card": "Credencial de estudiante",
  "Voter ID Card": "Documento electoral",
};

export const StatusIcon = {
  scheduled: "/assets/icons/check.svg",
  pending: "/assets/icons/pending.svg",
  cancelled: "/assets/icons/cancelled.svg",
  completed: "/assets/icons/check.svg",
};

// Display-only labels — same rationale as GenderLabels above (the Status
// enum values themselves stay in English, persisted in Mongo as-is).
export const StatusLabels: Record<string, string> = {
  scheduled: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  completed: "Finalizada",
};
