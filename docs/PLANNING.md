# Tablero de Planificación (Kanban Backlog) - MVP CarePulse CRM/ERP

Este archivo centraliza el plan de ejecución y el backlog de actividades para la migración e implementación del **Sistema Clínico Odontológico (MVP)**.

---

## 📊 Estado General del Tablero

```text
+-----------------------+-----------------------+-----------------------+
|  📋 BACKLOG           |  🚧 EN PROGRESO       |  ✅ COMPLETADO        |
|  (5 Tickets)          |  (0 Tickets)          |  (17 Tickets)         |
+-----------------------+-----------------------+-----------------------+
```

---

## 📋 BACKLOG (Por Hacer)

### EPIC 6: Hallazgos de la ronda de QA post-TASK-013

Los tickets de este epic surgen de ejecutar `docs/TESTING.md` (33 casos de prioridad Alta automatizados con Playwright, ver sesión de QA). No son regresiones de lo ya construido — todo lo automatizado pasó — sino gaps y decisiones de alcance detectadas al correr el sistema de punta a punta.

#### `[TASK-015]` Decisión de Producto: autenticación real para el portal de pacientes y descarga de archivos
* **Descripción**: confirmado en esta ronda de QA (casos SEG-01 y SEG-02 de `docs/TESTING.md`) que `/patients/[userId]/**` y `/api/files/[fileId]` siguen sin ningún control de sesión — dependen únicamente de que el `userId`/`fileId` (ObjectId de Mongo) sea difícil de adivinar. Sin autenticar, con el `userId` de otro paciente se accede a su ficha completa (PII); con el `fileId` de un documento de identificación, se descarga directo.
* **Criterios de Aceptación**:
  - [ ] Producto decide si es aceptable para el MVP actual o si bloquea la salida a producción con pacientes reales.
  - [ ] Si se decide corregir: definir mecanismo de autenticación de pacientes (quedó fuera de alcance en TASK-004) o, como mitigación mínima, exigir sesión de staff en `/api/files/[fileId]`.
* **Prioridad**: Alta | **Esfuerzo**: sin estimar (depende de la decisión) | **Dependencias**: Ninguna
* **Contexto**: hallazgo de seguridad reproducido y confirmado vigente en esta ronda de QA.

#### `[TASK-017]` Decisión de Producto: cobro manual/walk-in en Recepción
* **Descripción**: hoy `/recepcion` solo lista turnos `scheduled` con al menos una prestación cargada por el doctor en `ClinicalNote.treatments`. Si el doctor no cargó ninguna evolución con prestaciones, el turno nunca aparece para cobrar y no hay pantalla alternativa de carga manual.
* **Criterios de Aceptación**:
  - [ ] Producto confirma si es un límite aceptable del MVP o si Recepción necesita poder cargar un cobro sin depender del doctor.
  - [ ] Si se aprueba: UI en `/recepcion` para seleccionar prestaciones manualmente sobre un turno `scheduled` sin evolución.
* **Prioridad**: Media | **Esfuerzo**: sin estimar (depende de la decisión) | **Dependencias**: TASK-012
* **Contexto**: caso SEC-02 de `docs/TESTING.md`, confirmado vigente en esta ronda de QA.

#### `[TASK-018]` Alta de turno directo desde `/admin`
* **Descripción**: `docs/TESTING.md` (ADM-08) documenta "crear un turno directo para un paciente" como parte del flujo esperado de Administrador, pero `AppointmentModal.tsx` solo soporta `type: "schedule" | "cancel"` sobre turnos ya creados por el paciente — verificado en código que no existe ninguna acción de alta de turno nuevo invocable desde `/admin`.
* **Criterios de Aceptación**:
  - [ ] Definir con Producto si el gap es del documento (ADM-08 mal descripto) o del producto (falta la función).
  - [ ] Si falta la función: formulario de alta de turno en `/admin` reutilizando `AppointmentForm.tsx`/`createAppointment` ya existentes, sin pasar por el flujo público del paciente.
* **Prioridad**: Media | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-007
* **Contexto**: discrepancia detectada al automatizar ADM-08 en esta ronda de QA.

#### `[TASK-020]` Alta de usuario Secretaria desde la UI de Administrador
* **Descripción**: a diferencia de Doctor (TASK-008, "Crear acceso" en `/admin/doctors`), no existe ningún flujo de alta para usuarios `role: Secretaria` — hoy se crea manualmente en Mongo (bcrypt + insert directo), documentado como prerrequisito operativo en `docs/TESTING.md` §3.4. Esto bloqueó el arranque de la ronda de pruebas de Recepción hasta escribir un script ad-hoc (`scripts/qa-seed-secretaria.ts`).
* **Criterios de Aceptación**:
  - [ ] Panel en `/admin` (ej. junto a `/admin/doctors`) para crear usuarios `role: Secretaria` con email + contraseña, mismo patrón defensivo (`requireAdminSession`) que el resto de las mutaciones admin.
  - [ ] No requiere vínculo a ninguna otra entidad (a diferencia de Doctor).
* **Prioridad**: Media | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-004
* **Contexto**: gap operativo confirmado al preparar el entorno de esta ronda de QA.

#### `[TASK-021]` Evitar accesos de login duplicados para un mismo Doctor
* **Descripción**: `createDoctorAccess` (TASK-008) no valida si el `Doctor` ya tiene un `User` vinculado — se puede crear un segundo login con otro email apuntando al mismo `doctorId`, dejando dos cuentas activas para el mismo profesional. Documentado como límite conocido desde TASK-008 (línea 175 de este archivo), nunca ticketeado.
* **Criterios de Aceptación**:
  - [ ] `createDoctorAccess` rechaza (o advierte) si el `doctorId` ya tiene un `User` con acceso creado.
  - [ ] Mensaje de error claro en `/admin/doctors` en ese caso.
* **Prioridad**: Baja | **Esfuerzo**: Bajo (1-2 ptos) | **Dependencias**: TASK-008
* **Contexto**: observación registrada en TASK-008, formalizada como ticket en esta revisión.

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
  - [x] *(extendido a pedido del usuario)* CRUD completo (editar, desactivar/reactivar), restringido a rol Administrador.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-003, TASK-005
