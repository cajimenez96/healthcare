# Plan de Pruebas (QA) — Sistema Clínico Odontológico (MVP)

Este documento es el plan de pruebas manuales para el sistema construido según `docs/PLANNING.md` (TASK-001 a TASK-013, backlog completo). Está pensado para que un QA Sr. pueda ejecutar la ronda de pruebas por flujo de negocio sin depender del código ni de quien lo desarrolló.

## 1. Alcance

Cubre los 4 actores del sistema y los 6 flujos de negocio principales, con casos funcionales (happy path), negativos (validaciones), de seguridad (RBAC) y de regresión (bugs reales encontrados durante el desarrollo, para evitar que vuelvan a aparecer). No cubre performance ni carga.

## 2. Actores del sistema

| Actor | Cómo se identifica | Home tras login | Rutas propias |
|---|---|---|---|
| **Paciente** | *(ver nota `TASK-023`/`TASK-024` abajo)* Ya no es un actor con acceso propio — no tiene login, sesión ni rutas. Es un registro (`Patient`) creado y gestionado enteramente por Secretaria/Administrador desde `/recepcion/pacientes/nuevo` o `/admin/pacientes/nuevo`. | — | — |
| **Administrador** | Usuario staff con `role: Administrador`, login por email + contraseña en `/login` | `/admin` | `/admin/**` |
| **Doctor** | Usuario staff con `role: Doctor`, **vinculado obligatoriamente** a un documento `Doctor` (`doctorId`). Se crea únicamente desde "Crear acceso" en `/admin/doctors`. | `/doctor` | `/doctor/**` |
| **Secretaria** | Usuario staff con `role: Secretaria`, login por email + contraseña. No hay alta desde la UI — se crea directamente en base (ver §3). | `/recepcion` | `/recepcion/**` |

> ⚠️ **Nota (`TASK-023`/`TASK-024`)**: hasta entonces el Paciente sí era un actor real, con login DNI+PIN (`TASK-015`) y rutas propias `/`, `/patients/**`. Por decisión de producto ese acceso se eliminó por completo — el onboarding (ficha + turnos) pasó a ser 100% mediado por el staff. La sección `6.1` (antes "Paciente") documenta hoy los casos `PAC-*` desde el lado del staff, no un flujo público.

> ℹ️ **Nota de idioma para QA**: desde `TASK-022`, toda la UI (incluido, en ese momento, el portal público del paciente en `/` y `/patients/**` — eliminado después en `TASK-023`; su equivalente en español hoy es el alta staff-side en `/recepcion/pacientes/nuevo` y `/admin/pacientes/nuevo`) está en español. Los valores de enum persistidos en Mongo (`Gender`, `IdentificationType`, `Status`, `PaymentMethod`) siguen en inglés internamente — solo cambió la etiqueta mostrada en pantalla.

## 3. Preparación del entorno de pruebas

1. **Variables de entorno** (`.env.local`): `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, credenciales de Twilio (SMS), Sentry, y `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` para el seeder de administrador.
2. **Seed de Administrador**: `pnpm db:seed-admin` (usa `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`; es idempotente, si el usuario ya existe lo informa y no duplica).
3. **Seed de Nomenclador**: `pnpm db:seed-nomenclador` — crea la obra social `Particular / Sin Convenio` y 3 prestaciones base (Consulta Odontológica $5000, Obturación de Resina $15000, Limpieza Dental $8000). También idempotente.
4. **Usuario Secretaria**: no existe flujo de alta en UI. Para pruebas **manuales**, crearlo con `npx tsx scripts/qa-seed-secretaria.ts` (crea `qa.secretaria@test.local` / `QaSecretaria123!` contra la base de `.env.local`) o pedir a Desarrollo acceso directo a Mongo. Para la suite automatizada (ver §3.1) esto no hace falta — se hace solo.
5. **Usuario Doctor**: se crea en dos pasos — (a) alta del `Doctor` desde `/admin/doctors` (Administrador), (b) "Crear acceso" sobre esa fila para generar el `User` con `role: Doctor` vinculado.
6. **Health check de conexión a Mongo**: `pnpm db:ping`.

### 3.1 Suite automatizada (Playwright)

Desde `TASK-014`, `pnpm test:e2e` es **completamente autocontenido y aislado** — no toca la base de `pnpm dev` ni requiere ninguna preparación manual de los puntos 2-4 de arriba:

- Levanta su propio `next dev` en el puerto **3100** (no en el 3000 — podés correr tu `pnpm dev` normal en paralelo sin conflicto).
- Ese servidor apunta a una base Mongo aislada, `<nombre-de-tu-base>-e2e` (mismo patrón que `vitest.setup.ts` usa con `-test` desde `TASK-005`, ver `e2e/testDb.ts`).
- Un `globalSetup` (`e2e/global-setup.ts`) siembra ahí, antes de correr los tests, el Administrador (con las credenciales de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` de tu `.env.local`), la Secretaria de QA, la obra social por defecto y el nomenclador base — todo idempotente.
- Un `globalTeardown` (`e2e/global-teardown.ts`) **borra la base `-e2e` entera** al terminar, así cada corrida arranca de cero.
- El Doctor y los pacientes/turnos de cada corrida los crea la suite misma (`e2e/00-setup.spec.ts` en adelante) — no están precargados.

