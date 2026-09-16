# MVP Base — Sistema Clínico Odontológico

> **Documento de trabajo — borrador parcial, sujeto a revisión conjunta.**
> Objetivo: definir el alcance mínimo demostrable (demo end-to-end) a partir de lo que ya existe en el sistema, sin asumir nada que no esté verificado en código o en `docs/PLANNING.md`.
> Revisión 2 — incorpora las decisiones de alcance cerradas en la sesión del 2026-09-15.

---

## 1. Objetivo del MVP

Un sistema que se pueda demostrar de punta a punta con los tres roles internos (Administrador, Doctor, Secretaria) operando sobre el flujo completo: alta de profesional → alta de paciente → turno → atención clínica con odontograma → cobro. Alcance de facturación: **Particular** (sin Obras Sociales con coberturas diferenciadas). **El paciente no tiene acceso propio al sistema** — todo su onboarding y gestión es mediado por Secretaría/Administrador.

---

## 2. Estado actual del sistema (verificado)

### 2.1 Autenticación y roles — TASK-004, TASK-005
- NextAuth v4 (Credentials + JWT). Roles: `Administrador | Secretaria | Doctor | Paciente`.
- `middleware.ts` protege `/admin`, `/doctor`, `/recepcion` por rol.
- Cada Server Action de mutación sensible re-verifica sesión del lado del servidor (`requireAdminSession` / `requireDoctorSession` / `requireSecretariaSession`).
- **Nota histórica**: el commit `b6f4915` (2026-09-15, mismo día de esta definición) había agregado un login de paciente funcional por DNI+PIN (`/patients/login`, `authenticatePatientCredentials.ts`) con protección real por recurso en `/patients/[userId]/**` y en `/api/files/[fileId]`. **Se deshabilitó y removió por completo** (TASK-023, ver `docs/PLANNING.md`) — ver §3.1. El código de ese login ya no existe en el repo.

### 2.2 Gestión de Doctores — TASK-006, TASK-008, TASK-021
- CRUD completo: alta, edición, desactivar/reactivar (soft delete).
- Disponibilidad semanal configurable. Alta de acceso de login vinculado al perfil clínico, con bloqueo de doble acceso (TASK-021).

### 2.3 Gestión de Secretarias — TASK-020, TASK-026
- CRUD completo: alta, edición y desactivación/reactivación (`isActive`, revoca login real) desde `/admin/secretarias`.

### 2.4 Gestión de Administradores — TASK-027
- CRUD completo desde `/admin/admins`: alta, edición y desactivación, con salvaguarda server-side que impide desactivar al último Administrador activo. El seed script (`scripts/seed-admin.ts`) sigue siendo el único camino para el *primer* Admin de arranque.

### 2.5 Turnos — TASK-007, TASK-018
- Cálculo de horarios libres en tiempo real, anti-solapamiento validado en backend.
- Alta directa desde `/admin` (`AdminNewAppointmentModal`) buscando un paciente **ya existente** por email/teléfono exacto — **no crea pacientes nuevos**, solo los encuentra.
- Estados `scheduled | pending | cancelled | completed`, contados en el dashboard de Admin (TASK-016).

### 2.6 Ficha clínica y odontograma — TASK-008, TASK-009
- `/doctor/patient/[id]`: antecedentes médicos, notas de evolución, histórico cronológico.
- Odontograma interactivo: 32 piezas permanentes, 5 caras, 5 estados. Dentición temporal fuera de alcance.

### 2.7 Facturación / Cobro — TASK-010, TASK-011, TASK-012, TASK-017
- Nomenclador de prestaciones gestionado desde `/admin/treatments`.
- Modelo "Particular First": 100% a cargo del paciente.
- Cobro automático (prestaciones cargadas por el doctor) y cobro manual/walk-in desde `/recepcion`.
- Recibo imprimible, bloqueo real de doble cobro (índice único en Mongo).