* **Resultado**: Extendido el schema `Doctor` (TASK-002) con `specialty` (ahora requerido), `licenseNumber`, `availability` (array estructurado `{dayOfWeek, startTime, endTime}`, pensado para que TASK-007 lo consuma) e `isActive`. Repositorio + Server Actions (`createDoctor`, `getActiveDoctors`) reutilizando el GridFS de TASK-003 para la foto. Página `/admin/doctors` (protegida por el middleware de TASK-005) con listado + formulario de alta. Los 4 consumidores del `Doctors` hardcodeado (`RegisterForm.tsx`, `AppointmentForm.tsx`, `columns.tsx`, `success/page.tsx`) migrados a datos reales sin cambiar el contrato que ya usaban — `primaryPhysician` se sigue guardando como el **nombre** del doctor (string), no como referencia por ID, para no tener que tocar `Patient`/`Appointment` ni la lógica de matching existente. `constants.Doctors` eliminado. Verificado de punta a punta con un script que crea un doctor real (con foto) y confirma que aparece en el listado activo y que la foto se puede descargar — datos de prueba borrados después.

  **Extensión — CRUD completo**: a pedido explícito del usuario se agregó edición (`updateDoctor`, formulario `EditDoctorForm` con foto opcional) y desactivación/reactivación (`setDoctorActive`, **soft delete** — decisión del usuario tras explicarle que un borrado real dejaría los turnos históricos con imagen rota). Se agregó `lib/auth/requireAdminSession.ts`: las 3 acciones de mutación (`createDoctor`, `updateDoctor`, `setDoctorActive`) ahora verifican la sesión del lado del servidor con `getServerSession`, no solo confían en que el middleware proteja la página — una Server Action de Next.js tiene su propio endpoint HTTP y se puede invocar directo, sin pasar por el middleware de la página que la usa. Verificado: `createDoctor` sin sesión falla y no crea nada en la base (confirmado con script). Se separó la lista de doctores en dos usos distintos en `columns.tsx`: `allDoctors` para mostrar el doctor de turnos históricos (aunque esté desactivado, la foto/nombre se siguen viendo bien) y `activeDoctors` para los selects de reprogramar turno (no se puede asignar un doctor desactivado a un turno nuevo).
  - **Archivos creados**: `lib/repositories/IDoctorRepository.ts`, `lib/db/repositories/MongoDoctorRepository.ts` (+test), `lib/actions/doctor.actions.ts`, `lib/auth/requireAdminSession.ts`, `components/forms/DoctorForm.tsx`, `components/forms/EditDoctorForm.tsx`, `components/forms/DoctorAvailabilityPicker.tsx`, `components/DoctorRow.tsx`, `app/admin/doctors/page.tsx`
  - **Archivos modificados**: `lib/db/models/Doctor.ts` (+test), `lib/validation.ts` (`DoctorFormValidation`, `DoctorEditFormValidation`), `components/forms/RegisterForm.tsx`, `components/forms/AppointmentForm.tsx`, `components/AppointmentModal.tsx`, `components/table/columns.tsx` (`getColumns(allDoctors, activeDoctors)`), `app/admin/page.tsx`, `app/patients/[userId]/register/page.tsx`, `app/patients/[userId]/new-appointment/page.tsx`, `app/patients/[userId]/new-appointment/success/page.tsx`, `constants/index.ts`
* **Observaciones**:
  - El horario de atención se simplificó a un rango de hora único aplicado a los días seleccionados (no horarios distintos por día) — alcanza para lo que pide el ticket y para lo que va a necesitar TASK-007; horarios per-día distintos quedan como posible mejora futura.
  - La foto del doctor reutiliza el mismo bucket GridFS que los documentos de identificación de pacientes (`patientDocuments`) en vez de crear uno nuevo — es solo una etiqueta interna sin implicancia de seguridad distinta, y evita tocar la ruta `/api/files/[fileId]` que tiene el nombre de bucket fijo.
  - El path negativo del chequeo de admin (`requireAdminSession` sin sesión → falla y no crea nada) se verificó con un script real. El path positivo (admin autenticado → sí puede) se apoya en el mismo mecanismo (`getServerSession`) que ya está probado funcionando en TASK-004/005 para proteger `/admin`, pero no se re-verificó end-to-end con un login real en esta vuelta — recomendable probarlo a mano en el navegador.
  - **Bug reportado por el usuario al probar el login como admin, causa NO relacionada al código — corregido en dos vueltas**: `TypeError: getColumns is not a function` en `app/admin/page.tsx`. El código en disco siempre estuvo correcto (`getColumns` bien exportado, único import, confirmado con `git log`).
    - **Primer diagnóstico (incompleto)**: el servidor `pnpm dev` llevaba corriendo desde el 21/7 a las 22:51, casi 3 días antes del commit que introdujo `getColumns` (24/7) — se asumió que un simple reinicio del proceso alcanzaba, y la verificación post-reinicio pasó.
    - **El error volvió** después de que el usuario reiniciara el servidor por su cuenta. Causa real, más profunda: el **caché de build en disco** (`.next/cache/webpack/`) tenía entradas mezcladas del 21/7 y el 24/7, y venía fallando en restaurarse silenciosamente desde el principio de la sesión (warning `[webpack.cache.PackFileCacheStrategy] Restoring pack ... failed: Cannot read properties of undefined (reading 'hasStartTime')`, visible en los logs desde TASK-001 pero descartado entonces por no bloquear nada). Ese caché corrupto persiste en disco entre reinicios del proceso — por eso un simple restart no alcanzaba de forma confiable.
    - **Fix real**: borrar `.next/` por completo (no solo reiniciar el proceso) y arrancar con build limpio. Verificado con 3 requests consecutivos a `/admin` sin error, y confirmado que el warning de caché ya no aparece en el log.
    - **El error volvió por tercera vez** tras borrar `.next/` y reiniciar limpio — a esa altura, con dos remedios de infraestructura agotados (reinicio de proceso, caché de disco borrado), correspondía dejar de asumir que era un problema de entorno y revisar el código de nuevo. Causa real encontrada: `app/admin/page.tsx` es un **Server Component** que llamaba directamente a `getColumns(...)`, una función exportada de `components/table/columns.tsx`, marcado `"use client"`. Invocar una función plana (no renderizar un componente JSX) importada de un módulo cliente, desde código que corre en el servidor, cruza el límite RSC de una forma que Next.js no soporta de manera confiable — puede andar en algunas compilaciones y romperse en otras según cómo el bundler resuelva el módulo, lo cual explica por qué mis verificaciones aisladas (fetch directo al servidor) pasaban mientras que el flujo real del usuario (login → `router.push` del lado del cliente) fallaba.
    - **Fix de código**: nuevo componente cliente `components/table/AppointmentsTable.tsx` que recibe `data`/`allDoctors`/`activeDoctors` (props planas y serializables) y arma `getColumns(...)` **adentro**, en código que ya corre en el cliente. `app/admin/page.tsx` ahora solo pasa datos, nunca llama a una función de un módulo `"use client"`. Verificado con `.next/` borrado y arranque en frío, simulando tanto un request SSR normal como un request RSC con los headers que usa `router.push()` (`RSC: 1`, `Next-Router-Prefetch`) — los 4 casos devolvieron `200` sin error.
    - **Lección operativa**: cuando un error "imposible" sobrevive a dos rondas de remedios de infraestructura (reinicio de proceso, limpieza de caché), dejar de insistir por ese lado y volver a mirar el código — en este caso había un problema real de arquitectura (límite RSC cruzado incorrectamente) que la infraestructura nunca iba a arreglar.
    - **Confirmado por el usuario en el navegador**: login como admin y `/admin` funcionando de punta a punta tras el fix.

