# Tablero de Planificación (Kanban Backlog) - MVP CarePulse CRM/ERP

Este archivo centraliza el plan de ejecución y el backlog de actividades para la migración e implementación del **Sistema Clínico Odontológico (MVP)**.

---

## 📊 Estado General del Tablero

```text
+-----------------------+-----------------------+-----------------------+
|  📋 BACKLOG           |  🚧 EN PROGRESO       |  ✅ COMPLETADO        |
|  (7 Tickets)          |  (0 Tickets)          |  (6 Tickets)          |
+-----------------------+-----------------------+-----------------------+
```

---

## 📋 BACKLOG (Por Hacer)

### EPIC 3: Gestión Dinámica de Doctores y Agendas

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

### EPIC 1: Infraestructura & Migración a MongoDB

#### `[TASK-001]` Configuración de Conexión a MongoDB y ODM
* **Descripción**: Configurar la conexión persistente a MongoDB mediante Mongoose/Prisma en Next.js 14, reemplazando las variables de entorno y cliente de Appwrite.
* **Criterios de Aceptación**:
  - [x] Conexión a MongoDB URI mediante singleton pattern en `lib/db/mongodb.ts`.
  - [x] Manejo adecuado de variables de entorno (`MONGODB_URI`).
  - [x] Script de prueba de conexión ejecutable.
* **Prioridad**: Alta | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: Ninguna
* **Resultado**: Implementado el singleton de conexión en `lib/db/mongodb.ts` con el patrón de cache global de Next.js (sobrevive HMR/cold starts), validando `MONGODB_URI` en tiempo de ejecución con error claro si falta. Se agregó `scripts/check-db-connection.ts` (`npm run db:ping`) como verificación manual ejecutable. Ciclo TDD completo (RED→GREEN) contra MongoDB local real.
  - **Archivos creados**: `lib/db/mongodb.ts`, `lib/db/mongodb.test.ts`, `scripts/check-db-connection.ts`, `vitest.config.ts`, `vitest.setup.ts`, `.env.local`, `.env.example`
  - **Archivos modificados**: `package.json` (scripts `test`/`test:watch`/`db:ping`; dependencias `mongoose`, `vitest`, `dotenv`, `tsx`)
* **Observaciones**: El proyecto no tenía ningún test runner configurado; se evaluó Jest vs. Vitest y se optó por Vitest (cero-config con TS/ESM, sin tradeoffs arquitectónicos relevantes). Los tests son de integración real contra Mongo local, no mocks — consistente con el resto del proyecto.
  - **Gap detectado y corregido recién en TASK-005**: `vitest.setup.ts` conectaba los tests a la misma base que usa la app en desarrollo (`MONGODB_URI` de `.env.local`), sin aislar una base de test separada. Como varios tests hacen `deleteMany({})` en su limpieza, correr la suite borraba datos reales/sembrados (pasó con el usuario admin de TASK-004). Corregido en TASK-005 — ver esa entrada para el detalle.

#### `[TASK-002]` Definición de Esquemas Mongoose y Migración de Modelos
* **Descripción**: Crear las colecciones base de MongoDB (`User`, `Patient`, `Appointment`, `Doctor`, `Treatment`) traduciendo los tipos de `types/appwrite.types.ts` a esquemas de Mongoose con validación.
* **Criterios de Aceptación**:
  - [x] Esquemas creados en `lib/db/models/`.
  - [x] Validaciones de campos obligatorios y tipos coincidentes con Zod schemas.
  - [x] Índices creados para búsquedas eficientes (`userId`, `patientId`, `status`, `schedule`).
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-001
* **Resultado**: Creados los 5 esquemas Mongoose con validaciones de campos obligatorios, enums (`Gender`, `Status`) y los índices pedidos por el ticket en `Appointment` (`userId`, `patientId`, `status`, `schedule`). 16 tests cubriendo validación, valores por defecto, enums e índices, corridos contra Mongo real.
  - **Archivos creados**: `lib/db/models/User.ts` (+`.test.ts`), `Patient.ts` (+`.test.ts`), `Doctor.ts` (+`.test.ts`), `Appointment.ts` (+`.test.ts`), `Treatment.ts` (+`.test.ts`), `lib/db/models/testHelpers.ts`