Correrla: `pnpm test:e2e`. Solo necesita que `MONGODB_URI`, `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` estén en `.env.local` — nada más.

## 4. Convenciones de este documento

- **Tipo de prueba**: `Funcional` (camino feliz) · `Validación` (negativo/campo inválido) · `RBAC` (control de acceso por rol) · `Regresión` (bug real ya corregido) · `Seguridad` (hallazgo o límite de autorización a validar con Producto).
- **Prioridad**: `Alta` / `Media` / `Baja`.
- Los mensajes de error citados son **el texto literal** que devuelve la aplicación (para que QA compare exacto, no aproximado).
- IDs de caso: `AUTH-`, `PAC-`, `ADM-`, `DOC-`, `SEC-`, `FLU-` (flujo end-to-end), `REG-` (regresión), `SEG-` (seguridad).

---

## 5. Matriz de RBAC (control de acceso por ruta)

| Ruta | Público | Administrador | Doctor | Secretaria |
|---|:---:|:---:|:---:|:---:|
| `/`, `/login` | ✅ | ✅ | ✅ | ✅ |
| `/patients/**` | *(eliminada por `TASK-023`, ver SEG-01)* cualquier ruta bajo este prefijo devuelve 404, para cualquiera |
| `/admin/**` | ❌ | ✅ | ❌ | ❌ |
| `/doctor/**` | ❌ | ❌ | ✅ (solo si tiene `doctorId` vinculado) | ❌ |
| `/recepcion/**` | ❌ | ❌ | ❌ | ✅ |
| `/api/files/[fileId]` | ❌ exige sesión (401 sin ella, desde `TASK-015`) — en la práctica staff-only desde `TASK-023`, ya no queda ningún otro rol capaz de autenticarse (ver SEG-02) |

### AUTH-01 — Redirección a login sin sesión (Funcional / RBAC · Alta)
**Pasos**: sin haber iniciado sesión, navegar directamente a `/admin`, `/doctor` y `/recepcion`.
**Resultado esperado**: las tres rutas redirigen (307) a `/login?callbackUrl=<ruta original>`.

### AUTH-02 — Acceso cruzado entre roles (RBAC · Alta)
**Pasos**: loguearse como Administrador y navegar a `/doctor` y `/recepcion`. Repetir logueado como Doctor intentando `/admin` y `/recepcion`. Repetir logueado como Secretaria intentando `/admin` y `/doctor`.
**Resultado esperado**: en los 9 cruces, la app redirige (307) a `/unauthorized`, que muestra "Acceso no autorizado — Tu usuario no tiene permiso para acceder a esta página." con link "Volver a iniciar sesión".

### AUTH-03 — Login con credenciales inválidas (Validación · Alta)
**Pasos**: en `/login`, ingresar un email inexistente, o un email válido con contraseña incorrecta.
**Resultado esperado**: mensaje **"Email o contraseña incorrectos."** debajo del formulario. No navega. (El mismo mensaje se usa para "usuario no existe" y "contraseña incorrecta" — no revela cuál de las dos falló, correcto desde el punto de vista de seguridad.)

### AUTH-04 — Validación de formato en login (Validación · Media)
**Pasos**: dejar el email vacío o con formato inválido (`asd`); dejar la contraseña vacía.
**Resultado esperado**: email → **"Correo electrónico inválido"**; contraseña vacía → **"La contraseña es obligatoria"**. No se envía el formulario.

### AUTH-05 — Redirección post-login según rol (Funcional · Alta)
**Pasos**: loguearse como cada uno de los 3 roles staff.
**Resultado esperado**: Administrador → `/admin`; Doctor → `/doctor`; Secretaria → `/recepcion`.

### AUTH-06 — Sesión expirada / logout (Funcional · Media)
**Pasos**: borrar manualmente la cookie de sesión (o esperar expiración) y refrescar una página protegida.
**Resultado esperado**: redirige a `/login`.