#### `[TASK-007]` Selector Dinámico de Horarios Disponibles
* **Descripción**: Actualizar el formulario de citas (`AppointmentForm.tsx`) para que calcule los slots de tiempo libres según la agenda del doctor seleccionado.
* **Criterios de Aceptación**:
  - [x] El paciente/secretaria elige doctor y fecha; el sistema deshabilita horas ocupadas.
  - [x] Validación anti-solapamiento de turnos en backend.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-006
* **Resultado**: Función pura `lib/scheduling/getAvailableSlots.ts` (TDD) calcula slots libres de 30 minutos combinando la `availability` del doctor (TASK-006) con los horarios ya ocupados ese día. Server Action `getAvailableSlotsForDoctor` la conecta a datos reales (`MongoDoctorRepository.findByName` + nuevo `MongoAppointmentRepository.findBookedTimes`). `AppointmentForm.tsx` llama a esa acción cuando cambian doctor/fecha y usa `includeTimes` de `react-datepicker` (extendí `CustomFormField` para soportarlo, junto con `filterDate` para deshabilitar días enteros sin disponibilidad). Validación anti-solapamiento real en el backend (`existsOverlapping`, nuevo método del repositorio) corriendo antes de `createAppointment` y `updateAppointment` (caso "schedule") — si el horario ya está ocupado, la creación/reprogramación se rechaza; el formulario ahora muestra un mensaje de error en ese caso en vez de fallar en silencio.
  - **Archivos creados**: `lib/scheduling/getAvailableSlots.ts` (+test)
  - **Archivos modificados**: `lib/repositories/IAppointmentRepository.ts`, `lib/db/repositories/MongoAppointmentRepository.ts` (+test), `lib/repositories/IDoctorRepository.ts`, `lib/db/repositories/MongoDoctorRepository.ts` (+test), `lib/actions/appointment.actions.ts`, `components/forms/AppointmentForm.tsx`, `components/AppointmentModal.tsx`, `components/CustomFormField.tsx`
* **Observaciones**:
  - **Bug real encontrado durante la verificación manual, no durante los tests**: la función pura usa `date.getDay()` (hora local) para el día de la semana, pero `findBookedTimes` calculaba los límites del día y extraía las horas en **UTC** (`getUTCDate`/`getUTCHours`). En un servidor que no corre en UTC+0 (este, en particular), esto desalinea todo — un script de verificación manual mostró `[]` slots disponibles incluso sin ningún turno reservado. Los tests automatizados no lo agarraron porque construían las fechas de prueba con timestamps UTC explícitos (`...Z`) consistentes entre sí, ocultando la inconsistencia real. Corregido: `findBookedTimes` ahora usa hora local en todos lados, igual que `getAvailableSlots` y que el resto del sistema (el `<input type="time">` del selector de disponibilidad de TASK-006 tampoco tiene noción de timezone). Se reescribieron los tests afectados con fechas construidas en local (`new Date(2026, 7, 1, 10, 0)`) en vez de strings ISO UTC, y se verificó el flujo completo (slots antes/después de reservar, rechazo de duplicado) con un script real.
  - Este es el mismo tipo de riesgo que ya se anotó como pendiente en TASK-003/TASK-004 (manejo de timezone flojo en todo el proyecto, más allá del `timeZone` explícito que ya viaja para el armado del SMS) — se resolvió puntualmente acá, pero sigue siendo una limitación de arquitectura para una futura clínica que opere en más de un huso horario.
  - La duración de turno se asume fija en 30 minutos (coincide con el `timeIntervals` por defecto de `react-datepicker`, que no se tocó) — no hay un campo de duración configurable por tratamiento; se podría necesitar más adelante si se agregan prestaciones de duración variable (EPIC 5).

### EPIC 4: Ficha Clínica y Odontograma Interactivo

#### `[TASK-008]` Vista de Perfil Clínico y Historial de Evoluciones
* **Descripción**: Crear la vista exclusiva para el rol `Doctor` donde consulta el antecedente médico del paciente y registra notas de evolución por consulta.
* **Criterios de Aceptación**:
  - [x] Vista `/doctor/patient/[id]` protegida para profesionales.
  - [x] Formulario para agregar notas de evolución ligadas a la cita.
  - [x] Histórico cronológico de atenciones anteriores.
  - [x] *(extendido, ver Observaciones)* Vínculo entre el login del Doctor y su perfil clínico, alta de acceso de doctores, y página `/doctor` con la agenda propia.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: TASK-005
* **Resultado**: `/doctor/patient/[id]` muestra los antecedentes médicos del paciente (alergias, medicación actual, antecedentes familiares/personales, ya existentes desde TASK-002), un formulario para cargar una nota de evolución ligada a la cita (`ClinicalNote`, colección nueva) y el histórico cronológico de evoluciones previas. `/doctor` (nueva) lista la agenda propia del doctor logueado con link directo a la ficha de cada paciente.
  - **Gap resuelto (no cubierto por ningún ticket anterior)**: no existía ningún vínculo entre el login de un Doctor (`User`, rol=Doctor, TASK-004) y su perfil clínico (`Doctor`, TASK-006) — sin eso, un doctor logueado no tenía forma de saber "cuáles son mis turnos". Se agregó `doctorId` (ref `Doctor`) a `User`, se propagó a la sesión (JWT + `next-auth.d.ts`), y se agregó un flujo de alta ("Crear acceso") en `/admin/doctors` para que el Administrador cree el login de un doctor ya cargado, vinculándolo a su perfil clínico existente.
  - **Archivos creados**: `lib/db/models/ClinicalNote.ts` (+test), `lib/repositories/IClinicalNoteRepository.ts`, `lib/db/repositories/MongoClinicalNoteRepository.ts` (+test), `lib/actions/clinicalNote.actions.ts`, `lib/auth/requireDoctorSession.ts`, `components/forms/ClinicalNoteForm.tsx`, `components/forms/CreateDoctorAccessForm.tsx`, `app/doctor/page.tsx`, `app/doctor/patient/[id]/page.tsx`
  - **Archivos modificados**: `lib/db/models/User.ts` (+test, `doctorId`), `lib/repositories/IUserRepository.ts`, `lib/db/repositories/MongoUserRepository.ts` (+test), `lib/auth/authenticateCredentials.ts` (+test), `lib/auth/authOptions.ts`, `types/next-auth.d.ts`, `lib/repositories/IDoctorRepository.ts` + `MongoDoctorRepository.ts` (+test, `findById`), `lib/actions/doctor.actions.ts` (`createDoctorAccess`), `components/DoctorRow.tsx`, `lib/repositories/IAppointmentRepository.ts` + `MongoAppointmentRepository.ts` (+test, `findByDoctor`), `lib/actions/appointment.actions.ts` (`getMyAppointments`), `lib/repositories/IPatientRepository.ts` + `MongoPatientRepository.ts` (+test, `findById`), `lib/actions/patient.actions.ts` (`getPatientById`), `lib/validation.ts` (`ClinicalNoteValidation`)