* **Observaciones**:
  - Se eligió **Mongoose sobre Prisma+conector Mongo** por mejor soporte de documentos embebidos/anidados (relevante para el futuro `odontograma_json` de TASK-009), a pesar de que otro proyecto del usuario (`az-store`) usa Prisma.
  - `userId` en `Patient`/`Appointment` se modeló como `ObjectId` con `ref: "User"` (relación real), no como string suelto como en Appwrite — deja el terreno preparado para TASK-004 (NextAuth suele usar una colección `User` equivalente).
  - Se detectó y corrigió un warning de deprecación de Mongoose (`validateSync`, a eliminarse en Mongoose 10) reemplazándolo por la API async `validate()` antes de dar la tarea por cerrada (requisito de salida "pristina" del proyecto).

#### `[TASK-003]` Refactorización de Server Actions a Patrón Repositorio
* **Descripción**: Reemplazar las llamadas directas de Appwrite en `lib/actions/patient.actions.ts` y `appointment.actions.ts` por repositorios desacoplados que interactúen con MongoDB.
* **Criterios de Aceptación**:
  - [x] Interfaz de repositorio `IPatientRepository` e `IAppointmentRepository`.
  - [x] Creación, lectura y actualización de pacientes y citas funcionando con MongoDB.
  - [x] Eliminación completa de la dependencia `node-appwrite`.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-002
* **Resultado**: Reemplazadas las Server Actions basadas en Appwrite por un patrón de puertos/adaptadores (`lib/repositories/` para las interfaces, `lib/db/repositories/` para las implementaciones Mongo). `node-appwrite` eliminado de `package.json` y `lib/appwrite.config.ts` borrado. 47/47 tests pasando, cero componentes de UI modificados (compatibilidad mantenida vía `lib/actions/serializers.ts`, que mapea los registros Mongo de vuelta al contrato `$id` que ya consumían los formularios).
  - **Archivos creados**: `lib/repositories/{IUserRepository,IPatientRepository,IAppointmentRepository,IFileStorage,INotificationService}.ts`, `lib/db/repositories/Mongo{User,Patient,Appointment}Repository.ts` (+tests), `lib/storage/GridFsFileStorage.ts` (+test), `app/api/files/[fileId]/route.ts` (+test), `lib/notifications/{TwilioNotificationService,buildAppointmentSmsMessage}.ts` (+test), `lib/actions/serializers.ts`
  - **Archivos modificados**: `lib/actions/patient.actions.ts`, `lib/actions/appointment.actions.ts`, `types/appwrite.types.ts`, `types/index.d.ts`, `package.json`
  - **Archivos eliminados**: `lib/appwrite.config.ts`