### SEG-01 — [RESUELTO POR ELIMINACIÓN — `TASK-023`] Acceso al perfil de un paciente sin autenticación (Seguridad · Alta)
**Contexto histórico**: hasta `TASK-022`, `/patients/[userId]/register`, `/patients/[userId]/new-appointment` y `/new-appointment/success` no estaban cubiertas por `middleware.ts` (su matcher solo incluía `/admin`, `/doctor`, `/recepcion`) y las Server Actions que usaban (`getUser`, `getPatient`, `registerPatient`, `createAppointment`) tampoco validaban sesión — la única "protección" era que `userId` fuera un ObjectId de Mongo difícil de adivinar. Era un IDOR (Insecure Direct Object Reference) real sobre datos de salud (PHI): cualquiera con el `userId` de otro paciente podía ver su ficha sin autenticarse.
**Resolución**: `TASK-023` eliminó por completo el portal público de pacientes (`/patients/**`) como decisión de producto — no como un parche de autenticación sobre la ruta pública (aunque `TASK-015` sí había llegado a agregar login DNI+PIN antes de esa decisión; ver `TASK-015`/`TASK-023` en `docs/PLANNING.md`). No queda ninguna ruta pública que exponga datos de un paciente por `userId`: la vulnerabilidad se cierra por eliminación de la superficie, no por control de acceso agregado sobre ella.
**Cómo verificarlo hoy**: `/patients/login`, `/patients/<cualquier-userId>/register` y `/patients/<cualquier-userId>/new-appointment` deben devolver **404** para cualquiera, autenticado o no (cubierto por el spec automatizado `e2e/04-security.spec.ts`, describe "SEG-01").
**Ya no es un caso a ejecutar como hallazgo abierto** — se deja documentado, con el mismo criterio que `docs/PLANNING.md` usa para tickets "superados", para que quede registro de qué vulnerabilidad existía y cómo se cerró.

### SEG-02 — Descarga de documentos: staff-only por construcción desde `TASK-023` (Seguridad · Media — antes Alta)
**Contexto técnico**: `/api/files/[fileId]` (foto de perfil de doctor, documento de identificación del paciente) exige sesión autenticada desde `TASK-015` — ya no alcanza con que `fileId` tenga formato de ObjectId válido. Lo que cambió con `TASK-023`/`TASK-024` es que **ya no existe ningún rol capaz de autenticarse fuera de Administrador/Doctor/Secretaria** — no queda ningún login de paciente que pudiera, con sesión propia, intentar acceder al archivo de otro paciente. La ruta pasó de "requiere sesión (podía ser de paciente)" a "staff-only por construcción (no hay otra sesión posible)".
**Pasos**: (a) sin sesión, pegar `/api/files/<fileId>` directo en el navegador; (b) repetir logueado con cualquier rol staff.
**Resultado esperado**: (a) **401**, no descarga; (b) **200**, descarga normal. Cubierto por `e2e/04-security.spec.ts`, describe "SEG-02".
**Nota**: no se restringió la descarga a "solo el staff que atiende a ese paciente puntual" — cualquier staff autenticado puede descargar cualquier archivo. Aceptable porque ya no hay pacientes con acceso al sistema que pudieran explotar esa amplitud entre sí; si en el futuro se reintrodujera algún tipo de acceso no-staff, esto habría que revisarlo de nuevo.

---

## 6. Suite por actor

### 6.1 Alta de pacientes y turnos, staff-side (`/recepcion/pacientes/nuevo`, `/admin/pacientes/nuevo`, "Nuevo turno" en `/admin`)

> Hasta `TASK-022` esta sección documentaba el flujo público de auto-servicio del paciente (`/`, `/patients/[userId]/register`, `/patients/[userId]/new-appointment`). `TASK-023` lo eliminó por completo — el paciente no tiene ningún acceso al sistema — y `TASK-024` lo reemplazó por un alta 100% mediada por Secretaría/Administrador. Los casos `PAC-*` de abajo prueban ese reemplazo. Se conserva el prefijo `PAC-` (casos sobre la ficha del paciente) y, donde hay equivalente real, el mismo número que el caso original — mismo criterio que usó la suite automatizada (`e2e/02-flujo.spec.ts` reutiliza literalmente los IDs `PAC-01/03` y `PAC-07` para sus versiones staff-side). El login DNI+PIN (`TASK-015`) y el re-registro por `userId` no tienen reemplazo — no existen más, por decisión de producto (ver `TASK-023` en `docs/PLANNING.md`).

#### PAC-01/03 — Alta de paciente con obra social y documento de identificación (Funcional · Alta)
**Pasos**: logueado como Secretaria (flujo primario, `/recepcion/pacientes/nuevo`) o Administrador (`/admin/pacientes/nuevo`), completar `CreatePatientForm`: nombre completo, correo electrónico, teléfono, fecha de nacimiento, género (radio), dirección, ocupación, médico de cabecera (desplegable de doctores **activos**), obra social (desplegable, default **"Particular / Sin Convenio"**, opcional), N° de afiliado (opcional), contacto de emergencia (opcional), tipo y número de identificación, y documento de identificación escaneado (**obligatorio** — a diferencia del viejo flujo público, no hay ningún paciente que pueda volver después a completarlo).
**Resultado esperado**: mensaje **"Paciente {nombre} creado con éxito."**; el paciente queda persistido con la obra social elegida (o el default). No hay checkboxes de consentimiento en este formulario — `createPatient` fija `privacyConsent: true` automáticamente, asumiendo que el consentimiento se capturó fuera del sistema (papel/verbal en la recepción), no que se relajó el requisito.
**Cubierto por**: `e2e/02-flujo.spec.ts`, test "PAC-01/03 - alta de paciente con obra social y documento de identificacion" (vía `createStaffPatient`).