* **Observaciones**:
  - Esto fue una decisión de alcance consultada con el usuario: la alternativa más chica era solo agregar un link "Ver ficha clínica" en `/admin` sin resolver el vínculo Doctor↔User. Se optó por la solución completa porque sin ella el rol Doctor no podía usar su propio login para nada — el ticket original la subestimaba.
  - Todas las acciones de escritura (`createDoctorAccess`, `createClinicalNote`) y de lectura sensible (`getPatientById`, `getClinicalNotesForPatient`) verifican la sesión del lado del servidor (`requireAdminSession`/`requireDoctorSession` nuevo, mismo patrón defensivo de TASK-006) — no dependen solo del middleware de página.
  - Límite conocido, no resuelto: si el Administrador crea un segundo acceso para un doctor que ya tiene uno (con otro email), `createDoctorAccess` no lo detecta y quedan dos cuentas de login apuntando al mismo `doctorId`. No había urgencia de resolverlo para el MVP; anotado para cuando exista una pantalla de gestión de usuarios.
  - Cualquier doctor autenticado puede ver el historial clínico de cualquier paciente (no solo de sus propios turnos) — coincide con cómo suele operar una clínica real (el historial completo es relevante para cualquier profesional que atienda al paciente), pero es una decisión implícita, no pedida explícitamente por el ticket.
  - Verificado de punta a punta con un script que crea un doctor, su acceso vinculado, un paciente y un turno, y confirma: la agenda del doctor lo muestra, la ficha trae los antecedentes, se puede cargar y leer una evolución. Se verificó también contra el servidor real que `/doctor` y `/doctor/patient/[id]` redirigen a `/login` sin sesión y a `/unauthorized` con un rol incorrecto (probado con una sesión de Administrador).

#### `[TASK-009]` Integración del Componente de Odontograma Interactivo
* **Descripción**: Integrar el componente visual de odontograma (piezas dentales 2D/3D) para registrar el estado de cada diente y guardarlo como JSON en MongoDB.
* **Criterios de Aceptación**:
  - [x] Renderizado gráfico de las 32 piezas dentales permanentes *(temporales quedó fuera de alcance, ver Observaciones)*.
  - [x] Selección de estados por pieza/cara (Caries, Obturado, Ausente, Endodoncia, Corona).
  - [x] Guardado y lectura del odontograma en MongoDB *(colección `Odontogram`, no `ClinicalRecord` — ver Observaciones)*.
* **Prioridad**: Alta | **Esfuerzo**: Alto (5 ptos) | **Dependencias**: TASK-008
* **Resultado**: Odontograma de 32 piezas permanentes (notación FDI 11-48), cada una con 5 caras (mesial, distal, vestibular, palatal, oclusal), cada cara pintable con uno de los 5 estados del ticket. Gráfico HTML/CSS (grid de 5 zonas por diente, sin SVG anatómico) integrado en `/doctor/patient/[id]`, debajo de los antecedentes médicos. Un click en una cara rota el estado (sano→Caries→Obturado→Ausente→Endodoncia→Corona→sano); un botón "Guardar odontograma" persiste todo el estado de una vez (no autosave por click). Se crea automáticamente un odontograma vacío la primera vez que se abre la ficha de un paciente sin uno.
  - **Archivos creados**: `lib/odontogram/createEmptyOdontogram.ts` (+test), `lib/db/models/Odontogram.ts` (+test), `lib/repositories/IOdontogramRepository.ts`, `lib/db/repositories/MongoOdontogramRepository.ts` (+test), `lib/actions/odontogram.actions.ts`, `components/Odontogram.tsx`
  - **Archivos modificados**: `app/doctor/patient/[id]/page.tsx`
* **Observaciones**:
  - Alcance acotado con el usuario antes de empezar: el ticket decía "32 piezas permanentes y temporales", ambiguo entre "32 piezas (que son permanentes)" y "necesito ambas denticiones". Se decidió **solo dentición permanente** por ahora — la temporal (20 piezas, numeración FDI 51-85, pacientes pediátricos) queda pendiente si la clínica atiende niños.
  - El modelo se llama `Odontogram` (un documento por paciente, no por turno), no `ClinicalRecord` como sugería el ticket — ya existía `ClinicalNote` de TASK-008 para las evoluciones por turno, y mezclar ambas cosas en una sola colección hubiera sido peor diseño que dos colecciones con responsabilidad única.
  - Simplificación de modelado: estados que en la práctica son de toda la pieza (Ausente, Corona) se guardan igual que los demás, pintando las 5 caras a la vez desde la UI — evita tener un concepto paralelo "estado de pieza completa" en el schema.
  - **Bug real encontrado en la verificación manual, no en los tests automatizados** (mismo patrón que TASK-007): `faces` es un subdocumento de Mongoose, no un objeto plano — sus valores viven detrás de getters, no como propiedades propias enumerables. El mapeo del repositorio hacía `faces: { ...faces }`, que copiaba las propiedades internas de Mongoose (`$__parent`, `_doc`, etc.) en vez de los valores reales, así que **todo lo guardado se leía vacío** al pasar por el repositorio. El test automatizado que debía cubrir esto verificaba contra `Odontogram.find()` (el documento crudo, con getters funcionando), no contra lo que devuelve el repositorio — pasaba igual aunque el bug estuviera presente. Corregido accediendo cada cara explícitamente en vez de spread, y se reforzaron los tests para verificar valores reales devueltos por el repositorio (no por consulta directa a Mongoose), que sí hubieran fallado con el código viejo.
  - Este es el tercer bug de esta sesión que los tests no agarraron por verificar "por el costado" en vez de a través de la ruta real que usa la aplicación (el de TASK-003 con la conexión, el de TASK-007 con la zona horaria, y este). Vale la pena tenerlo presente como categoría de riesgo recurrente, no solo como incidentes aislados.

### EPIC 5: Motor de Tarifas, Obras Sociales y Cobro en Recepción

#### `[TASK-010]` Nomenclador de Prestaciones y Seeder "Particular"
* **Descripción**: Crear el catálogo de tratamientos/prestaciones con sus precios base y pre-cargar la entidad `Particular / Sin Convenio` en MongoDB.
* **Criterios de Aceptación**:
  - [x] Script Seeder que inserta la Obra Social `Particular` y el Nomenclador Base (Consultas, Obturaciones, Limpiezas).
  - [x] Panel CRUD para administrar el catálogo de prestaciones y sus montos.
