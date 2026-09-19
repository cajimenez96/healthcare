import { z } from "zod";

// TASK-024: staff-side patient creation (Secretaria/Administrador only —
// patients have no self-service onboarding at all anymore, see TASK-023).
// Combines the old two-step public flow's fields (PatientForm's identity
// step + RegisterForm's clinical/insurance step, both removed) into one
// form, minus the self-registration-only PIN/consent checkboxes.
export const CreatePatientFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z
    .string()
    .refine(
      (phone) => /^\+\d{10,15}$/.test(phone),
      "Número de teléfono inválido"
    ),
  birthDate: z.coerce.date(),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección debe tener como máximo 500 caracteres"),
  occupation: z
    .string()
    .max(500, "La ocupación debe tener como máximo 500 caracteres")
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^\+\d{10,15}$/.test(value),
      "Número de teléfono inválido"
    ),
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  identificationType: z.string().min(1, "Seleccioná el tipo de identificación"),
  identificationNumber: z
    .string()
    .min(2, "El número de identificación debe tener al menos 2 caracteres")
    .max(
      50,
      "El número de identificación debe tener como máximo 50 caracteres"
    ),
  // TASK-032: the scanned file is optional now — identificationType/Number
  // above remain required and are the actual DNI-based lookup key TASK-033
  // needs. Same optional-file pattern already used by DoctorEditFormValidation.
  identificationDocument: z.custom<File[]>().optional(),
});

// TASK-059: editing a patient collects exactly the same field set as
// creating one (unlike Secretaria/Admin, which drop `password` on edit —
// Patient has no such write-only field to omit here), so this is a plain
// alias rather than an `.omit()` — named separately purely for discoverability
// alongside SecretariaEditFormValidation/AdminEditFormValidation/
// DoctorEditFormValidation.
export const PatientEditFormValidation = CreatePatientFormValidation;

// TASK-069: the 4 antecedentes médicos fields, doctor-editable only — free
// text, all optional (a doctor may only have something to say about one of
// the four at any given visit).
export const MedicalBackgroundFormValidation = z.object({
  allergies: z.string().optional(),
  currentMedication: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
});

export const CreateAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  treatmentId: z.string().min(1, "Seleccioná una prestación"),
  schedule: z.coerce.date(),
  reason: z
    .string()
    .min(2, "El motivo debe tener al menos 2 caracteres")
    .max(500, "El motivo debe tener como máximo 500 caracteres"),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const CancelAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  treatmentId: z.string().optional(),
  schedule: z.coerce.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z
    .string()
    .min(2, "El motivo debe tener al menos 2 caracteres")
    .max(500, "El motivo debe tener como máximo 500 caracteres"),
});

export const LoginFormValidation = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const SecretariaFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const SecretariaEditFormValidation = SecretariaFormValidation.omit({
  password: true,
});

export const AdminFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const AdminEditFormValidation = AdminFormValidation.omit({
  password: true,
});

export const DoctorAvailabilityValidation = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1, "La hora de inicio es obligatoria"),
  endTime: z.string().min(1, "La hora de fin es obligatoria"),
});

export const DoctorFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  specialty: z
    .string()
    .min(2, "La especialidad debe tener al menos 2 caracteres")
    .max(100, "La especialidad debe tener como máximo 100 caracteres"),
  licenseNumber: z
    .string()
    .min(2, "La matrícula debe tener al menos 2 caracteres")
    .max(50, "La matrícula debe tener como máximo 50 caracteres"),
  photo: z.custom<File[]>().optional(),
  availability: z
    .array(DoctorAvailabilityValidation)
    .min(1, "Seleccioná al menos un día de disponibilidad"),
});

export const DoctorEditFormValidation = DoctorFormValidation.extend({
  photo: z.custom<File[]>().optional(),
});

export const ClinicalNoteValidation = z.object({
  note: z
    .string()
    .min(2, "La nota debe tener al menos 2 caracteres")
    .max(2000, "La nota debe tener como máximo 2000 caracteres"),
});

export const TreatmentFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre debe tener como máximo 100 caracteres"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  estimatedDurationMinutes: z.coerce
    .number()
    .int("La duración debe ser un número entero de minutos")
    .min(5, "La duración debe ser de al menos 5 minutos"),
  description: z
    .string()
    .max(500, "La descripción debe tener como máximo 500 caracteres")
    .optional(),
});

export const PaymentFormValidation = z.object({
  paymentMethod: z.enum(["cash", "transfer", "card"], {
    required_error: "Seleccioná un medio de pago",
  }),
});

// TASK-056: the "schedule" (reschedule) case moved to the unified "Nuevo
// turno" view (NewAppointmentView/DoctorWeekCalendar), which calls
// updateAppointment directly rather than going through this form — only
// "create" and "cancel" reach AppointmentForm now.
export function getAppointmentSchema(type: "create" | "cancel") {
  return type === "create" ? CreateAppointmentSchema : CancelAppointmentSchema;
}
