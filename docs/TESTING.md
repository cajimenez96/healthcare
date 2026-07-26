# Plan de Pruebas (QA) — Sistema Clínico Odontológico (MVP)

Este documento es el plan de pruebas manuales para el sistema construido según `docs/PLANNING.md` (TASK-001 a TASK-013, backlog completo). Está pensado para que un QA Sr. pueda ejecutar la ronda de pruebas por flujo de negocio sin depender del código ni de quien lo desarrolló.

## 1. Alcance

Cubre los 4 actores del sistema y los 6 flujos de negocio principales, con casos funcionales (happy path), negativos (validaciones), de seguridad (RBAC) y de regresión (bugs reales encontrados durante el desarrollo, para evitar que vuelvan a aparecer). No cubre performance ni carga.

## 2. Actores del sistema

| Actor | Cómo se identifica | Home tras login | Rutas propias |
|---|---|---|---|
| **Paciente** | Sin autenticación real — se identifica por un `userId` (ObjectId de Mongo) en la URL, generado al completar el formulario inicial en `/`. No tiene contraseña. | `/patients/[userId]/register` → `/patients/[userId]/new-appointment` | `/`, `/patients/**` |
| **Administrador** | Usuario staff con `role: Administrador`, login por email + contraseña en `/login` | `/admin` | `/admin/**` |
| **Doctor** | Usuario staff con `role: Doctor`, **vinculado obligatoriamente** a un documento `Doctor` (`doctorId`). Se crea únicamente desde "Crear acceso" en `/admin/doctors`. | `/doctor` | `/doctor/**` |
| **Secretaria** | Usuario staff con `role: Secretaria`, login por email + contraseña. No hay alta desde la UI — se crea directamente en base (ver §3). | `/recepcion` | `/recepcion/**` |

> ℹ️ **Nota de idioma para QA**: desde `TASK-022`, toda la UI (incluido el portal público del paciente en `/` y `/patients/**`, que hasta entonces había quedado en inglés por decisión de alcance de `TASK-004`) está en español. Los valores de enum persistidos en Mongo (`Gender`, `IdentificationType`, `Status`, `PaymentMethod`) siguen en inglés internamente — solo cambió la etiqueta mostrada en pantalla.

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