* **Prioridad**: Alta | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-002
* **Resultado**: Extendido `Treatment` (schema base ya creado en TASK-002) con `isActive` (mismo patrón soft-delete de Doctor/TASK-006). Nueva colección `InsuranceProvider` (Obra Social) — solo lo mínimo que pide este ticket: nombre único + `isActive`, sin Planes/Coberturas todavía (eso es alcance de TASK-011/012). Seeder (`pnpm db:seed-nomenclador`, idempotente) crea "Particular / Sin Convenio" y 3 prestaciones base (Consulta Odontológica, Obturación de Resina, Limpieza Dental). Panel `/admin/treatments` con alta, edición y desactivar/reactivar — mismo patrón de UI que `/admin/doctors` (fila con modo edición inline), pero sin foto ni disponibilidad, mucho más simple. Todas las mutaciones protegidas con `requireAdminSession` (mismo patrón defensivo de TASK-006/008).
  - **Archivos creados**: `lib/db/models/InsuranceProvider.ts` (+test), `lib/repositories/ITreatmentRepository.ts`, `lib/db/repositories/MongoTreatmentRepository.ts` (+test), `lib/repositories/IInsuranceProviderRepository.ts`, `lib/db/repositories/MongoInsuranceProviderRepository.ts` (+test), `lib/actions/treatment.actions.ts`, `scripts/seed-nomenclador.ts`, `components/forms/TreatmentForm.tsx`, `components/TreatmentRow.tsx`, `app/admin/treatments/page.tsx`
  - **Archivos modificados**: `lib/db/models/Treatment.ts` (+test, `isActive`), `lib/validation.ts` (`TreatmentFormValidation`), `app/admin/page.tsx` (link "Nomenclador"), `package.json` (script `db:seed-nomenclador`)
* **Observaciones**:
  - No se creó Server Action para `InsuranceProvider` más allá del repositorio — el ticket no pide UI para Obras Sociales todavía (solo el seeder de "Particular"), y TASK-011 es quien realmente va a necesitar leerlas desde un desplegable. Se agregan cuando haga falta, no antes.
  - `TreatmentForm.tsx` maneja alta y edición en un solo componente (a diferencia de `DoctorForm`/`EditDoctorForm`, separados en TASK-006) — la diferencia ahí era la foto opcional en edición; acá no hay archivos de por medio, así que un solo formulario con prop `treatment?` opcional alcanza sin duplicar código.
  - Verificado con script real: alta, edición de precio, desactivar (excluido de `findActive`, presente en `findAll`), reactivar. Seeder verificado idempotente (correrlo dos veces no duplica nada).

#### `[TASK-011]` Selección de Obra Social / Particular en Onboarding
* **Descripción**: Extender el formulario de registro de paciente (`RegisterForm.tsx`) para incluir la selección de Obra Social, Plan y N° de Afiliado (Default: Particular).
* **Criterios de Aceptación**:
  - [x] Campo desplegable de Obra Social *(Plan quedó fuera de alcance, ver Observaciones)* cargado dinámicamente.
  - [x] Por defecto selecciona `Particular / Sin Convenio`.
  - [x] Persistencia en el perfil del paciente.
* **Prioridad**: Media | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-010
* **Resultado**: El campo "Insurance provider" de `RegisterForm.tsx` pasó de texto libre a un desplegable cargado dinámicamente desde `InsuranceProvider` (vía nueva `getActiveInsuranceProviders`), con `DEFAULT_INSURANCE_PROVIDER` ("Particular / Sin Convenio", ahora una constante compartida entre el seeder de TASK-010 y este formulario, para que no queden dos copias del mismo string pudiendo desincronizarse) preseleccionado. "N° de Afiliado" ya existía como `insurancePolicyNumber` desde TASK-002 y no necesitó cambios. La persistencia en el perfil del paciente también ya funcionaba (el campo se guardaba tal cual desde antes) — lo único que faltaba era que el valor viniera de un catálogo real en vez de texto libre.
  - **Archivos creados**: `lib/actions/insuranceProvider.actions.ts`
  - **Archivos modificados**: `constants/index.ts` (`DEFAULT_INSURANCE_PROVIDER`), `scripts/seed-nomenclador.ts` (usa la constante compartida), `app/patients/[userId]/register/page.tsx`, `components/forms/RegisterForm.tsx`
* **Observaciones**:
  - El campo "Plan" que menciona la descripción del ticket **no se construyó** — no existe ninguna entidad Plan en el sistema (TASK-010 solo creó `InsuranceProvider`, sin Planes/Coberturas, siguiendo el modelo sugerido en `HEALTHCARE.md` pero acotado), y este ticket solo depende de TASK-010, no de algo que lo incluya. Se interpretó como alcance aspiracional del texto original, no como un requisito real de este ticket.
  - Verificado con script real: el desplegable trae el proveedor sembrado, y un paciente creado con ese valor lo persiste correctamente.

#### `[TASK-012]` Módulo de Recepción: Cálculo de Aranceles, Copagos y Cierre
* **Descripción**: Crear el panel de cobros para `Secretaría` al finalizar una consulta atendida, aplicando las reglas de cobertura (100% cobro en caso Particular).
* **Criterios de Aceptación**:
  - [x] Cálculo automático del saldo a cobrar según las prestaciones marcadas por el doctor.
  - [x] Registro del pago (Efectivo/Transferencia/Tarjeta) y cambio de estado de cita a `Finalizada`.
  - [x] Generación e impresión/descarga de recibo digital de cobro.
* **Prioridad**: Alta | **Esfuerzo**: Alto (5 ptos) | **Dependencias**: TASK-009, TASK-010, TASK-011
* **Resultado**: Se decidió no avanzar con la Fase 2 de `docs/obra-social.md` (Obras Sociales/Planes/Matriz de Coberturas) por decisión explícita del usuario tras completar TASK-011 — solo se implementó la Fase 1 (MVP "Particular First"), que coincide exactamente con los criterios de aceptación reales de este ticket (100% a cargo del paciente, sin copagos diferenciados). Se detectó y resolvió un prerrequisito no listado explícitamente: el doctor no tenía forma de marcar qué prestaciones realizó durante la consulta, así que `ClinicalNote` se extendió con un array `treatments` (snapshot de `treatmentId`/`name`/`price` al momento de marcarlo, no una referencia viva, para que cambios de precio futuros no alteren historial ya facturado). Se agregó el estado `completed` a `Appointment` (mostrado como "Finalizada" solo para ese valor, sin tocar el resto de los badges existentes, que siguen en inglés por ser comportamiento previo no relacionado a este ticket). Se creó el modelo `Payment` (nomenclatura en inglés, consistente con el resto del código; toda la UI nueva de este ticket está en español) con índice único por `appointmentId` para impedir el doble cobro de un mismo turno. El flujo completo: el doctor marca prestaciones al cargar una evolución (`/doctor/patient/[id]`) → `/recepcion` lista los turnos agendados con prestaciones cargadas y sin cobrar → la Secretaría elige medio de pago y cierra el cobro → se genera un recibo imprimible en `/recepcion/recibo/[appointmentId]` (usa `window.print()` del navegador, sin agregar ninguna librería de PDF nueva).
  - **Archivos creados**: `lib/db/models/Payment.ts`, `lib/repositories/IPaymentRepository.ts`, `lib/db/repositories/MongoPaymentRepository.ts`, `lib/db/repositories/MongoPaymentRepository.test.ts`, `lib/auth/requireSecretariaSession.ts`, `lib/actions/payment.actions.ts`, `components/forms/BillingForm.tsx`, `components/PrintButton.tsx`, `app/recepcion/page.tsx`, `app/recepcion/recibo/[appointmentId]/page.tsx`
  - **Archivos modificados**: `lib/db/models/ClinicalNote.ts`, `lib/repositories/IClinicalNoteRepository.ts`, `lib/db/repositories/MongoClinicalNoteRepository.ts`, `lib/db/repositories/MongoClinicalNoteRepository.test.ts` (treatments + `findByAppointmentId`), `lib/actions/clinicalNote.actions.ts`, `components/forms/ClinicalNoteForm.tsx`, `app/doctor/patient/[id]/page.tsx` (selección de prestaciones), `lib/db/models/Appointment.ts`, `types/index.d.ts` (estado `completed`), `components/StatusBadge.tsx`, `constants/index.ts` (`StatusIcon.completed`), `lib/validation.ts` (`PaymentFormValidation`)
