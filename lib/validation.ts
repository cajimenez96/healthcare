import { z } from "zod";

export const UserFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z
    .string()
    .refine((phone) => /^\+\d{10,15}$/.test(phone), "Número de teléfono inválido"),
  identificationType: z.string().min(1, "Seleccioná el tipo de identificación"),
  identificationNumber: z
    .string()
    .min(2, "El número de identificación debe tener al menos 2 caracteres")
    .max(50, "El número de identificación debe tener como máximo 50 caracteres"),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "El PIN debe tener entre 4 y 6 dígitos"),
});

export const PatientFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z
    .string()
    .refine((phone) => /^\+\d{10,15}$/.test(phone), "Número de teléfono inválido"),
  birthDate: z.coerce.date(),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(500, "La dirección debe tener como máximo 500 caracteres"),
  occupation: z
    .string()
    .min(2, "La ocupación debe tener al menos 2 caracteres")
    .max(500, "La ocupación debe tener como máximo 500 caracteres"),
  emergencyContactName: z
    .string()
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres")
    .max(50, "El nombre de contacto debe tener como máximo 50 caracteres"),
  emergencyContactNumber: z
    .string()
    .refine(
      (emergencyContactNumber) => /^\+\d{10,15}$/.test(emergencyContactNumber),
      "Número de teléfono inválido"
    ),
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  insuranceProvider: z
    .string()
    .min(2, "El nombre de la obra social debe tener al menos 2 caracteres")
    .max(50, "El nombre de la obra social debe tener como máximo 50 caracteres"),
  insurancePolicyNumber: z
    .string()
    .min(2, "El número de afiliado debe tener al menos 2 caracteres")
    .max(50, "El número de afiliado debe tener como máximo 50 caracteres"),
  allergies: z.string().optional(),
  currentMedication: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  // identificationType/identificationNumber are collected in step 1
  // (PatientForm, they double as the login credential) — not re-asked here.
  identificationDocument: z.custom<File[]>().optional(),
  treatmentConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "Debés dar tu consentimiento de tratamiento para continuar",
    }),
  disclosureConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "Debés dar tu consentimiento de divulgación para continuar",
    }),
  privacyConsent: z
    .boolean()
    .default(false)
    .refine((value) => value === true, {
      message: "Debés aceptar la política de privacidad para continuar",
    }),
});

export const CreateAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  schedule: z.coerce.date(),
  reason: z
    .string()
    .min(2, "El motivo debe tener al menos 2 caracteres")
    .max(500, "El motivo debe tener como máximo 500 caracteres"),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const ScheduleAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
  schedule: z.coerce.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const CancelAppointmentSchema = z.object({
  primaryPhysician: z.string().min(2, "Seleccioná al menos un doctor"),
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

export const PatientLoginValidation = z.object({
  identificationNumber: z.string().min(2, "Ingresá tu número de identificación"),
  pin: z.string().regex(/^\d{4,6}$/, "El PIN debe tener entre 4 y 6 dígitos"),
});

export const SecretariaFormValidation = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
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
  photo: z.custom<File[]>().refine((files) => files?.length === 1, "La foto es obligatoria"),
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
  description: z.string().max(500, "La descripción debe tener como máximo 500 caracteres").optional(),
});

export const PaymentFormValidation = z.object({
  paymentMethod: z.enum(["cash", "transfer", "card"], {
    required_error: "Seleccioná un medio de pago",
  }),
});

export function getAppointmentSchema(type: string) {
  switch (type) {
    case "create":
      return CreateAppointmentSchema;
    case "cancel":
      return CancelAppointmentSchema;
    default:
      return ScheduleAppointmentSchema;
  }
}
