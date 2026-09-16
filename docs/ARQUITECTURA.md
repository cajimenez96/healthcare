# Arquitectura del Sistema CarePulse & Hoja de Ruta CRM/ERP Médico/Odontológico

## 1. Visión General del Proyecto
**CarePulse** es una aplicación web en **Next.js 14 (App Router)** orientada a la gestión de pacientes y reserva de citas médicas. Utiliza **Appwrite** como Backend-as-a-Service (BaaS) para la persistencia de datos, autenticación básica y almacenamiento de archivos.

---

## 2. Stack Tecnológico Actual

* **Frontend Framework**: Next.js 14.2.3 (React 18, TypeScript 5)
* **Estilos y Componentes**: Tailwind CSS, Radix UI primitives, Lucide React, `@tanstack/react-table`
* **Formularios y Validación**: React Hook Form + Zod (`@hookform/resolvers`)
* **Backend & Database**: Appwrite SDK (`node-appwrite` v12)
* **Notificaciones**: Appwrite Messaging (SMS / Twilio)
* **Monitoreo & Telemetría**: Sentry (`@sentry/nextjs`)

---

## 3. Estructura de Directorios

```text
healthcare/
├── app/                      # Rutas de Next.js (App Router)
│   ├── admin/                # Dashboard administrativo (Turnos, Estadísticas, alta de pacientes en /admin/pacientes/nuevo)
│   ├── recepcion/            # Panel de Secretaría (cobros, alta de pacientes en /recepcion/pacientes/nuevo)
│   ├── api/                  # API routes & Sentry monitoring
│   └── layout.tsx / page.tsx # Landing staff-only, sin flujo de paciente (TASK-023) — link a /login
├── components/               # Componentes UI de React
│   ├── forms/                # Formularios principales (CreatePatientForm, AppointmentForm)
│   ├── table/                # Tabla de turnos con TanStack Table
│   └── ui/                   # Componentes atómicos (Radix UI + Tailwind)
├── lib/                      # Lógica de infraestructura y Server Actions
│   ├── actions/              # Server Actions (patient.actions.ts, appointment.actions.ts)
│   ├── appwrite.config.ts    # Inicialización del cliente Appwrite
│   └── validation.ts         # Esquemas de validación con Zod
├── types/                    # Definiciones de TypeScript (Domain & Appwrite models)
├── constants/                # Constantes globales (Listado de doctores harcodeados, opciones)
└── docs/                     # Documentación del proyecto
```

---

## 4. Análisis Crítico de Arquitectura (Deuda Técnica y Limitaciones)

Como **Tech Lead Sr**, identifiqué las siguientes deficiencias estructurales que deben ser subsanadas para evolucionar el proyecto hacia un sistema robusto de nivel Enterprise (CRM/ERP):

### 4.1. Ausencia de Capa de Abstracción y Repositorios (Acoplamiento Alto) — ✅ Resuelto (`TASK-003`)
* **Problema original**: Los *Server Actions* (`lib/actions/*.ts`) llamaban directamente al SDK de Appwrite.
* **Riesgo original**: Imposibilidad de realizar pruebas unitarias (*unit testing*) mediante Mocks y acoplamiento severo a un proveedor de BaaS específico (dificultaba la migración a PostgreSQL / Prisma / Supabase).
* **Resolución**: `TASK-003` introdujo una capa de repositorios: interfaces en `lib/repositories/*.ts` y sus implementaciones concretas en `lib/db/repositories/Mongo*.ts`. Los Server Actions (`lib/actions/*`) ya no acceden al SDK de base de datos directamente, sino a través de estos repositorios.

### 4.2. Doctores y Horarios Hardcodeados — ✅ Resuelto (`TASK-006`)
* **Problema original**: La lista de médicos estaba fija en `constants/index.ts` con imágenes estáticas.
* **Riesgo original**: No existía gestión dinámica de profesionales, especialidades, consultorios ni agendas de disponibilidad/turnos por profesional.
* **Resolución**: `TASK-006` incorporó gestión dinámica de doctores: `lib/actions/doctor.actions.ts` (CRUD), `app/admin/doctors/page.tsx` y `components/forms/DoctorForm.tsx` permiten dar de alta, editar, activar/desactivar y configurar la disponibilidad de cada profesional desde el Dashboard de Administración.

### 4.3. Autenticación y Control de Acceso (RBAC) Inseguro — ✅ Resuelto (`TASK-004` / `TASK-005`)
* **Problema original**: El acceso al Dashboard de Administración se validaba mediante un OTP/Passkey guardado en `localStorage` del cliente.
* **Riesgo original**: Inseguridad crítica. No cumplía con normativas de protección de datos médicos (HIPAA, GDPR, Leyes locales de Historia Clínica Digital).
* **Resolución**: `TASK-004`/`TASK-005` reemplazaron ese mecanismo por autenticación basada en sesión (NextAuth con credenciales, `lib/auth/authOptions.ts`) y guards de sesión por rol (`lib/auth/requireAdminSession.ts`, `requireDoctorSession.ts`, `requireSecretariaSession.ts`).