### 2.8 Calidad e infraestructura
- 148 tests Vitest + 35 tests Playwright, suite E2E aislada (base `-e2e`, puerto 3100).
- Next.js 15.5.21 + React 19.2.8, sin vulnerabilidades conocidas pendientes.
- Idioma unificado en español.

---

## 3. Decisiones de alcance cerradas en esta sesión

### 3.1 El paciente no tiene acceso propio al sistema
- Se **deshabilita** el login de paciente agregado hoy en `b6f4915` (DNI+PIN, `/patients/login`) y se remueve/bloquea el portal público (`/patients/[userId]/register`, `/patients/[userId]/new-appointment`, ficha propia del paciente, descarga de documento de identificación por esa vía).
- **Motivo del cambio de rumbo respecto a TASK-015**: en vez de autenticar el acceso del paciente (lo que ya se había construido), se decidió eliminar directamente esa superficie — el paciente no interactúa con el sistema en ningún punto de este MVP.
- **Consecuencia técnica que hay que cubrir**: hoy el *único* camino que crea un registro `Patient` es el formulario público de auto-registro. Si se bloquea sin más, nadie puede cargar un paciente nuevo — `AdminNewAppointmentModal` solo busca pacientes existentes, no crea. Por eso se suma el ítem "Alta de Paciente" en §4 como parte obligatoria de este MVP, no como mejora opcional.

### 3.2 Sin Obras Sociales
Descartado por completo para este MVP — no es un "pendiente", es una decisión cerrada. El modelo sigue siendo 100% Particular (ya construido, TASK-012).

### 3.3 Sin Presupuestos/Cotizaciones ni Inventario/Insumos
Confirmado fuera de alcance.

### 3.4 Sin filtro de doctores
Confirmado fuera de alcance — el listado de `/admin/doctors` queda como está.

### 3.5 Arquitectura Hexagonal y migración de backend — pospuestas
Ambas decisiones se posponen para después de la demo, por decisión explícita tras evaluar el trade-off:
- **Hexagonal**: el patrón puertos/adaptadores ya existe de facto desde TASK-003 (`lib/repositories/*` + `lib/db/repositories/Mongo*`); formalizar la estructura de carpetas es un refactor grande sin funcionalidad nueva, con riesgo de romper 183 tests existentes justo antes de la demo.
- **Backend separado (NestJS/AdonisJS/Express)**: implicaría reescribir autenticación, RBAC y las 39 Server Actions como una API independiente — un proyecto en sí mismo, no una tarea de este MVP.
- Ambas quedan anotadas como iniciativa estratégica a retomar una vez asegurada la demo.

---

## 4. Trabajo a construir para completar el MVP

1. ✅ **Completado (TASK-024)** — **Alta de Paciente** (reemplaza el auto-registro público). Secretaría/Admin carga datos personales, médicos y documento de identificación del paciente presente, sin que el paciente inicie sesión en ningún momento.
   - **Ubicación resuelta**: vive principalmente en `/recepcion` (es el flujo natural de mostrador de Secretaría), pero **Administrador también debe poder acceder** — mismo componente/formulario, Server Action guardada para ambos roles (`requireSecretariaSession` **o** `requireAdminSession`), igual que ya conviven ambos roles en el flujo de cobro y turnos.
   - **Campos resueltos** (mismo set que hoy pide `RegisterForm.tsx` vía `PatientFormValidation`, con dos cambios de obligatoriedad):
     - Obligatorios (igual que hoy): nombre, email, teléfono, fecha de nacimiento, género, dirección, ocupación, médico primario, documento de identificación (tipo + número + archivo).
     - **Pasan a opcionales** (hoy son obligatorios en el schema, cambia con esta decisión):
       - Contacto de emergencia (nombre + teléfono).
       - Obra social / N° de afiliado — coherente con §3.2 (sin Obras Sociales): si Secretaría no lo completa, se asume `DEFAULT_INSURANCE_PROVIDER` ("Particular / Sin Convenio"), mismo default que ya usa `RegisterForm.tsx` hoy.
     - Ya opcionales (sin cambios): alergias, medicación actual, antecedentes familiares/personales.