#### PAC-02 — Validaciones del formulario de alta (Validación · Media)
| Campo | Caso inválido | Mensaje esperado |
|---|---|---|
| Nombre completo | 1 carácter | "El nombre debe tener al menos 2 caracteres" |
| Nombre completo | 51+ caracteres | "El nombre debe tener como máximo 50 caracteres" |
| Correo electrónico | `sin-arroba` | "Correo electrónico inválido" |
| Teléfono | sin código de país / formato libre | "Número de teléfono inválido" (regex `^\+\d{10,15}$`, exige `+` y 10 a 15 dígitos, sin espacios ni guiones) |
| Dirección | 4 caracteres o menos | "La dirección debe tener al menos 5 caracteres" |
| Ocupación | 1 carácter | "La ocupación debe tener al menos 2 caracteres" |
| Médico de cabecera | sin seleccionar | "Seleccioná al menos un doctor" |
| N° de identificación | 1 carácter | "El número de identificación debe tener al menos 2 caracteres" |

#### PAC-04 — Documento de identificación obligatorio (Validación · Alta)
**Contexto**: en el viejo flujo público el documento era opcional (drag & drop, el paciente podía completarlo más tarde). En el alta staff-side no hay "más tarde" — es obligatorio desde `TASK-024`.
**Pasos**: intentar enviar `CreatePatientForm` sin adjuntar ningún archivo.
**Resultado esperado**: **"El documento de identificación es obligatorio"**. No se crea el paciente.

#### PAC-05 — Selector de obra social trae datos reales (Funcional · Media)
**Pasos**: abrir el desplegable "Obra social (opcional)" en `/recepcion/pacientes/nuevo` o `/admin/pacientes/nuevo`.
**Resultado esperado**: lista al menos "Particular / Sin Convenio" (sembrada por `pnpm db:seed-nomenclador`), preseleccionada por default si no se toca el campo.

#### PAC-06 — *(Retirado, sin reemplazo — `TASK-023`)* Re-registro sobre un `userId` existente
El caso original probaba que, con un `userId` ya asociado a un `Patient`, `/patients/[userId]/register` redirigía directo al paso siguiente en vez de mostrar el formulario de nuevo. No tiene equivalente: el alta staff-side es un único paso sin `userId` en la URL, no existe el concepto de "paciente a medio registrar". Retirado por decisión de producto, no por omisión — se documenta para que quede registro de que la ausencia es intencional.

#### PAC-07 — Alta de turno para el paciente recién creado (Funcional · Alta)
**Pasos**: como Administrador, en `/admin`, clic en "Nuevo turno" (`AdminNewAppointmentModal`, `TASK-018`) → buscar al paciente por email o teléfono exacto → elegir doctor, fecha y hora → completar motivo → enviar.
**Resultado esperado**: crea la cita con estado **`pending`** (no `scheduled` — la confirmación la hace el Administrador después, ver ADM-08) y cierra el modal, refrescando el listado de `/admin` sin recargar la página.
**Cubierto por**: `e2e/02-flujo.spec.ts`, test "PAC-07 - solicitud de turno queda pending" (vía `bookAppointmentAsAdmin`).

#### PAC-08 — Validaciones del formulario de turno (Validación · Media)
- Sin doctor seleccionado → "Seleccioná al menos un doctor".
- "Motivo del turno" vacío o de 1 carácter → "El motivo debe tener al menos 2 caracteres".

---

### 6.2 Administrador (`/admin/**`)

#### ADM-01 — Dashboard con contadores (Funcional · Alta)
**Pasos**: loguearse como Administrador, ir a `/admin`.
**Resultado esperado**: se ven `scheduledCount`, `pendingCount`, `cancelledCount` y el listado de turnos recientes. **Nota**: los turnos con estado `completed` (facturados por Recepción) no suman en ninguno de estos 3 contadores — es un gap conocido, no un bug a reportar como crítico, pero sí a dejar registrado para backlog futuro.

#### ADM-02 — Alta de doctor (Funcional · Alta)
**Pasos**: en `/admin/doctors`, completar nombre, especialidad, matrícula, foto (obligatoria) y al menos un día de disponibilidad con horario.
**Resultado esperado**: el doctor aparece en el listado, activo por default, y queda disponible para elegir en los formularios de turno.