* **Observaciones**:
  - No se construyeron `PlanObraSocial`, `MatrizCoberturas` ni `ComprobanteCobro` como entidades separadas (esos nombres en español venían del spec en `docs/obra-social.md`) — se usó nomenclatura en inglés (`Payment`) siguiendo la convención ya establecida en `Appointment`/`Treatment`/`Doctor`, con la UI 100% en español por decisión explícita del usuario. `docs/obra-social.md` queda como referencia conceptual para una futura Fase 2, no como spec de implementación literal.
  - `Payment` guarda snapshots (`patientName`, `doctorName`, ítems con nombre/precio) en vez de solo referencias, mismo patrón ya usado en `ClinicalNote.doctorName` — evita que un recibo ya emitido cambie si se edita el paciente o el precio de una prestación después.
  - El dashboard de `/admin` no fue tocado: los contadores de `getRecentAppointmentList` (scheduled/pending/cancelled) no suman turnos `completed`, quedan simplemente sin contar en ningún stat card. No estaba en el alcance de este ticket agregar un "Finalizadas" al dashboard de admin.
  - Verificado con script real (`scripts/tmp-verify-billing.ts`, borrado tras usarlo): creación de nota clínica con dos prestaciones, agregación correcta del total ($23.000), creación del pago, transición del turno a `completed`, recuperación del recibo por `appointmentId`, y bloqueo real (no solo a nivel de tipos) del doble cobro vía el índice único de Mongo.

