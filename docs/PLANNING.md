# Tablero de Planificación (Kanban Backlog) - MVP CarePulse CRM/ERP

Este archivo centraliza el plan de ejecución y el backlog de actividades para la migración e implementación del **Sistema Clínico Odontológico (MVP)**.

---

## 📊 Estado General del Tablero

```text
+-----------------------+-----------------------+-----------------------+
|  📋 BACKLOG           |  🚧 EN PROGRESO       |  ✅ COMPLETADO        |
|  (13 Tickets)         |  (0 Tickets)          |  (0 Tickets)          |
+-----------------------+-----------------------+-----------------------+
```

---

## 📋 BACKLOG (Por Hacer)

### EPIC 1: Infraestructura & Migración a MongoDB

#### `[TASK-001]` Configuración de Conexión a MongoDB y ODM
* **Descripción**: Configurar la conexión persistente a MongoDB mediante Mongoose/Prisma en Next.js 14, reemplazando las variables de entorno y cliente de Appwrite.
* **Criterios de Aceptación**:
  - [ ] Conexión a MongoDB URI mediante singleton pattern en `lib/db/mongodb.ts`.
  - [ ] Manejo adecuado de variables de entorno (`MONGODB_URI`).
  - [ ] Script de prueba de conexión ejecutable.
* **Prioridad**: Alta | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: Ninguna

#### `[TASK-002]` Definición de Esquemas Mongoose y Migración de Modelos
* **Descripción**: Crear las colecciones base de MongoDB (`User`, `Patient`, `Appointment`, `Doctor`, `Treatment`) traduciendo los tipos de `types/appwrite.types.ts` a esquemas de Mongoose con validación.
* **Criterios de Aceptación**:
  - [ ] Esquemas creados en `lib/db/models/`.
  - [ ] Validaciones de campos obligatorios y tipos coincidentes con Zod schemas.
  - [ ] Índices creados para búsquedas eficientes (ej: `userId`, `patientId`, `status`, `schedule`).
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-001

#### `[TASK-003]` Refactorización de Server Actions a Patrón Repositorio
* **Descripción**: Reemplazar las llamadas directas de Appwrite en `lib/actions/patient.actions.ts` y `appointment.actions.ts` por repositorios desacoplados que interactúen con MongoDB.
* **Criterios de Aceptación**:
  - [ ] Interfaz de repositorio `IPatientRepository` e `IAppointmentRepository`.
  - [ ] Creación, lectura y actualización de pacientes y citas funcionando con MongoDB.
  - [ ] Eliminación completa de la dependencia `node-appwrite`.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-002

---

### EPIC 2: Autenticación & Control de Acceso por Roles (RBAC)

#### `[TASK-004]` Autenticación Segura con NextAuth.js y MongoDB Adapter
* **Descripción**: Implementar autenticación real por Email/Password usando NextAuth.js (Auth.js) en reemplazo del PIN estático en `PasskeyModal.tsx`.
* **Criterios de Aceptación**:
  - [ ] Endpoint `/api/auth/[...nextauth]` configurado con MongoDB Adapter.
  - [ ] Hashing de contraseñas con `bcryptjs`.
  - [ ] Formulario de Login funcional con redirección según rol.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-003

#### `[TASK-005]` Middleware de Protección de Rutas y RBAC Dinámico
* **Descripción**: Restringir el acceso a páginas (`/admin`, `/doctor`, `/recepcion`, `/patients`) mediante middleware de Next.js según el rol asignado (`Admin`, `Secretaria`, `Doctor`, `Paciente`).
* **Criterios de Aceptación**:
  - [ ] Roles guardados en el token JWT / Session.
  - [ ] Middleware redirige a `/unauthorized` o `/login` si no cumple permisos.
  - [ ] Ocultar elementos de UI inaccesibles según rol.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-004

---

### EPIC 3: Gestión Dinámica de Doctores y Agendas

#### `[TASK-006]` CRUD de Doctores, Especialidades y Consultorios
* **Descripción**: Reemplazar el listado hardcodeado en `constants/index.ts` por un módulo administrativo de alta/baja/modificación de profesionales.
* **Criterios de Aceptación**:
  - [ ] Formulario de Alta de Doctor (Nombre, Especialidad, Matrícula, Foto, Días/Horarios de atención).
  - [ ] Persistencia en colección `Doctors`.
  - [ ] API / Server Action para listar doctores activos en la interfaz de turnos.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-003, TASK-005