#### ADM-03 — Validaciones de alta de doctor (Validación · Media)
| Campo | Caso inválido | Mensaje |
|---|---|---|
| Nombre | 1 carácter | "El nombre debe tener al menos 2 caracteres" |
| Especialidad | 1 carácter | "La especialidad debe tener al menos 2 caracteres" |
| Matrícula | 1 carácter | "La matrícula debe tener al menos 2 caracteres" |
| Foto | sin adjuntar | "La foto es obligatoria" |
| Disponibilidad | ningún día tildado | "Seleccioná al menos un día de disponibilidad" |

#### ADM-04 — Edición de doctor sin cambiar la foto (Funcional · Media)
**Pasos**: editar un doctor existente sin tocar el campo de foto.
**Resultado esperado**: conserva la foto anterior (la foto es **opcional** en edición, a diferencia del alta).

#### ADM-05 — Desactivar / reactivar doctor (Funcional · Alta)
**Pasos**: clic en "Desactivar" sobre un doctor activo.
**Resultado esperado**: pasa a mostrar "(inactivo)" junto al nombre; el botón cambia a "Reactivar". El doctor desactivado **desaparece** del desplegable de doctores en los formularios de turno/registro (que usan `getActiveDoctors`), pero **sigue apareciendo** en `/admin/doctors` (usa `getAllDoctors`) y en el historial de turnos ya agendados con él.

#### ADM-06 — Crear acceso de login para un doctor (Funcional · Alta)
**Pasos**: sobre un doctor ya dado de alta, clic en "Crear acceso", completar email y contraseña.
**Resultado esperado**: se crea un `User` con `role: Doctor` vinculado a ese `Doctor`. Ese usuario ya puede loguearse en `/login` y accede a `/doctor` viendo su propia agenda.

#### ADM-07 — Email duplicado al crear acceso (Validación · Media)
**Pasos**: crear acceso con un email ya usado por otro usuario (staff o el mismo doctor dos veces).
**Resultado esperado**: **"No se pudo crear el acceso. Verificá el email e intentá de nuevo."** (el email es único a nivel de índice de Mongo).

#### ADM-08 — Agenda de turnos: crear directo, confirmar y cancelar (Funcional · Alta)
**Pasos**: desde `/admin`, crear un turno directo para un paciente, luego confirmar un turno `pending` (pasa a `scheduled`), luego cancelar un turno con motivo.
**Resultado esperado**: los tres cambian de estado correctamente y disparan (intento de) SMS al paciente vía Twilio — ver ADM-10.

#### ADM-09 — Choque de horario (Validación de negocio · Alta)
**Pasos**: intentar confirmar/crear un turno para un doctor en un horario donde ya tiene otro turno no cancelado.
**Resultado esperado**: **"No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo."** No se persiste el cambio.

#### ADM-10 — Falla de SMS no bloquea el turno (Regresión / Resiliencia · Media)
**Contexto**: `sendSMSNotification` está en un `try/catch` separado — si Twilio falla (credenciales inválidas, número mal formado), el error se loguea a consola/Sentry pero **no** revierte la actualización del turno.
**Pasos**: forzar una falla de Twilio (ej. credenciales inválidas en `.env.local` de un ambiente de prueba) y confirmar un turno.
**Resultado esperado**: el turno queda `scheduled` igual, aunque el SMS no se haya enviado. Verificar en Sentry/logs que el error quedó registrado.
**Nota (`TASK-024`/`TASK-028`)**: desde `TASK-024` ningún paciente tiene `userId` (el alta staff-side no lo crea), así que `updateAppointment` omite el envío de SMS **antes** de intentar Twilio — este caso ya no se puede disparar con un turno de un paciente nuevo. `TASK-028` documentó esto como decisión de producto (SMS de confirmación/cancelación no se usa por ahora), no como bug pendiente. Para ejercitar este caso puntual hace falta un turno de un paciente con `userId` heredado de antes de `TASK-024`.

#### ADM-11 — CRUD del nomenclador de prestaciones (Funcional · Alta)
**Pasos**: en `/admin/treatments`, crear una prestación (nombre, precio, descripción opcional), editarla, desactivarla y reactivarla.
**Resultado esperado**: igual patrón que doctores — soft delete, desaparece de `getActiveTreatments` (usado por el Doctor al cargar una evolución) pero se sigue viendo en el listado admin.

#### ADM-12 — Validaciones de prestación (Validación · Media)
- Nombre 1 carácter → "El nombre debe tener al menos 2 caracteres".
- Precio 0 o negativo → "El precio debe ser mayor a 0".
- Descripción de 501+ caracteres → "La descripción debe tener como máximo 500 caracteres".

---

### 6.3 Doctor (`/doctor/**`)

#### DOC-01 — Agenda propia (Funcional · Alta)
**Pasos**: loguearse como Doctor, ver `/doctor`.
**Resultado esperado**: lista únicamente los turnos donde `primaryPhysician` coincide con el nombre de ese doctor, ordenados por fecha.