2. ✅ **Completado (TASK-023)** — **Deshabilitar el acceso de paciente**: removido el login DNI+PIN (`b6f4915`) y bloqueadas las rutas públicas de `/patients/**`.
3. ✅ **Completado (TASK-027)** — **Gestión de Administradores**: alta, edición y desactivación desde UI (`/admin/admins`, antes solo existía por seed script), siguiendo el patrón defensivo de Doctor/Secretaria (`requireAdminSession`) y reutilizando directamente los métodos genéricos de `IUserRepository`/`MongoUserRepository` de TASK-026.
4. ✅ **Completado (TASK-026)** — **Editar y desactivar Secretarias**: `update`/`setActiveById` genéricos en `IUserRepository`/`MongoUserRepository` (reutilizados luego por TASK-027 para Administradores), UI en `/admin/secretarias` mismo patrón que Doctor.
5. ✅ **Completado (TASK-025)** — **Revocación de acceso real**: `isActive` agregado a `User` (default `true`, `=== false` chequeado explícitamente en `authenticateCredentials` para no bloquear usuarios ya existentes sin el campo backfilleado), y `setDoctorActive` ahora revoca también el login vinculado (`setActiveByDoctorId`, no-op si el doctor no tiene acceso creado).
6. ✅ **Completado (TASK-027)** — **Salvaguarda**: no se puede desactivar al último Administrador activo del sistema — chequeo server-side real (`isLastActiveAdmin` en `lib/actions/adminSafeguard.ts`), no solo un botón deshabilitado en la UI.

---

## 5. Fuera de este MVP (backlog futuro)

- RBAC dinámico (tabla de permisos configurable).
- Obras Sociales / Planes / Coberturas (descartado, no solo pospuesto).
- Presupuestos / Cotizaciones, Inventario / Insumos.
- Automatización de marketing (recordatorios WhatsApp/SMS).
- Filtro por especialidad/estado en `/admin/doctors`.
- Dentición temporal (pediátrica) en el odontograma.
- **Migración a arquitectura Hexagonal/Screaming** — pospuesta a después de la demo (§3.5).
- **Migración de backend a NestJS/AdonisJS/Express u otra tecnología** — pospuesta a después de la demo (§3.5), a evaluar como decisión estratégica separada.

---

## 6. Próximos pasos

- [x] Ubicación de "Alta de Paciente" resuelta: `/recepcion` como flujo principal, `/admin` también con acceso (§4.1).
- [x] Campos del alta de paciente resueltos: mismo set que `RegisterForm.tsx`, con contacto de emergencia y obra social pasando a opcionales (§4.1).
- [x] Bajar el alcance cerrado (§4) a `docs/PLANNING.md` como tickets nuevos: `EPIC 8` existe con tickets reales (`TASK-023` a `TASK-027`).
- [x] Arrancar implementación: `TASK-023` y `TASK-024` completados (portal de pacientes eliminado, alta staff-side construida — ver §3.1 y §4, ítems 1-2).
- [x] Gaps de documentación y de notificaciones detectados durante `TASK-024` quedaron resueltos: `TASK-028` (decisión de producto — el SMS de confirmación/cancelación no se reactiva para pacientes de alta staff-side, gap aceptado y permanente) y `TASK-029` (`docs/TESTING.md` y `docs/ARQUITECTURA.md` alineados con la eliminación del portal).
- [x] `TASK-025` (revocación real de acceso) completado — ver §4, ítem 5.
- [x] `TASK-026` (editar/desactivar Secretarias) y `TASK-027` (gestión de Administradores desde UI, incluye la salvaguarda del último Administrador) completados — cierra el alcance de MVP definido en este documento.