### 4.4. Modelo de Datos Limitado — ⚠️ Parcialmente resuelto
* **Resuelto**: historia clínica continua, tratamientos odontológicos y odontograma (`TASK-008`/`TASK-009`), y facturación básica (`TASK-012`).
* **Pendiente**: no existe gestión de presupuestos/cotizaciones ni de inventario/insumos — esto sigue siendo deuda técnica real, sin resolver.

### 4.5. Portal de auto-servicio de pacientes: eliminado, alta 100% mediada por staff — ✅ Resuelto (`TASK-023` / `TASK-024`)
* **Contexto original**: el sistema heredaba del template CarePulse un flujo público de auto-registro (`/`, `/patients/[userId]/register` con `RegisterForm.tsx`/`PatientForm.tsx`) y de auto-reserva de turnos (`/patients/[userId]/new-appointment`), al que `TASK-015` le sumó un login real por DNI+PIN (`/patients/login`, `authenticatePatientCredentials.ts`).
* **Decisión de producto**: el paciente no tiene ningún acceso directo al sistema — todo el onboarding (alta de ficha clínica, turnos) queda a cargo exclusivamente de Secretaría o Administrador.
* **Resolución**: `TASK-023` eliminó por completo el portal público (`/patients/**`, login DNI+PIN, `RegisterForm.tsx`, `PatientForm.tsx`, `PatientLoginForm.tsx`, `authenticatePatientCredentials.ts`) junto con las referencias en `middleware.ts`/`authOptions.ts`. `TASK-024` introdujo el reemplazo staff-side: la Server Action `createPatient` (`lib/actions/patient.actions.ts`), gateada por el nuevo `requireSecretariaOrAdminSession`, y el formulario compartido `CreatePatientForm.tsx`, montado en `/recepcion/pacientes/nuevo` (flujo primario) y `/admin/pacientes/nuevo`. `Patient` y `Appointment` aceptan ahora `userId` opcional — un paciente puede existir sin ningún `User`/login asociado, mismo patrón ya usado para `Doctor` desde `TASK-006`/`TASK-008`.
* **Limitación derivada, no resuelta por este cambio**: sin `User` vinculado, no hay forma de resolver el teléfono del paciente por el mecanismo anterior (basado en `userId`) para las notificaciones SMS de confirmación/cancelación de turno. `TASK-028` (`docs/PLANNING.md`) documentó esto como decisión de producto — SMS de confirmación no se usa por ahora — y no como deuda técnica pendiente.

---

## 5. Propuesta de Arquitectura Objetivo (Hexagonal / Screaming Architecture)

Para escalar a un **CRM / ERP Clínico y Odontológico**, la arquitectura debe migrar a una estructura modular desacoplada:

```text
src/
├── core/                     # Capa de Dominio (Pure TypeScript, sin dependencias de frameworks)
│   ├── domain/               # Entidades (Patient, Doctor, Appointment, Odontogram, Invoice)
│   └── ports/                # Interfaces de Repositorio y Servicios
├── infrastructure/           # Adaptadores de Infraestructura
│   ├── db/                   # Implementaciones de Repositorios (Appwrite / PostgreSQL)
│   ├── auth/                 # Adaptadores de Autenticación (Clerk / NextAuth / Appwrite Auth)
│   └── messaging/            # Adaptadores de WhatsApp / SMS (Twilio / Meta API)
├── application/              # Casos de Uso (Use Cases / Application Services)
│   ├── use-cases/patient/
│   ├── use-cases/appointment/
│   └── use-cases/clinical-record/
└── presentation/             # Next.js Pages, Components y Controllers
```

---

## 6. Módulos Clave para la Evolución a CRM/ERP

1. **Gestión de Agendas y Profesionales (ERP)**:
   * Alta de médicos, odontólogos y especialidades.
   * Configuración de horarios de atención, bloqueos de agenda y distribución de consultorios.
2. **Historia Clínica Electrónica y Odontograma (EHR/Clinical)**:
   * Ficha médica del paciente, antecedentes, alergias y evolución clínica por consulta.
   * Odontograma interactivo 2D/3D para clínicas dentales (piezas dentales, tratamientos realizados/pendientes).
3. **Módulo de Ventas, Presupuestos y Cotizaciones (CRM)**:
   * Generación de planes de tratamiento y presupuestos por fases.
   * Seguimiento de oportunidades y estado de tratamientos (Pendiente, En Proceso, Finalizado).
4. **Facturación e Integración de Obras Sociales / Seguros (ERP)**:
   * Emisión de comprobantes, copagos, liquidación de honorarios a profesionales por porcentaje o valor fijo.
5. **Marketing & Automatización de Comunicaciones (CRM)**:
   * Recordatorios automáticos por WhatsApp Web API / SMS.
   * Recalls preventivos (ej: "Hace 6 meses no realizás tu limpieza dental").