#### DOC-02 — Doctor sin perfil vinculado (RBAC · Alta)
**Contexto**: `requireDoctorSession()` exige `session.user.role === "Doctor"` **y** `doctorId` presente.
**Pasos**: (requiere acceso a base) loguear un usuario `role: Doctor` sin `doctorId` seteado.
**Resultado esperado**: cualquier acción del doctor (ver agenda, ficha de paciente, odontograma, evolución) falla puertas adentro con `"Forbidden: Doctor role with a linked doctor profile required"`. Resuelto en `TASK-019`: la UI ahora muestra un mensaje de error explícito en estos casos (antes se traducía en listas vacías o el formulario no guardando, sin mensaje visible, y quedaba solo en el log de servidor).

#### DOC-03 — Ficha clínica del paciente (Funcional · Alta)
**Pasos**: desde la agenda, entrar a la ficha de un paciente con un turno asociado (`?appointmentId=...` en la URL).
**Resultado esperado**: se ven antecedentes médicos (alergias, medicación actual, antecedentes familiares/personales, o "Sin registrar" si están vacíos), el odontograma, el formulario de "Nueva evolución" (solo aparece si hay `appointmentId` en la URL) y el histórico de evoluciones previas.

#### DOC-04 — Odontograma: carga inicial (Funcional · Alta)
**Pasos**: abrir la ficha de un paciente que nunca tuvo odontograma.
**Resultado esperado**: se generan **32 piezas permanentes** (notación FDI 11–18, 21–28, 31–38, 41–48), todas sin condición marcada (blanco). No se persiste nada hasta el primer "Guardar".

#### DOC-05 — Odontograma: marcar condiciones (Funcional · Alta)
**Pasos**: hacer clic repetidas veces sobre una cara de un diente (mesial/distal/vestibular/palatal/oclusal).
**Resultado esperado**: cicla en este orden exacto: sin marcar → **Caries** (rojo) → **Obturado** (azul) → **Ausente** (gris oscuro) → **Endodoncia** (violeta) → **Corona** (amarillo) → vuelve a sin marcar. Clic en "Guardar odontograma" persiste el estado; refrescar la página lo mantiene.

#### DOC-06 — Odontograma: aislamiento por paciente (Regresión · Alta)
**Contexto**: hubo un bug real donde el spread de un subdocumento de Mongoose devolvía caras vacías aunque estuvieran guardadas.
**Pasos**: guardar condiciones distintas en dos pacientes diferentes, navegar entre sus fichas.
**Resultado esperado**: cada paciente muestra únicamente sus propias condiciones, sin mezclarse ni perderse al recargar.

#### DOC-07 — Carga de evolución sin prestaciones (Funcional · Media)
**Pasos**: completar solo el campo de nota (2–2000 caracteres) sin tildar ninguna prestación, guardar.
**Resultado esperado**: se guarda la evolución con `treatments: []`. Aparece en el histórico con la nota, sin línea de "Prestaciones:".

#### DOC-08 — Validación de nota de evolución (Validación · Media)
**Pasos**: enviar con 1 carácter, o con 2001+ caracteres.
**Resultado esperado**: **"La nota debe tener al menos 2 caracteres"** / **"La nota debe tener como máximo 2000 caracteres"**.

#### DOC-09 — Carga de evolución con prestaciones realizadas (Funcional · Alta — clave para el flujo de cobro)
**Pasos**: tildar 1 o más prestaciones activas (con su precio visible junto al nombre, ej. "Limpieza Dental — $8.000") y guardar.
**Resultado esperado**: la evolución queda con esas prestaciones (nombre y precio "fotografiados" al momento de guardar, no una referencia viva al nomenclador). El histórico muestra "Prestaciones: Limpieza Dental, Obturación de Resina", etc. **Este es el único punto de entrada que habilita después el cobro en Recepción — sin esto, el turno nunca aparece en `/recepcion`.**

#### DOC-10 — Prestación desactivada no aparece para tildar (Funcional · Media)
**Pasos**: como Administrador, desactivar una prestación. Como Doctor, abrir el formulario de evolución de un paciente.
**Resultado esperado**: la prestación desactivada no aparece en la lista de checkboxes (usa `getActiveTreatments`).

---

### 6.4 Secretaria (`/recepcion/**`)

#### SEC-01 — Cola de turnos para cobrar (Funcional · Alta)
**Pasos**: loguearse como Secretaria, ver `/recepcion`.
**Resultado esperado**: lista solo turnos con estado `scheduled` que tengan **al menos una prestación cargada** por el doctor en alguna evolución **y que todavía no tengan un pago registrado**. Si no hay ninguno: "No hay turnos con prestaciones cargadas pendientes de cobro."

