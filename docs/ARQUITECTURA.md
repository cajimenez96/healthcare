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
│   ├── admin/                # Dashboard administrativo (Turnos, Estadísticas)
│   ├── patients/             # Flujo de pacientes ([userId]/register, [userId]/new-appointment)
│   ├── api/                  # API routes & Sentry monitoring
│   └── layout.tsx / page.tsx # Landing y modal de acceso Admin
├── components/               # Componentes UI de React
│   ├── forms/                # Formularios principales (PatientForm, RegisterForm, AppointmentForm)
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

### 4.1. Ausencia de Capa de Abstracción y Repositorios (Acoplamiento Alto)
* **Problema**: Los *Server Actions* (`lib/actions/*.ts`) llaman directamente al SDK de Appwrite.
* **Riesgo**: Imposibilidad de realizar pruebas unitarias (*unit testing*) mediante Mocks y acoplamiento severo a un proveedor de BaaS específico (dificulta la migración a PostgreSQL / Prisma / Supabase).

### 4.2. Doctores y Horarios Hardcodeados
* **Problema**: La lista de médicos está fija en `constants/index.ts` con imágenes estáticas.
* **Riesgo**: No existe gestión dinámica de profesionales, especialidades, consultorios ni agendas de disponibilidad/turnos por profesional.

### 4.3. Autenticación y Control de Acceso (RBAC) Inseguro
* **Problema**: El acceso al Dashboard de Administración se valida mediante un OTP/Passkey guardado en `localStorage` del cliente.
* **Riesgo**: Inseguridad crítica. No cumple con normativas de protección de datos médicos (HIPAA, GDPR, Leyes locales de Historia Clínica Digital).

### 4.4. Modelo de Datos Limitado
* **Problema**: No contempla historias clínicas continuas, tratamientos odontológicos (odontograma), presupuestos, facturación ni gestión de inventario/insumos.

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