| Ruta | Público | Paciente | Administrador | Doctor | Secretaria |
|---|:---:|:---:|:---:|:---:|:---:|
| `/`, `/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/patients/[userId]/**` | ⚠️ sin control de sesión (ver SEG-01) |
| `/admin/**` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/doctor/**` | ❌ | ❌ | ❌ | ✅ (solo si tiene `doctorId` vinculado) | ❌ |
| `/recepcion/**` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/files/[fileId]` | ⚠️ sin control de sesión (ver SEG-02) |

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

### SEG-01 — Acceso al perfil de un paciente sin autenticación (Seguridad · Alta — validar con Producto)
**Contexto técnico**: `/patients/[userId]/register`, `/patients/[userId]/new-appointment` y `/new-appointment/success` **no** están cubiertas por `middleware.ts` (su matcher solo incluye `/admin`, `/doctor`, `/recepcion`) y las Server Actions que usan (`getUser`, `getPatient`, `registerPatient`, `createAppointment`) tampoco validan sesión. La única "protección" es que `userId` es un ObjectId de Mongo difícil de adivinar.
**Pasos**: como usuario no autenticado, con el `userId` de otro paciente (obtenido, por ejemplo, de un link compartido o de la URL de otra pestaña), navegar a `/patients/<userId-ajeno>/register`.
**Resultado esperado hoy**: la página carga con los datos del paciente (nombre, email, teléfono, alergias, medicación, etc. si ya registró). **Esto es un hallazgo real, no una prueba que deba "pasar" en verde** — repórtese como IDOR (Insecure Direct Object Reference) sobre datos de salud (PHI) y que Producto decida si es aceptable para este MVP o si requiere autenticación real de pacientes.

### SEG-02 — Descarga de documentos sin autenticación (Seguridad · Alta — validar con Producto)
**Contexto técnico**: `/api/files/[fileId]` (usado tanto para la foto de perfil del doctor como para el documento de identificación escaneado del paciente) no valida sesión — solo valida que `fileId` tenga formato de ObjectId válido.
**Pasos**: con un `fileId` de un documento de identificación subido por un paciente (visible en el HTML de la página de registro si el paciente ya lo cargó), pegar `/api/files/<fileId>` directo en el navegador sin sesión.
**Resultado esperado hoy**: el archivo se descarga igual, sin pedir login. Mismo criterio que SEG-01: reportar como hallazgo para decisión de Producto, no como bug a "arreglar solo".

---

## 6. Suite por actor

### 6.1 Paciente (`/`, `/patients/**`)

#### PAC-01 — Alta inicial de paciente (Funcional · Alta)
**Pasos**: en `/`, completar "Nombre completo", "Correo electrónico", "Número de teléfono" y enviar.
**Resultado esperado**: redirige a `/patients/[userId]/register`.

#### PAC-02 — Validaciones del formulario inicial (Validación · Media)
| Campo | Caso inválido | Mensaje esperado |
|---|---|---|
| Nombre completo | 1 carácter | "El nombre debe tener al menos 2 caracteres" |
| Nombre completo | 51+ caracteres | "El nombre debe tener como máximo 50 caracteres" |
| Correo electrónico | `sin-arroba` | "Correo electrónico inválido" |
| Teléfono | sin código de país / formato libre | "Número de teléfono inválido" (regex `^\+\d{10,15}$`, exige `+` y 10 a 15 dígitos, sin espacios ni guiones) |

#### PAC-03 — Registro completo del paciente (Funcional · Alta)
**Pasos**: completar todo `/patients/[userId]/register`: datos personales, género (radio), dirección, ocupación, contacto de emergencia, médico de cabecera (desplegable de doctores **activos**), obra social (desplegable, default **"Particular / Sin Convenio"**), N° de afiliado, antecedentes médicos (opcionales), tipo y número de identificación, documento escaneado (opcional, drag & drop), y tildar los 3 consentimientos.
**Resultado esperado**: redirige a `/patients/[userId]/new-appointment`. El paciente queda persistido con la obra social elegida.

#### PAC-04 — Consentimientos obligatorios (Validación · Alta)
**Pasos**: intentar enviar el registro sin tildar "treatmentConsent", "disclosureConsent" o "privacyConsent" (uno por vez).
**Resultado esperado**: respectivamente — "Debés dar tu consentimiento de tratamiento para continuar", "Debés dar tu consentimiento de divulgación para continuar", "Debés aceptar la política de privacidad para continuar". No se crea el paciente.

#### PAC-05 — Selector de obra social trae datos reales (Funcional · Media)
**Pasos**: abrir el desplegable de "Obra social" en el registro.
**Resultado esperado**: lista al menos "Particular / Sin Convenio" (sembrada por `pnpm db:seed-nomenclador`), preseleccionada por default.

#### PAC-06 — Paciente ya registrado no puede re-registrarse (Funcional · Media)
**Pasos**: con un `userId` que ya tiene un `Patient` asociado, navegar a `/patients/[userId]/register`.
**Resultado esperado**: redirige directo a `/patients/[userId]/new-appointment` (no muestra el formulario de nuevo).

#### PAC-07 — Solicitud de turno (Funcional · Alta)
**Pasos**: en `/patients/[userId]/new-appointment`, elegir doctor, fecha/hora, motivo, y enviar.
**Resultado esperado**: crea la cita con estado **`pending`** (no `scheduled` — la confirmación la hace el Administrador) y redirige a la página de éxito.

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
**Resultado esperado**: cualquier acción del doctor (ver agenda, ficha de paciente, odontograma, evolución) falla puertas adentro con `"Forbidden: Doctor role with a linked doctor profile required"` — en la UI esto se traduce en listas vacías o el formulario no guardando, no en un mensaje explícito (revisar si conviene mejorar el mensaje de error visible; hoy solo queda en el log de servidor).

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

#### SEC-02 — Turno sin prestaciones no aparece para cobrar (Funcional · Alta — gap de negocio a validar)
**Pasos**: un turno `scheduled` cuya consulta ya pasó, pero el doctor nunca tildó ninguna prestación al cargar la evolución (o no cargó evolución).
**Resultado esperado hoy**: **no aparece nunca en la cola de cobro**, y no existe ninguna pantalla alternativa para cargar un cobro "a mano" sin pasar por el doctor. Documentar como límite conocido del MVP (no hay flujo de cobro manual/walk-in) — a validar con Producto si es aceptable.

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
`/` (PAC-01) → `/patients/[userId]/register` (PAC-03, con obra social) → `/patients/[userId]/new-appointment` (PAC-07) → turno queda `pending`.
**Criterio de aceptación**: el paciente, su obra social y el turno `pending` quedan visibles para el Administrador en `/admin` sin pasos manuales adicionales.

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

1. **SEG-01 / SEG-02**: el portal del paciente y la descarga de archivos no tienen autenticación real. Aceptable para una demo/MVP cerrado, pero **no debería ir a producción con pacientes reales sin revisar esto**.
2. **SEC-02**: no hay forma de cobrar un turno si el doctor no cargó prestaciones — no hay cobro manual/walk-in.
3. **ADM-01**: los turnos `completed` no se cuentan en ningún stat card del dashboard de admin.
4. **Idioma**: resuelto en `TASK-022` — todo el sistema, incluido el portal del paciente, está en español.
5. No existe today una gestión de Obras Sociales/Planes con coberturas diferenciadas — todo se cobra al 100% como "Particular", por decisión explícita tomada durante el desarrollo (ver `docs/obra-social.md` para el diseño completo si se retoma a futuro).