#### SEC-02 — Turno sin prestaciones cargadas por el doctor: cobro manual/walk-in (Funcional · Alta)
**Pasos**: un turno `scheduled` cuya consulta ya pasó, pero el doctor nunca tildó ninguna prestación al cargar la evolución (o no cargó evolución). Loguearse como Secretaria y entrar a `/recepcion`.
**Resultado esperado**: resuelto en `TASK-017` — el turno **sí aparece en la cola de cobro** (con el flag `hasChartedTreatments` en `false`), mostrando el aviso "El doctor no cargó prestaciones...". La Secretaria tilda manualmente las prestaciones sobre el nomenclador vigente (mismo patrón de checkboxes que usa el doctor en `ClinicalNoteForm`), el total se actualiza en vivo, y el botón "Cobrar" queda deshabilitado hasta tildar al menos una. Al confirmar, `closeAppointmentBilling` resuelve nombre y precio de cada prestación tildada **del lado del servidor** contra el nomenclador (nunca confía en un precio mandado por el cliente); el recibo generado muestra el detalle y el total igual que en un cobro con evolución cargada por el doctor.

#### SEC-03 — Cierre de cobro (Funcional · Alta)
**Pasos**: elegir un turno de la cola, seleccionar medio de pago (Efectivo / Transferencia / Tarjeta) y confirmar "Cobrar y cerrar turno".
**Resultado esperado**: se crea el registro de pago con el total = suma de precios de las prestaciones cargadas; el turno pasa a estado **`completed`** (badge muestra **"Finalizada"**, junto con "Pendiente"/"Confirmada"/"Cancelada" para los otros tres estados desde `TASK-022` — el valor interno persistido en Mongo sigue siendo el enum en inglés, solo cambió la etiqueta mostrada); redirige al recibo en `/recepcion/recibo/[appointmentId]`.

#### SEC-04 — Cálculo del total (Funcional · Alta)
**Pasos**: cobrar un turno con 2 prestaciones cargadas por el doctor (ej. Consulta $5.000 + Obturación $15.000).
**Resultado esperado**: total mostrado y cobrado = **$20.000** exacto, sin ningún descuento de obra social (regla de negocio del MVP: 100% a cargo del paciente, sin importar qué obra social tenga cargada — no hay matriz de coberturas implementada).

#### SEC-05 — Doble cobro del mismo turno (Regresión / Validación · Alta)
**Contexto**: `Payment.appointmentId` tiene índice único en Mongo — cobrar dos veces el mismo turno debe fallar.
**Pasos**: cobrar un turno; intentar cobrarlo de nuevo (ej. doble clic accidental, o volver atrás y reenviar).
**Resultado esperado**: la segunda vez falla con **"No se pudo registrar el cobro. Intentá de nuevo."** y no se genera un segundo pago ni se duplica el monto facturado. El turno ya no debería aparecer en la cola de `/recepcion` tras el primer cobro exitoso.

#### SEC-06 — Recibo imprimible (Funcional · Media)
**Pasos**: entrar al recibo generado tras un cobro, clic en "Imprimir / Descargar PDF".
**Resultado esperado**: abre el diálogo de impresión nativo del navegador (no hay generación de PDF propia de la app — "descargar PDF" se logra eligiendo "Guardar como PDF" como destino en ese diálogo). El recibo impreso oculta el logo/botón superior (`print:hidden`) y muestra: paciente, profesional, medio de pago, quién lo registró, fecha, detalle de prestaciones con precios, y total.

#### SEC-07 — Reimpresión de un recibo ya emitido (Funcional · Media)
**Pasos**: volver a entrar a `/recepcion/recibo/[appointmentId]` de un turno ya cobrado (ej. compartiendo el link de nuevo).
**Resultado esperado**: muestra el mismo recibo con los mismos datos (no genera uno nuevo ni permite cobrar de nuevo).

#### SEC-08 — Acceso a recibo de un turno no cobrado (Validación · Media)
**Pasos**: navegar manualmente a `/recepcion/recibo/[appointmentId-de-un-turno-sin-pago]`.
**Resultado esperado**: redirige a `/recepcion` (no hay pago que mostrar).

---

## 7. Flujos de negocio end-to-end

### FLU-01 — Alta de paciente hasta turno solicitado (Alta)
`/recepcion/pacientes/nuevo` o `/admin/pacientes/nuevo` (PAC-01/03, con obra social y documento de identificación) → `/admin` → "Nuevo turno" (PAC-07) → turno queda `pending`.
**Criterio de aceptación**: el paciente, su obra social y el turno `pending` quedan visibles para el Administrador en `/admin` sin pasos manuales adicionales. Desde `TASK-023`/`TASK-024` todo el flujo es staff-side — ningún paso depende de que el paciente use el sistema.

### FLU-02 — Confirmación de turno y atención clínica completa (Alta)
Administrador confirma el turno `pending` → `scheduled` (ADM-08) → Doctor entra a la ficha del paciente el día del turno (DOC-03) → carga odontograma (DOC-05) → carga evolución con prestaciones (DOC-09).
**Criterio de aceptación**: tras estos pasos, el turno debe aparecer en la cola de cobro de Recepción (SEC-01) con el total correcto.