* **Observaciones**:
  - El ticket original no contemplaba qué reemplaza a **Appwrite Storage** (documento de identificación del paciente) ni **Appwrite Messaging** (SMS) — gaps reales detectados al ejecutar la tarea, no cubiertos por ningún otro ticket de este EPIC. Se resolvieron junto con el usuario: **GridFS** (nativo de Mongo, sin dependencias/credenciales nuevas) para archivos, **Twilio real** para SMS.
  - Se generó **TASK-013** (fuera del alcance de este ticket) al detectar, vía warning de `pnpm install`, una vulnerabilidad de seguridad conocida en Next.js 14.2.3.
  - Se detectó y corrigió un **drift de versión de `react-hook-form`/`@hookform/resolvers`** (causado por la pérdida de `package-lock.json` al migrar de npm a pnpm en paralelo a esta tarea), fijando versiones exactas a las que el template usaba originalmente.
  - Se cablearon las variables de entorno de Sentry (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`), que estaban hardcodeadas apuntando a la cuenta del autor original del template — trabajo adicional pedido explícitamente por el usuario durante esta misma sesión, no parte del criterio de aceptación original.
  - Durante la sesión se pegaron credenciales de Twilio en texto plano en el chat (dos veces) y por error una vez en `.env.example` (corregido antes de commitear). Se recomendó regenerar el Auth Token desde la consola de Twilio — **pendiente de confirmación por el usuario**.
  - **Bug post-completado detectado en pruebas manuales (durante TASK-004)**: `patient.actions.ts` y `appointment.actions.ts` nunca llamaban a `connectToDatabase()` antes de usar los repositorios, causando que `/admin` crasheara (`Cannot read properties of undefined (reading 'scheduledCount')`) y que el registro de paciente no hiciera nada — Mongoose bufferea las operaciones y las descarta en silencio a los 10s, capturado por el `try/catch` de cada acción que solo loguea y devuelve `undefined`. Los 69 tests de ese momento no lo detectaron porque cada test conecta la base en su propio `beforeAll`, enmascarando que el código de producción nunca lo hacía. Root cause confirmado reproduciendo el error real con dos tests que simulan un proceso recién arrancado (`lib/actions/patient.actions.test.ts`, `lib/actions/appointment.actions.test.ts`); corregido agregando `await connectToDatabase()` al inicio de las 9 funciones exportadas de ambos archivos, mismo patrón que ya usaba correctamente `GridFsFileStorage.ts`. Verificado en vivo contra el servidor real (`/admin` pasó de crashear a `200`).

### EPIC 2: Autenticación & Control de Acceso por Roles (RBAC)

#### `[TASK-004]` Autenticación Segura con NextAuth.js y MongoDB Adapter
* **Descripción**: Implementar autenticación real por Email/Password usando NextAuth.js (Auth.js) en reemplazo del PIN estático en `PasskeyModal.tsx`.
* **Criterios de Aceptación**:
  - [x] Endpoint `/api/auth/[...nextauth]` configurado con MongoDB Adapter.
  - [x] Hashing de contraseñas con `bcryptjs`.
  - [x] Formulario de Login funcional con redirección según rol.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-003
* **Resultado**: Implementado NextAuth v4 (Credentials Provider + JWT strategy) con `MongoDBAdapter` sobre un `MongoClient` nativo (`lib/db/mongoClientPromise.ts`), separado del singleton de Mongoose usado por el resto de la app. `User` extendido con `role` (enum `Administrador|Secretaria|Doctor|Paciente`, default `Paciente`) y `hashedPassword` (`select: false`, nunca se serializa por accidente). Login funcional en `/login` para Secretaría/Doctor/Administrador, con redirección real según rol. Seeder (`pnpm db:seed-admin`) para crear el admin de arranque leyendo credenciales desde variables de entorno. Verificado end-to-end contra el servidor real: flujo CSRF → credenciales → sesión con `role`/`id` correctos.
  - **Archivos creados**: `lib/db/mongoClientPromise.ts` (+test), `lib/auth/authenticateCredentials.ts` (+test), `lib/auth/authOptions.ts`, `lib/auth/roleHomeRoute.ts` (+test), `app/api/auth/[...nextauth]/route.ts`, `scripts/seed-admin.ts`, `components/forms/LoginForm.tsx`, `components/providers/AuthSessionProvider.tsx`, `app/login/page.tsx`, `types/next-auth.d.ts`
  - **Archivos modificados**: `lib/db/models/User.ts` (+test), `lib/repositories/IUserRepository.ts`, `lib/db/repositories/MongoUserRepository.ts` (+test), `lib/validation.ts` (`LoginFormValidation`), `components/CustomFormField.tsx` (soporte `inputType` para password), `app/layout.tsx` (envuelto en `SessionProvider`), `package.json` (`next-auth`, `@next-auth/mongodb-adapter`, `mongodb`, `bcryptjs`; script `db:seed-admin`), `.env.example`
* **Observaciones**:
  - Se descartó **Auth.js v5** (verificado: sigue en beta, `5.0.0-beta.32`, pese al tiempo transcurrido) en favor de **NextAuth v4 estable** (`4.24.15`) — no corresponde apostar por software beta en un proyecto de salud.
  - Se detectó y evitó a tiempo un mismatch de peer dependencies: `@next-auth/mongodb-adapter@1.1.3` sólo soporta `mongodb ^4||^5`, mientras la última versión del driver nativo es 7.x. Se pineó `mongodb@5.9.2` explícitamente (mismo tipo de trampa que el drift de `react-hook-form` en TASK-003, esta vez evitado verificando versiones antes de instalar en lugar de después).
  - Por decisión explícita del usuario, el **login de pacientes quedó fuera de alcance** — `RegisterForm.tsx` no se tocó. Idea planteada para el futuro (identificación por DNI en vez de password) sin ticket formal todavía.
  - Los destinos de redirección por rol para Secretaria (`/recepcion`) y Doctor (`/doctor`) están implementados pero esas páginas **todavía no existen** (llegan con TASK-006/TASK-008) — van a dar 404 hasta entonces. Comportamiento esperado y documentado, no se ocultó redirigiendo todo a `/admin`.
  - La verificación end-to-end del login se hizo con un script que lee `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` directo del `.env.local` del usuario, sin mostrarlas nunca en la conversación.
  - Se detectaron y terminaron procesos `pnpm dev` huérfanos en puertos 3000/3001, remanentes de sesiones anteriores.

#### `[TASK-005]` Middleware de Protección de Rutas y RBAC Dinámico
* **Descripción**: Restringir el acceso a páginas (`/admin`, `/doctor`, `/recepcion`, `/patients`) mediante middleware de Next.js según el rol asignado (`Admin`, `Secretaria`, `Doctor`, `Paciente`).
* **Criterios de Aceptación**:
  - [x] Roles guardados en el token JWT / Session. *(ya lo hacía TASK-004)*
  - [x] Middleware redirige a `/unauthorized` o `/login` si no cumple permisos.
  - [x] Ocultar elementos de UI inaccesibles según rol.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-004
* **Resultado**: `middleware.ts` protege `/admin` (Administrador), `/doctor` (Doctor) y `/recepcion` (Secretaria) vía `withAuth` de NextAuth v4: sin sesión → redirige a `/login`; sesión con rol incorrecto → redirige a `/unauthorized` (página nueva). Se eliminó por completo el gate inseguro anterior (`PasskeyModal.tsx`, el PIN en `localStorage`, y el chequeo duplicado en `DataTable.tsx`) — era exactamente la deuda técnica que `ARQUITECTURA.md` §4.3 marcaba como crítica, y dejarlo en paralelo al middleware real hubiera sido un doble gate confuso. El link "Admin" de la home ahora apunta a `/login`.
  - **Archivos creados**: `middleware.ts`, `lib/auth/getRequiredRoleForPath.ts` (+test), `app/unauthorized/page.tsx`
  - **Archivos modificados**: `components/table/DataTable.tsx`, `app/page.tsx`, `lib/utils.ts` (removidos `encryptKey`/`decryptKey`), `vitest.setup.ts`
  - **Archivos eliminados**: `components/PasskeyModal.tsx`
* **Observaciones**:
  - `/patients/*` (el flujo público de pacientes) **no se protegió** — es la consecuencia directa de la decisión de TASK-004 de no implementar login de pacientes; proteger esa ruta hubiera roto el registro/turnos públicos que sí funcionan hoy.
  - **Bug real encontrado durante la verificación, con una vuelta en falso antes de dar con la causa**: el login empezó a fallar (401) y el middleware redirigía todo a `/login` incluso con sesión válida. Primer intento (incorrecto): pensé que `withAuth` no encontraba el `NEXTAUTH_SECRET` dentro del middleware y se lo pasé explícito — no cambió nada (quedó igual, es una buena práctica de todos modos así que no se revirtió). Reinicié el servidor por si el middleware no había recompilado — tampoco. Recién aislando el problema (probando `authenticateCredentials` directo contra Mongo, sin pasar por HTTP) apareció la causa real: **el usuario admin sembrado ya no existía en la base**. Motivo: los tests corren contra la misma base que la app (`healthcare-dev`), y varios tests hacen `User.deleteMany({})` en su limpieza — correr `npm run test` durante la verificación de TASK-005 borró el admin. Fix real: `vitest.setup.ts` ahora redirige `MONGODB_URI` a una base hermana `-test` para que la suite nunca pueda tocar datos de desarrollo. Se corrigió también un test de TASK-001 que tenía el nombre de la base hardcodeado. Verificado de punta a punta: sesión válida → `/admin` 200; rol incorrecto → `/unauthorized`; sin sesión → `/login`.
  - Este bug (base de test compartida con desarrollo) estuvo latente desde TASK-001 — pudo haber afectado datos de cualquier sesión anterior, aunque no había nada valioso sembrado hasta el admin de TASK-004.

### EPIC 3: Gestión Dinámica de Doctores y Agendas

#### `[TASK-006]` CRUD de Doctores, Especialidades y Consultorios
* **Descripción**: Reemplazar el listado hardcodeado en `constants/index.ts` por un módulo administrativo de alta/baja/modificación de profesionales.
* **Criterios de Aceptación**:
  - [x] Formulario de Alta de Doctor (Nombre, Especialidad, Matrícula, Foto, Días/Horarios de atención).
  - [x] Persistencia en colección `Doctors`.
  - [x] API / Server Action para listar doctores activos en la interfaz de turnos.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-003, TASK-005
* **Resultado**: Extendido el schema `Doctor` (TASK-002) con `specialty` (ahora requerido), `licenseNumber`, `availability` (array estructurado `{dayOfWeek, startTime, endTime}`, pensado para que TASK-007 lo consuma) e `isActive`. Repositorio + Server Actions (`createDoctor`, `getActiveDoctors`) reutilizando el GridFS de TASK-003 para la foto. Página `/admin/doctors` (protegida por el middleware de TASK-005) con listado + formulario de alta. Los 4 consumidores del `Doctors` hardcodeado (`RegisterForm.tsx`, `AppointmentForm.tsx`, `columns.tsx`, `success/page.tsx`) migrados a datos reales sin cambiar el contrato que ya usaban — `primaryPhysician` se sigue guardando como el **nombre** del doctor (string), no como referencia por ID, para no tener que tocar `Patient`/`Appointment` ni la lógica de matching existente. `constants.Doctors` eliminado. Verificado de punta a punta con un script que crea un doctor real (con foto) y confirma que aparece en el listado activo y que la foto se puede descargar — datos de prueba borrados después.
  - **Archivos creados**: `lib/repositories/IDoctorRepository.ts`, `lib/db/repositories/MongoDoctorRepository.ts` (+test), `lib/actions/doctor.actions.ts`, `components/forms/DoctorForm.tsx`, `components/forms/DoctorAvailabilityPicker.tsx`, `app/admin/doctors/page.tsx`
  - **Archivos modificados**: `lib/db/models/Doctor.ts` (+test), `lib/validation.ts` (`DoctorFormValidation`), `components/forms/RegisterForm.tsx`, `components/forms/AppointmentForm.tsx`, `components/AppointmentModal.tsx`, `components/table/columns.tsx` (ahora `getColumns(doctors)`), `app/admin/page.tsx`, `app/patients/[userId]/register/page.tsx`, `app/patients/[userId]/new-appointment/page.tsx`, `app/patients/[userId]/new-appointment/success/page.tsx`, `constants/index.ts`
* **Observaciones**:
  - El ticket dice "CRUD" pero los criterios de aceptación solo piden Alta + listado — no se construyó edición/baja de doctores (`isActive` existe en el schema para soportarlo a futuro, pero no hay UI para desactivar todavía). Si se necesita, es un ticket/tarea aparte.
  - El horario de atención se simplificó a un rango de hora único aplicado a los días seleccionados (no horarios distintos por día) — alcanza para lo que pide el ticket y para lo que va a necesitar TASK-007; horarios per-día distintos quedan como posible mejora futura.
  - La foto del doctor reutiliza el mismo bucket GridFS que los documentos de identificación de pacientes (`patientDocuments`) en vez de crear uno nuevo — es solo una etiqueta interna sin implicancia de seguridad distinta, y evita tocar la ruta `/api/files/[fileId]` que tiene el nombre de bucket fijo.