#### `[TASK-013]` Actualizar Next.js por vulnerabilidad de seguridad conocida
* **Descripción**: Next.js 14.2.3 tiene una vulnerabilidad de seguridad confirmada por el equipo de Next.js (ver aviso oficial: https://nextjs.org/blog/security-update-2025-12-11, detectado vía warning de pnpm al instalar dependencias). Actualizar a una versión parcheada.
* **Criterios de Aceptación**:
  - [x] Investigar el aviso oficial y determinar la versión mínima parcheada.
  - [x] Actualizar `next` y validar breaking changes de App Router (rutas, `instrumentation.ts`, Sentry).
  - [x] `pnpm build` y `pnpm dev` funcionando sin regresiones tras la actualización.
* **Prioridad**: Alta | **Esfuerzo**: Medio (3 ptos) → terminó siendo Alto en la práctica | **Dependencias**: Ninguna
* **Resultado**: El alcance real terminó siendo mucho mayor al estimado. El aviso citado en el ticket (diciembre 2025) solo pedía `next@14.2.35`, pero al investigar apareció un aviso posterior (mayo 2026, 13 CVEs) donde **la rama 14.x se quedó sin parche** — la única remediación real es una versión mayor. Se investigó con el usuario el trade-off (parche menor insuficiente vs. upgrade mayor con breaking changes) y se optó por el upgrade completo a **Next.js 15.5.21** (última Maintenance LTS de la línea 15.x al momento del aviso de julio 2026) + **React 19.2.8** + `@sentry/nextjs@10.68.0` (la 8.9.2 no declaraba soporte real para Next 15) + `eslint-config-next@15.5.21`. Antes de ejecutar el upgrade se verificó específicamente el riesgo más crítico para esta app — compatibilidad de NextAuth v4 (que sostiene todo el RBAC vía `middleware.ts`) con Next 15 — porque reportes de foros sugerían incompatibilidad; se comprobó que `next-auth@4.24.15` ya declara soporte oficial (`next: "^15 || ^16"`, `react: "^19"`) en su `package.json` publicado, así que no fue necesario migrar a Auth.js v5 (que sigue en beta). Se corrió el codemod oficial `next-async-request-api` para convertir `params`/`searchParams` a `Promise` en las 6 rutas dinámicas afectadas, y se actualizó el tipo ambiental `SearchParamProps` en `types/index.d.ts` para reflejar eso. Al correr `pnpm build` por primera vez en toda la sesión (antes solo se había corrido `tsc --noEmit`), se descubrió que el build de producción nunca había pasado: un bug preexistente y ya documentado desde TASK-007 (`AppointmentForm.tsx` no mandaba `timeZone` a `updateAppointment`) bloqueaba el build entero, y `eslint-config-next@15.5.21` resultó más estricto con `import/order` que la versión 14.x, rompiendo el build en ~20 archivos preexistentes. Se corrigieron ambos de raíz (no se documentó más como "deuda preexistente a ignorar"). Verificación de RBAC/auth bajo Next 15 hecha con usuarios y credenciales descartables creados por script (nunca se leyó ni mostró ningún secreto de `.env.local`, que además el sistema de permisos bloquea leer directamente): login real por HTTP como Administrador/Doctor/Secretaria, confirmando que `middleware.ts` deniega correctamente las rutas de otros roles (307 a `/unauthorized`) y que las Server Actions gateadas por `requireXSession()` funcionan (ej. `/recepcion` como Secretaria devuelve 200 con contenido real).
  - **Archivos modificados**: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (aprobación del build script de `sharp`, necesario para la optimización de imágenes en producción), `types/index.d.ts` (`SearchParamProps` async), `app/api/files/[fileId]/route.ts`, `app/api/files/[fileId]/route.test.ts`, `app/doctor/patient/[id]/page.tsx`, `app/patients/[userId]/new-appointment/page.tsx`, `app/patients/[userId]/new-appointment/success/page.tsx`, `app/patients/[userId]/register/page.tsx`, `app/recepcion/recibo/[appointmentId]/page.tsx`, `components/forms/AppointmentForm.tsx` (fix real del bug de `timeZone`), `lib/db/mongodb.ts`, `lib/db/mongoClientPromise.ts`, `types/next-auth.d.ts` (falsos positivos de `no-unused-vars` en declaraciones ambientales, silenciados puntualmente), y reordenamiento de imports vía `eslint --fix` en ~20 archivos de `lib/db/**`.
* **Observaciones**:
  - Los bypass de middleware más graves del aviso de mayo 2026 (`GHSA-267c-6grr-h53f`, `GHSA-26hh-7cqf-hhc6`, `GHSA-492v-c6pp-mqqv`) requieren Next.js ≥15.2.0/≥15.4.0 — no nos alcanzaban en 14.2.3 —, pero sí nos alcanzaban un DoS de severidad Alta en Server Components (≥13.0.0) y un cache poisoning en respuestas RSC (≥14.2.0, justo nuestra versión). Ambos quedan cerrados con este upgrade.
  - `pnpm build` nunca se había corrido en esta sesión antes de este ticket — toda la verificación previa fue `tsc --noEmit` + `vitest` + servidor de desarrollo. Quedó demostrado que eso no es equivalente: el build de producción llevaba rota toda la sesión por el bug de `timeZone`. **Recomendación para el resto del proyecto**: agregar `pnpm build` a la rutina de verificación de cada ticket, no solo al final.
  - No se migró a Auth.js v5 — sigue en beta (`5.0.0-beta.32`, publicada el 20 de julio de 2026) sin fecha de estabilización confirmada, y no hizo falta porque next-auth v4 ya soporta Next 15/16 oficialmente.
  - Quedan warnings no bloqueantes tras el upgrade: peer dependencies desactualizadas en `react-datepicker`, `react-onclickoutside`, `next-themes` y `lucide-react` (declaran soporte hasta React 18, pero funcionan correctamente en la práctica — se verificó `pnpm build` y el flujo de auth end-to-end sin errores), y un warning preexistente de `react-hooks/exhaustive-deps` en `FileUploader.tsx` no relacionado a este ticket.
  - Verificado con usuarios descartables creados y borrados por script (`scripts/tmp-verify-next15-auth.ts` + `scripts/tmp-cleanup-next15-auth.ts`, ambos borrados tras usarlos): login real vía `/api/auth/callback/credentials` para los tres roles, confirmando altas (200) y denegaciones (307 a `/unauthorized`) correctas de `middleware.ts`, y que `/recepcion` como Secretaria renderiza contenido real (la Server Action `getBillableAppointments`, gateada por `requireSecretariaSession`, funciona en Next 15).

### EPIC 7: Consistencia de Idioma

#### `[TASK-022]` Traducir el portal público del paciente a español
* **Descripción**: `/`, `/patients/[userId]/register`, `/patients/[userId]/new-appointment` y su página de éxito quedaron en inglés (texto original del template CarePulse, decisión explícita de fuera-de-alcance en TASK-004). El resto del sistema (`/admin/**`, `/doctor/**`, `/recepcion/**`, `/login`) ya estaba en español. A pedido del usuario, se unificó todo a español.
* **Criterios de Aceptación**:
  - [x] Todo el texto visible (headers, labels, placeholders, botones) del portal de paciente traducido a español.
  - [x] Los valores de enum (`Gender`, `IdentificationTypes`) mantienen sus valores internos en inglés (persistidos en Mongo, validados por `lib/validation.ts`) — solo se tradujo la etiqueta mostrada, mismo patrón ya usado para `PaymentMethod`.
  - [x] La suite de Playwright (`e2e/*.spec.ts`) actualizada en el mismo commit para los selectores que dependían del texto en inglés.
  - [x] `docs/TESTING.md` actualizado donde citaba texto literal en inglés que dejó de existir.
* **Prioridad**: Media | **Esfuerzo**: Medio (3 ptos) | **Dependencias**: Ninguna
* **Resultado**: El alcance terminó siendo más amplio que "solo el portal del paciente": al inventariar el texto en inglés (delegado a una exploración dedicada, cruzada contra los selectores de `e2e/*.spec.ts` para no romper la suite recién agregada), aparecieron mensajes de validación de Zod en **todo el sistema** (`lib/validation.ts` — usados también por `/admin/doctors`, `/admin/treatments`, la evolución clínica del doctor, etc.), no solo en el portal público. Se tradujeron los ~40 mensajes de error de las 12 schemas de `lib/validation.ts`, y se introdujo el patrón "enum en inglés + label map en español" (`GenderLabels`, `IdentificationTypeLabels`, `StatusLabels` en `constants/index.ts`) para no tocar los valores persistidos en Mongo ni las validaciones de Zod — mismo patrón ya usado para `PaymentMethod` en TASK-012. De paso se corrigió un bug real preexistente en `AppointmentModal.tsx`: los props `title`/`description` se declaraban pero nunca se renderizaban (el componente hardcodeaba su propio texto en inglés) — ahora sí se usan.
  - **Archivos modificados**: `lib/validation.ts` (todos los mensajes), `constants/index.ts` (`GenderLabels`, `IdentificationTypeLabels`, `StatusLabels`), `components/StatusBadge.tsx`, `app/page.tsx`, `app/admin/page.tsx`, `app/patients/[userId]/new-appointment/success/page.tsx`, `components/forms/PatientForm.tsx`, `components/forms/RegisterForm.tsx`, `components/forms/AppointmentForm.tsx`, `components/AppointmentModal.tsx` (+ fix de `title`/`description`), `components/table/columns.tsx`, `components/table/DataTable.tsx`, `components/FileUploader.tsx`, `components/SubmitButton.tsx`, `components/CustomFormField.tsx`, `app/loading.tsx`, `docs/TESTING.md`, `e2e/patient-flow.ts`, `e2e/02-flujo.spec.ts`, `e2e/03-adm-extra.spec.ts`, `e2e/04-security.spec.ts`.
* **Observaciones**:
  - El nombre de marca "CarePluse" (typo del template original de "CarePulse") y el prefijo "Dr." se dejaron sin tocar a propósito — no son un problema de idioma, son una decisión de branding fuera del alcance de este ticket.
  - Verificado de punta a punta: `tsc --noEmit` limpio, 148/148 tests de Vitest, y **35/35 tests de Playwright pasando contra el servidor real** (incluye los 4 flujos de negocio completos de punta a punta, RBAC, y los dos hallazgos de seguridad SEG-01/SEG-02) — la corrida completa confirmó que ningún selector de la suite quedó desalineado con el nuevo texto en español.

### EPIC 6: Hallazgos de la ronda de QA post-TASK-013 (resueltos)

#### `[TASK-014]` Aislar el entorno de datos de pruebas E2E de la base de desarrollo
* **Descripción**: la suite de Playwright agregada en la ronda de QA corría contra el `MONGODB_URI` de `.env.local`, la misma base que usa `pnpm dev` — no existía una base `-test`/`-e2e` separada como sí la hay para Vitest desde TASK-005. Cada corrida dejaba datos reales mezclados con datos de clínica (doctores/pacientes con prefijo `qa.*`).
* **Criterios de Aceptación**:
  - [x] `playwright.config.ts` apunta a una base Mongo separada de desarrollo (mismo patrón que `vitest.setup.ts`, TASK-005).
  - [x] Seed/cleanup automático de esa base antes/después de la suite (`globalSetup`/`globalTeardown` de Playwright).
  - [x] Documentado en `docs/TESTING.md` cómo correr `pnpm test:e2e` sin tocar datos reales.
* **Prioridad**: Alta | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: Ninguna
* **Resultado**: `playwright.config.ts` ahora levanta su **propio `next dev` en el puerto 3100** (no en el 3000 de `pnpm dev`, así ambos pueden correr en simultáneo) vía `webServer`, con `MONGODB_URI` sobreescrito a una base hermana `-e2e` (`e2e/testDb.ts`, mismo patrón de sufijo que `vitest.setup.ts`). Un `globalSetup` (`e2e/global-setup.ts`) siembra ahí, antes de cada corrida, el Administrador (mismas credenciales de `.env.local`), la Secretaria de QA, la obra social por defecto y el nomenclador base — todo idempotente. Un `globalTeardown` (`e2e/global-teardown.ts`) borra la base `-e2e` entera al terminar. El nomenclador (`BASE_TREATMENTS`) se extrajo a `lib/seedData/baseTreatments.ts` (antes vivía inline en `scripts/seed-nomenclador.ts`) para que tanto el script CLI como el `globalSetup` lo compartan sin duplicar precios/nombres.
  - **Archivos creados**: `lib/seedData/baseTreatments.ts`, `e2e/testDb.ts`, `e2e/global-setup.ts`, `e2e/global-teardown.ts`
  - **Archivos modificados**: `playwright.config.ts` (`webServer`, `globalSetup`, `globalTeardown`, puerto 3100), `scripts/seed-nomenclador.ts` (importa `BASE_TREATMENTS` en vez de definirlo inline), `docs/TESTING.md` (§3.1 nueva)
* **Observaciones**:
  - **Bug real encontrado en la primera corrida de verificación**: `global-teardown.ts` fallaba con `MongooseError: Connection operation buffering timed out after 10000ms` al hacer `dropDatabase()`. Causa: `globalSetup` y `globalTeardown` corren en el mismo proceso raíz de Playwright (a diferencia de los tests, que corren en workers separados) y comparten el caché de conexión de `connectToDatabase()` — `globalSetup` llamaba a `mongoose.disconnect()` al final, dejando ese caché con una conexión muerta que `globalTeardown` recibía tal cual (su chequeo de caché no sabe que se cerró), sin reconectar. Corregido quitando el `disconnect()` de `globalSetup` — la conexión queda viva para que `globalTeardown` la reutilice y la cierre recién al final, después de dropear la base.
  - Verificado con dos corridas completas de punta a punta tras el fix: 35/35 tests de Playwright pasando, `globalTeardown` sin error, y confirmado que Playwright cierra su propio servidor del puerto 3100 solo al terminar (sin procesos huérfanos).

#### `[TASK-016]` Contabilizar turnos `completed` en el dashboard de Admin
* **Descripción**: `getRecentAppointmentList` (`lib/actions/appointment.actions.ts`) solo acumulaba `scheduledCount`/`pendingCount`/`cancelledCount` — los turnos `completed` (ya cobrados por Recepción desde TASK-012) no sumaban en ningún stat card de `/admin`.
* **Criterios de Aceptación**:
  - [x] Agregar `completedCount` al agregado y un stat card "Finalizadas" en `/admin`.
  - [x] No romper los 3 contadores existentes.
* **Prioridad**: Media | **Esfuerzo**: Bajo (2 ptos) | **Dependencias**: TASK-012
* **Resultado**: Agregado `completedCount` al `reduce` de `getRecentAppointmentList` y un cuarto `StatCard` ("Turnos finalizados") en `/admin`. Escrito test-first: se agregó un `describe` nuevo en `appointment.actions.test.ts` que crea 7 turnos con los 4 estados y verifica los 4 contadores + el total, confirmado en rojo (`completedCount` no existía) antes de implementar.
  - **Archivos modificados**: `lib/actions/appointment.actions.ts`, `lib/actions/appointment.actions.test.ts`, `components/StatCard.tsx` (nuevo `type: "completed"`), `app/admin/page.tsx`
* **Observaciones**:
  - `StatCard` no tiene un asset de fondo dedicado para "completed" (los otros 3 usan imágenes PNG vía `tailwind.config.ts`, no colores planos) — se reutilizó `bg-appointments` en vez de generar un asset nuevo, ya que ambos representan un resultado positivo (mismo verde que `StatusBadge` ya usa para `scheduled` y `completed`). Documentado en el código, no es un descuido.
  - Al escribir el test de conteo se encontró (y quedó documentado como comentario en el código) el mismo patrón de caché de conexión corrupta que TASK-014: el describe anterior del mismo archivo (`connection handling`) desconecta Mongoose en su `afterAll`, y como Vitest corre los describes del mismo archivo en el mismo proceso, el test nuevo heredaba una conexión muerta. Se resolvió limpiando `global._mongooseCache` al inicio del test nuevo, mismo fix conceptual que en `global-setup.ts`.

#### `[TASK-019]` Mensaje de error visible cuando un Doctor no tiene perfil vinculado
* **Descripción**: `requireDoctorSession()` (`lib/auth/requireDoctorSession.ts:18`) lanza `"Forbidden: Doctor role with a linked doctor profile required"` cuando un `User` con `role: Doctor` no tiene `doctorId`. Ese error solo quedaba en el log de servidor — en la UI se traducía en listas vacías, sin ningún mensaje explícito.
* **Criterios de Aceptación**:
  - [x] Las Server Actions afectadas devuelven un estado de error legible (no solo `undefined`/lista vacía).
  - [x] `/doctor` muestra un mensaje claro ("Tu usuario no tiene un perfil de doctor vinculado, contactá al Administrador") en vez de fallar en silencio.
* **Prioridad**: Baja | **Esfuerzo**: Bajo (1-2 ptos) | **Dependencias**: TASK-008
* **Resultado**: `getMyAppointments` (única consumidora en todo el proyecto, verificado por búsqueda) ahora devuelve `{ appointments, hasLinkedProfile }` en vez de un array pelado — `hasLinkedProfile: false` cuando `requireDoctorSession()` rechaza específicamente por falta de `doctorId` (o cualquier otro motivo de sesión inválida), `true` en cualquier otro caso, incluida una agenda legítimamente vacía. `/doctor` usa ese flag para mostrar el mensaje específico en vez del genérico "No tenés turnos asignados." (que ahora se oculta en ese caso, para no mostrar los dos mensajes a la vez).
  - **Archivos modificados**: `lib/actions/appointment.actions.ts`, `app/doctor/page.tsx`
* **Observaciones**:
  - No se agregó test unitario nuevo para esta acción — sigue la convención ya establecida en el proyecto de no testear a nivel de Server Action las que dependen de `getServerSession` (requiere mockear next-auth, patrón no usado en ningún otro lado del código). Verificado en cambio con un usuario Doctor real sin `doctorId`, creado y borrado por script, logueado por HTTP contra el servidor real: `/doctor` muestra el mensaje nuevo y **no** muestra el genérico.
  - El resto de las Server Actions del Doctor (`getPatientById`, `getClinicalNotesForPatient`, `createClinicalNote`, odontograma) no se tocaron — hoy solo son alcanzables navegando desde `/doctor`, que ya corta el flujo antes de llegar ahí con el mensaje nuevo. Si en el futuro se linkean directo (sin pasar por `/doctor`), van a necesitar el mismo tratamiento.