### FLU-03 — Cobro y cierre del ciclo (Alta)
Continuación de FLU-02: Secretaria cobra el turno (SEC-03) → turno pasa a `completed` → se emite recibo (SEC-06).
**Criterio de aceptación end-to-end**: desde que el paciente pide el turno hasta que se le cobra, **ningún paso requiere edición manual en base de datos** (salvo la creación de usuarios staff — Doctor vía UI, Secretaria vía base, ver §3), y el monto cobrado coincide exactamente con la suma de precios de las prestaciones cargadas por el doctor.

### FLU-04 — Doctor con acceso recién creado (Media)
Administrador da de alta un doctor (ADM-02) → crea su acceso (ADM-06) → el doctor se loguea por primera vez → ve su agenda vacía en `/doctor` hasta que se le asignen turnos.

### FLU-05 — Ciclo de vida de una prestación en el cobro (Media)
Administrador crea una prestación (ADM-11) → Doctor la tilda en una evolución (DOC-09) → Administrador la desactiva → **el precio ya cobrado no cambia retroactivamente** (verificar que el recibo emitido conserva el precio vigente al momento del cobro, no el actual del nomenclador).

---

## 8. Regresión (bugs reales corregidos durante el desarrollo)

Estos casos existen porque ya fallaron una vez en desarrollo. Priorizarlos en cada regresión general, no solo la primera vez.

| ID | Bug original | Cómo probarlo hoy |
|---|---|---|
| REG-01 | El dashboard de `/admin` crasheaba porque las Server Actions de paciente/turno no llamaban a `connectToDatabase()` en un proceso recién iniciado (buffer de Mongoose expiraba a los 10s). | Reiniciar el servidor en frío y entrar directo a `/admin` sin navegar antes por otra página. Debe cargar sin error. |
| REG-02 | Horarios disponibles mal calculados por mezclar UTC y hora local en el cálculo de turnos ocupados. | En un servidor no configurado en UTC, verificar que los horarios disponibles mostrados coincidan con la disponibilidad real cargada del doctor (probar cerca de medianoche). |
| REG-03 | El odontograma devolvía caras vacías por un spread incorrecto de subdocumento de Mongoose (ver DOC-06). | DOC-06. |
| REG-04 | `AppointmentForm` no enviaba `timeZone` a `updateAppointment` — rompía el build de producción (`pnpm build`), no solo en desarrollo. | Confirmar que reprogramar/cancelar un turno desde `/admin` funciona sin error, y que `pnpm build` corre limpio (chequeo técnico, no de UI). |
| REG-05 | Cobrar dos veces el mismo turno (ver SEC-05). | SEC-05. |
| REG-06 | Bug de límites de rol: un Server Action podía ejecutarse aunque `middleware.ts` bloqueara la página, porque las Actions tienen su propio endpoint HTTP. | AUTH-02 más una prueba técnica extra: intentar invocar una acción de Administrador (ej. crear prestación) estando logueado como Doctor, vía herramientas de desarrollador / requests directos — debe fallar igual que en la UI. |

---

## 9. Checklist de regresión técnica (no funcional, pero bloqueante para cualquier release)

- [ ] `pnpm build` termina sin errores (ver REG-04 — se rompió una vez y no se detectó hasta tarde).
- [ ] `pnpm dev` levanta sin warnings de configuración.
- [ ] Los 3 roles staff pueden loguearse y son redirigidos a su home correspondiente (AUTH-05).
- [ ] Ningún rol puede acceder a rutas de otro rol (AUTH-02).
- [ ] Los seeds (`db:seed-admin`, `db:seed-nomenclador`) son idempotentes — correrlos dos veces no duplica datos.

---

## 10. Resumen de hallazgos abiertos para Producto (no son bugs de implementación, son decisiones de alcance a confirmar)

1. **SEG-01 / SEG-02**: resueltos. `TASK-023` eliminó el portal público de pacientes por completo (SEG-01 deja de aplicar — no queda superficie pública que exponga datos de un paciente). La descarga de archivos (`/api/files/[fileId]`) exige sesión desde `TASK-015`, y desde `TASK-023` eso es staff-only en la práctica porque no queda ningún otro rol capaz de autenticarse (SEG-02).
2. **SEC-02**: resuelto en `TASK-017` — Recepción ahora cuenta con un flujo de cobro manual/walk-in para turnos sin prestaciones cargadas por el doctor.
3. **ADM-01**: resuelto en `TASK-016` — el dashboard de admin ahora cuenta los turnos `completed` en sus stat cards.
4. **Idioma**: resuelto en `TASK-022` — todo el sistema, incluido el portal del paciente, está en español.
5. No existe today una gestión de Obras Sociales/Planes con coberturas diferenciadas — todo se cobra al 100% como "Particular", por decisión explícita tomada durante el desarrollo (ver `docs/obra-social.md` para el diseño completo si se retoma a futuro).