#### `[TASK-007]` Selector Dinámico de Horarios Disponibles
* **Descripción**: Actualizar el formulario de citas (`AppointmentForm.tsx`) para que calcule los slots de tiempo libres según la agenda del doctor seleccionado.
* **Criterios de Aceptación**:
  - [ ] El paciente/secretaria elige doctor y fecha; el sistema deshabilita horas ocupadas.
  - [ ] Validación anti-solapamiento de turnos en backend.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-006

---

### EPIC 4: Ficha Clínica y Odontograma Interactivo

#### `[TASK-008]` Vista de Perfil Clínico y Historial de Evoluciones
* **Descripción**: Crear la vista exclusiva para el rol `Doctor` donde consulta el antecedente médico del paciente y registra notas de evolución por consulta.
* **Criterios de Aceptación**:
  - [ ] Vista `/doctor/patient/[id]` protegida para profesionales.
  - [ ] Formulario para agregar notas de evolución ligadas a la cita.
  - [ ] Histórico cronológico de atenciones anteriores.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-005

#### `[TASK-009]` Integración del Componente de Odontograma Interactivo
* **Descripción**: Integrar el componente visual de odontograma (piezas dentales 2D/3D) para registrar el estado de cada diente y guardarlo como JSON en MongoDB.
* **Criterios de Aceptación**:
  - [ ] Renderizado gráfico de las 32 piezas dentales permanentes y temporales.
  - [ ] Selección de estados por pieza/cara (Caries, Obturado, Ausente, Endodoncia, Corona).
  - [ ] Guardado y lectura del `odontograma_json` en la colección `ClinicalRecord`.
* **Prioridad**: Alta | **Esfuerzo**: Alto (5 ptos) | **Dependencias**: TASK-008

---

### EPIC 5: Motor de Tarifas, Obras Sociales y Cobro en Recepción

#### `[TASK-010]` Nomenclador de Prestaciones y Seeder "Particular"
* **Descripción**: Crear el catálogo de tratamientos/prestaciones con sus precios base y pre-cargar la entidad `Particular / Sin Convenio` en MongoDB.
* **Criterios de Aceptación**:
  - [ ] Script Seeder que inserta la Obra Social `Particular` y el Nomenclador Base (Consultas, Obturaciones, Limpiezas).
  - [ ] Panel CRUD para administrar el catálogo de prestaciones y sus montos.
* **Prioridad**: Alta | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-002

#### `[TASK-011]` Selección de Obra Social / Particular en Onboarding
* **Descripción**: Extender el formulario de registro de paciente (`RegisterForm.tsx`) para incluir la selección de Obra Social, Plan y N° de Afiliado (Default: Particular).
* **Criterios de Aceptación**:
  - [ ] Campo desplegable de Obra Social / Plan cargado dinámicamente.
  - [ ] Por defecto selecciona `Particular / Sin Convenio`.
  - [ ] Persistencia en el perfil del paciente.
* **Prioridad**: Media | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-010

#### `[TASK-012]` Módulo de Recepción: Cálculo de Aranceles, Copagos y Cierre
* **Descripción**: Crear el panel de cobros para `Secretaría` al finalizar una consulta atendida, aplicando las reglas de cobertura (100% cobro en caso Particular).
* **Criterios de Aceptación**:
  - [ ] Cálculo automático del saldo a cobrar según las prestaciones marcadas por el doctor.
  - [ ] Registro del pago (Efectivo/Transferencia/Tarjeta) y cambio de estado de cita a `Finalizada`.
  - [ ] Generación e impresión/descarga de recibo digital de cobro.
* **Prioridad**: Alta | **Esfuerzo**: Alto (5 ptos) | **Dependencias**: TASK-009, TASK-010, TASK-011

---

### EPIC 6: Seguridad y Mantenimiento

#### `[TASK-013]` Actualizar Next.js por vulnerabilidad de seguridad conocida
* **Descripción**: Next.js 14.2.3 tiene una vulnerabilidad de seguridad confirmada por el equipo de Next.js (ver aviso oficial: https://nextjs.org/blog/security-update-2025-12-11, detectado vía warning de pnpm al instalar dependencias). Actualizar a una versión parcheada.
* **Criterios de Aceptación**:
  - [ ] Investigar el aviso oficial y determinar la versión mínima parcheada.
  - [ ] Actualizar `next` y validar breaking changes de App Router (rutas, `instrumentation.ts`, Sentry).
  - [ ] `pnpm build` y `pnpm dev` funcionando sin regresiones tras la actualización.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: Ninguna

---

## 🚧 EN PROGRESO

*(No hay tareas en progreso actualmente)*

---

## ✅ COMPLETADO

*(No hay tareas completadas aún)*
