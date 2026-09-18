# Guía de Pruebas Manuales

Checklist paso a paso para probar el sistema clínico odontológico haciendo clic en la aplicación real, pensado para alguien sin conocimientos técnicos (recepción, administración o QA). No requiere leer código ni ejecutar comandos de test automatizados — solo abrir el navegador y seguir los pasos.

Este documento es un complemento de `docs/TESTING.md` (documento técnico para desarrolladores, con IDs de test y referencias a Playwright/Vitest). Acá no vas a encontrar esos IDs ni jerga de automatización — solo pasos concretos y qué deberías ver en pantalla.

El sistema tiene tres roles de uso interno: **Administrador**, **Doctor** y **Secretaria**. El paciente no tiene ningún acceso propio al sistema — todo su alta y gestión la hace el personal de la clínica.

---

## 1. Preparación

Esta checklist asume una base de datos local limpia y recién sembrada. Si ya la usaste antes para otra prueba, algunos datos (doctores, pacientes, turnos) van a estar de una corrida anterior — no es un problema, pero los resultados exactos de las búsquedas pueden variar.

- [ ] **Instalar dependencias**: en la carpeta del proyecto, correr `pnpm install`.
- [ ] **Configurar variables de entorno**: confirmar que existe un archivo `.env.local` con al menos `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` cargados (pedile estos valores a quien te haya dado acceso al proyecto si no los tenés).
- [ ] **Sembrar el usuario Administrador inicial**: correr `pnpm db:seed-admin`. Esto crea el primer usuario Administrador con el email y contraseña definidos en `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` de tu `.env.local`.
- [ ] **Sembrar el nomenclador base**: correr `pnpm db:seed-nomenclador`. Esto carga la obra social "Particular / Sin Convenio" y algunas prestaciones base (Consulta Odontológica, Obturación de Resina, Limpieza Dental) para que haya datos con los que probar desde el primer momento.
- [ ] **Levantar la aplicación**: correr `pnpm dev` y abrir `http://localhost:3000` en el navegador.
- [ ] **Login como Administrador**: ir a `http://localhost:3000/login`, completar Email y Contraseña con los valores de `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, y hacer clic en "Ingresar". Deberías terminar en el Dashboard de `/admin`.

A partir de acá, cada sección asume que estás logueado con el rol correspondiente (Administrador, Doctor o Secretaria). Para pasar de un rol a otro, cerrá sesión primero (ver "Logout" en cada sección) y volvé a entrar con las credenciales del otro rol.

---

## 2. Administrador

Todo lo que sigue se prueba logueado como Administrador, dentro de `/admin`.

### 2.1 Login / Logout

- [ ] Ir a `/login`, completar Email y Contraseña del Administrador, hacer clic en "Ingresar". Se espera: redirección a `/admin` con el Dashboard visible ("Bienvenido 👋").
- [ ] Intentar loguearse con una contraseña incorrecta. Se espera: mensaje "Email o contraseña incorrectos." debajo del formulario, sin salir de `/login`.
- [ ] Abrir el menú de navegación (ícono de tres líneas, arriba a la derecha) y hacer clic en "Cerrar sesión" (botón rojo, al final del menú). Se espera: redirección a `/login`.

### 2.2 Navegación (menú offcanvas)

- [ ] Con sesión de Administrador activa, hacer clic en el ícono de menú (☰) arriba a la derecha, en cualquier pantalla de `/admin`. Se espera: un panel se desliza desde la izquierda con el título "Menú".
- [ ] Verificar que el menú del Administrador tiene estos links, en este orden: **Dashboard**, **Nuevo turno**, **Nuevo paciente**, **Pacientes**, **Doctores**, **Secretarías**, **Administradores**, **Nomenclador** — y el botón "Cerrar sesión" al final.
- [ ] Hacer clic en cualquier link del menú (por ejemplo "Doctores"). Se espera: navega a esa pantalla y el menú se cierra solo.
- [ ] Volver a abrir el menú y cerrarlo con la "X" (arriba a la derecha del panel) o haciendo clic fuera del panel. Se espera: el menú se cierra sin navegar a ningún lado.

### 2.3 Gestión de Doctores (`/admin/doctors`)

- [ ] Ir a "Doctores" desde el menú. Se espera: un listado de doctores (vacío o con datos previos) y un botón "Crear Doctor" arriba a la derecha.
- [ ] Hacer clic en "Crear Doctor". Se espera: se abre un diálogo "Alta de doctor" con los campos Nombre, Especialidad, Matrícula, Foto (opcional) y Días y horario de atención.
- [ ] **Crear un doctor con foto**: completar Nombre (ej. "Dra. Jane Powell"), Especialidad (ej. "Odontología General"), Matrícula (ej. "MP-12345"), subir una imagen en "Foto (opcional)", tildar al menos un día en "Días y horario de atención" (por defecto 09:00 a 18:00) y hacer clic en "Crear doctor". Se espera: el diálogo se cierra y el doctor aparece en el listado con su foto como avatar circular.
- [ ] **Crear un doctor sin foto**: repetir el alta pero sin subir ninguna imagen en "Foto (opcional)". Se espera: el doctor se crea igual, y en el listado aparece un avatar circular con las iniciales del nombre (por ejemplo "Dr. Juan Gómez" → "JG"; el prefijo "Dr."/"Dra." no cuenta para las iniciales) en vez de una imagen o un ícono roto.
- [ ] **Editar un doctor**: hacer clic en "Editar" sobre la fila de un doctor. Se espera: se abre un diálogo "Editar doctor" con los datos precargados. Cambiar algún dato (por ejemplo la Especialidad) y guardar con "Guardar cambios". Se espera: el listado refleja el cambio.
- [ ] **Desactivar un doctor**: hacer clic en "Desactivar" sobre la fila de un doctor activo. Se espera: el botón cambia a "Reactivar" y el nombre del doctor muestra la marca "(inactivo)" al lado.
- [ ] **Verificar revocación real de acceso**: si el doctor desactivado tiene un login creado (ver siguiente punto), cerrar sesión e intentar loguearse con ese email/contraseña. Se espera: el login es rechazado (mismo mensaje "Email o contraseña incorrectos." que una contraseña mal tipeada) — el doctor desactivado no puede entrar más al sistema.
- [ ] **Reactivar**: volver a loguearse como Administrador, ir a "Doctores" y hacer clic en "Reactivar" sobre ese doctor. Se espera: la marca "(inactivo)" desaparece y el login vuelve a funcionar.
- [ ] **Crear acceso de login para un doctor**: sobre la fila de un doctor sin acceso creado, hacer clic en "Crear acceso". Se espera: aparece un formulario con "Email de acceso" y "Contraseña". Completarlo y enviar con "Crear acceso". Se espera: el formulario se cierra sin error.
- [ ] **Evitar accesos duplicados**: repetir "Crear acceso" sobre el mismo doctor con otro email. Se espera: mensaje de error "Este doctor ya tiene un acceso creado. No se puede crear un segundo login."

### 2.4 Gestión de Secretarias (`/admin/secretarias`)

- [ ] Ir a "Secretarías" desde el menú. Se espera: listado de secretarias y un botón "Crear Secretaria" arriba a la derecha, que abre un diálogo con Nombre, Email de acceso y Contraseña.
- [ ] **Crear** una secretaria completando esos tres campos y enviando con "Crear acceso". Se espera: aparece en el listado.
- [ ] **Editar**: hacer clic en "Editar" sobre una secretaria, cambiar el Nombre o el Email, guardar con "Guardar cambios". Se espera: el listado refleja el cambio.
- [ ] **Desactivar**: hacer clic en "Desactivar". Se espera: el nombre muestra "(inactiva)" y el botón pasa a "Reactivar".
- [ ] **Verificar revocación real de acceso**: cerrar sesión e intentar loguearse con el email/contraseña de la secretaria desactivada. Se espera: rechazado, mismo mensaje genérico de credenciales incorrectas.
- [ ] **Reactivar**: volver como Administrador y reactivarla. Se espera: puede volver a loguearse.

### 2.5 Gestión de Administradores (`/admin/admins`)

- [ ] Ir a "Administradores" desde el menú. Se espera: listado de administradores (al menos el sembrado por `pnpm db:seed-admin`) y un botón "Crear Administrador" arriba a la derecha.
- [ ] **Crear** un segundo Administrador (Nombre, Email, Contraseña). Se espera: aparece en el listado.
- [ ] **Editar**: cambiar Nombre o Email de un administrador y guardar. Se espera: se refleja el cambio.
- [ ] **Desactivar** al Administrador recién creado (no al único que quede activo). Se espera: se desactiva sin problema, mismo patrón que Doctor/Secretaria.
- [ ] **Caso límite — último Administrador activo**: dejando un solo Administrador activo en el sistema, intentar desactivarlo. Se espera: la acción se **rechaza** con el mensaje "No se puede desactivar al último Administrador activo." y el administrador sigue activo.

### 2.6 Nomenclador (`/admin/treatments`)

- [ ] Ir a "Nomenclador" desde el menú. Se espera: listado de prestaciones (si corriste el seeder, ya hay al menos "Consulta Odontológica", "Obturación de Resina" y "Limpieza Dental", cada una con su precio y duración en minutos).
- [ ] Hacer clic en "Crear Prestación". Se espera: diálogo con los campos Nombre, Precio, Duración estimada (minutos) y Descripción (opcional).
- [ ] Completar una prestación nueva (ej. "Blanqueamiento", precio 15000, duración 60) y enviar con "Crear prestación". Se espera: aparece en el listado como "$15.000 · 60 min · [descripción]".
- [ ] **Editar**: hacer clic en "Editar" sobre una prestación, cambiar el precio o la duración, guardar con "Guardar cambios". Se espera: el listado refleja el nuevo valor.
- [ ] **Desactivar/Reactivar**: igual patrón que Doctor/Secretaria — "Desactivar" marca "(inactivo)" y cambia el botón a "Reactivar".

### 2.7 Pacientes

- [ ] Ir a "Pacientes" desde el menú (`/admin/pacientes`). Se espera: un buscador con campos "Nombre" y "DNI", botones "Buscar"/"Limpiar", y el listado completo de pacientes debajo.
- [ ] **Buscar por nombre**: escribir parte del nombre de un paciente existente y hacer clic en "Buscar". Se espera: el listado se filtra a los pacientes que coinciden (búsqueda parcial, no hace falta el nombre completo).
- [ ] **Buscar por DNI**: repetir la búsqueda usando el campo "DNI" con un número parcial. Se espera: mismo comportamiento, filtro parcial.
- [ ] **Limpiar**: hacer clic en "Limpiar". Se espera: vuelve a mostrar el listado completo sin filtros.
- [ ] **Alta desde `/admin/pacientes/nuevo`**: ir a "Nuevo paciente" desde el menú. Se espera: un formulario largo con secciones "Información Personal", "Información Médica" y "Documento de identidad".
  - [ ] Completar los campos obligatorios: Nombre completo, Correo electrónico, Número de teléfono, Fecha de nacimiento, Género, Dirección, Ocupación, Médico de cabecera (desplegable con los doctores activos), Tipo de identificación y Número de identificación.
  - [ ] Dejar sin completar los campos opcionales (Nombre/Teléfono de contacto de emergencia, Obra social, N° de afiliado, Copia escaneada del documento) y enviar con "Crear paciente". Se espera: mensaje de éxito "Paciente [nombre] creado con éxito." — no hace falta subir el documento escaneado para poder crear el paciente.
- [ ] **Alta inline desde el listado cuando la búsqueda no encuentra resultados**: en "Pacientes" (`/admin/pacientes`), buscar por un nombre o DNI que no exista. Se espera: mensaje "No se encontraron pacientes que coincidan con la búsqueda." junto a un botón "Crear paciente" que abre el mismo formulario de alta en un diálogo, con el nombre/DNI que ya habías tipeado precargado. Completar el resto de los datos obligatorios y confirmar. Se espera: el paciente se crea y el listado se actualiza.

### 2.8 Nuevo turno (`/admin/turnos/nuevo`)

- [ ] Ir a "Nuevo turno" desde el menú (o desde el botón "Nuevo turno" del Dashboard). Se espera: una pantalla con dos secciones plegables ("acordeones"): "Datos del paciente" y "Datos del doctor", ambas abiertas por defecto.
- [ ] **Buscar paciente por DNI**: en "Datos del paciente", escribir el DNI de un paciente existente y hacer clic en "Buscar". Se espera: la sección se colapsa sola mostrando el nombre del paciente encontrado al lado del título.
- [ ] **Crear paciente si no existe**: escribir un DNI que no exista y hacer clic en "Buscar". Se espera: mensaje "No se encontró ningún paciente con ese DNI." junto a un botón "Crear paciente" que abre el formulario de alta; al completarlo y confirmar, el paciente recién creado queda seleccionado automáticamente sin tener que volver a buscarlo.
- [ ] **Elegir doctor y prestación**: en "Datos del doctor", seleccionar un Doctor y una Prestación de los desplegables. Se espera: la sección se colapsa sola mostrando "[Doctor] · [Prestación]" al lado del título, y aparece un calendario semanal debajo.
- [ ] **Reservar un horario dentro de la disponibilidad del doctor**: en el calendario, hacer clic en una franja horaria que caiga dentro de los días/horarios configurados para ese doctor (fondo verde tenue). Se espera: el turno se confirma directo, sin ningún diálogo de advertencia, y aparece el mensaje "Turno agendado con éxito."
- [ ] **Intentar un horario fuera de la disponibilidad del doctor**: hacer clic en una franja fuera de sus días/horarios configurados (fondo con textura rayada). Se espera: aparece un diálogo "Horario fuera de disponibilidad" con el texto "Este horario no corresponde a la disponibilidad configurada del doctor. ¿Desea asignar el turno igualmente?" y los botones "Cancelar"/"Asignar igualmente". Confirmando con "Asignar igualmente", el turno se crea igual.
- [ ] **Intentar un horario ya ocupado**: hacer clic sobre un turno ya agendado en el calendario (aparece como un bloque con el nombre del paciente y la hora). Se espera: **no** se abre ningún formulario de reserva — aparece un aviso breve "Este horario ya está ocupado." que desaparece solo a los pocos segundos. (El bloqueo real ocurre del lado del servidor: si se intentara forzar la reserva en ese mismo horario, el sistema la rechazaría igual.)

### 2.9 Dashboard (`/admin`)

- [ ] Ir a "Dashboard" desde el menú. Se espera: cuatro tarjetas con contadores — "Turnos confirmados", "Turnos pendientes", "Turnos cancelados" y "Turnos finalizados" — y una tabla con los turnos recientes debajo.
- [ ] Crear un turno nuevo (sección 2.8) y volver al Dashboard. Se espera: el contador de "Turnos pendientes" aumentó en uno, y el turno nuevo aparece en la tabla con estado "Pendiente".
- [ ] En la tabla, hacer clic en "Confirmar" sobre un turno pendiente. Se espera: se abre un diálogo "Confirmar turno"; al enviarlo, el estado del turno pasa a "Confirmada" y el contador de "Turnos confirmados" sube.
- [ ] Hacer clic en "Cancelar" sobre un turno. Se espera: diálogo "Cancelar turno" con la pregunta "¿Estás seguro de que querés cancelar el turno?"; al confirmar, el estado pasa a "Cancelada" y el contador correspondiente sube.

---

## 3. Doctor

Todo lo que sigue se prueba logueado como Doctor (usá el email/contraseña creados con "Crear acceso" en la sección 2.3), dentro de `/doctor`.

### 3.1 Login / Logout y agenda propia

- [ ] Ir a `/login`, ingresar con las credenciales del Doctor. Se espera: redirección a `/doctor` con el título "Mis turnos".
- [ ] Verificar que la lista muestra únicamente los turnos asignados a este doctor (paciente, fecha/hora, motivo, estado y un link "Ver ficha" por turno).
- [ ] Abrir el menú de navegación. Se espera: un único link "Mi agenda" y el botón "Cerrar sesión".
- [ ] Cerrar sesión. Se espera: redirección a `/login`.

### 3.2 Ficha del paciente

- [ ] Desde "Mis turnos", hacer clic en "Ver ficha" sobre un turno. Se espera: se abre la ficha del paciente con las secciones "Antecedentes médicos" (Alergias, Medicación actual, Antecedentes familiares, Antecedentes personales — o "Sin registrar" si no se cargaron), "Odontograma", "Nueva evolución" e "Histórico de evoluciones".
- [ ] **Cargar una nota de evolución con prestaciones**: en "Nueva evolución", escribir un texto en "Nota de evolución", tildar una o más prestaciones en "Prestaciones realizadas" y enviar con "Guardar evolución". Se espera: la nota aparece en "Histórico de evoluciones" con la fecha, tu nombre, el texto cargado y la lista de prestaciones marcadas.
- [ ] Nota: la sección "Nueva evolución" solo aparece si entraste a la ficha desde "Ver ficha" en un turno concreto (la URL lleva un parámetro de turno) — si accedés a la ficha de otra forma, esa sección no se muestra.

### 3.3 Odontograma

- [ ] En la ficha de un paciente, ubicar la sección "Odontograma": dos filas de piezas dentales (arcada superior e inferior), cada una representada como un cuadrado con 5 zonas clicleables (una por cada cara del diente).
- [ ] Hacer clic varias veces sobre la misma cara de una pieza. Se espera: el color rota en este orden — blanco (sano) → rojo (Caries) → azul (Obturado) → gris oscuro (Ausente) → violeta (Endodoncia) → amarillo (Corona) → blanco de nuevo.
- [ ] Cargar el estado de varias piezas distintas (distintas caras, distintos colores) y hacer clic en "Guardar odontograma". Se espera: mientras guarda el botón dice "Guardando...", y al terminar los cambios persisten (si recargás la página, siguen ahí).
- [ ] **Caso con bug conocido, ver TASK-046**: abrir el odontograma de un paciente A, cargar algún estado, y sin guardar (o después de guardar) navegar al odontograma de un paciente B distinto. Se espera en teoría: el odontograma de B se muestra limpio, sin mezclar datos de A. **Estado real conocido**: hay un bug documentado (`TASK-046` en `docs/PLANNING.md`) donde el odontograma no siempre aísla correctamente el estado entre pacientes al cambiar de uno a otro — si ves colores de un paciente "pegados" en la ficha de otro, no es necesario reportarlo de nuevo, ya está anotado como pendiente de investigación.

---

## 4. Secretaria

Todo lo que sigue se prueba logueado como Secretaria (usá las credenciales creadas en la sección 2.4), dentro de `/recepcion`.

### 4.1 Login / Logout

- [ ] Ir a `/login`, ingresar con las credenciales de la Secretaria. Se espera: redirección a `/recepcion` con el título "Turnos para cobrar".
- [ ] Abrir el menú de navegación. Se espera: los links "Recepción", "Nuevo paciente", "Pacientes" y el botón "Cerrar sesión".
- [ ] Cerrar sesión. Se espera: redirección a `/login`.

### 4.2 Pacientes

- [ ] Ir a "Pacientes" (`/recepcion/pacientes`). Se espera: mismo buscador y listado que en `/admin/pacientes` (sección 2.7) — buscar por Nombre/DNI funciona igual.
- [ ] Ir a "Nuevo paciente" (`/recepcion/pacientes/nuevo`). Se espera: el mismo formulario de alta que en `/admin/pacientes/nuevo` (sección 2.7) — completarlo y confirmar la creación.

### 4.3 Cobro

Antes de probar esta sección necesitás al menos un turno confirmado. Si no tenés uno a mano, creá y confirmá uno desde el rol Administrador (secciones 2.8 y 2.9).

- [ ] **Cobro automático (turno con prestaciones ya cargadas por el doctor)**: pedile al Doctor que cargue una evolución con al menos una prestación tildada para un turno confirmado (sección 3.2). Volver a `/recepcion` como Secretaria. Se espera: el turno aparece en "Turnos para cobrar" mostrando el detalle de las prestaciones y el total, de solo lectura (no hay checkboxes para tildar).
  - [ ] Elegir un "Medio de pago" (Efectivo, Transferencia o Tarjeta) y hacer clic en "Cobrar y cerrar turno". Se espera: redirección a la pantalla del recibo (`/recepcion/recibo/[turno]`).
- [ ] **Cobro manual (turno sin evolución cargada)**: usar un turno confirmado al que el doctor no le cargó ninguna evolución. Se espera: en "Turnos para cobrar" aparece con el aviso "El doctor no cargó prestaciones para este turno — seleccioná las que corresponda cobrar:" y una lista de checkboxes con las prestaciones del nomenclador.
  - [ ] Sin tildar ninguna prestación, verificar que el botón "Cobrar y cerrar turno" está deshabilitado.
  - [ ] Tildar una o más prestaciones. Se espera: el "Total" se actualiza en vivo a medida que tildás/destildás.
  - [ ] Elegir un medio de pago y confirmar el cobro. Se espera: redirección al recibo, igual que el caso automático.
- [ ] **No se puede cobrar dos veces el mismo turno**: después de cobrar un turno, volver a `/recepcion`. Se espera: ese turno ya no aparece en la lista de "Turnos para cobrar" (no hay forma de volver a cobrarlo desde la pantalla).
- [ ] **Recibo imprimible**: en la pantalla del recibo, verificar que se muestra "Comprobante de Cobro" con Paciente, Profesional, Medio de pago, Registrado por, el detalle de prestaciones con sus montos y el "Total abonado". Hacer clic en "Imprimir / Descargar PDF" (arriba a la derecha). Se espera: se abre el diálogo de impresión del navegador con el recibo formateado (sin el logo ni el botón de imprimir, solo el comprobante).

---

## 5. Seguridad y aislamiento de roles

Estos casos se prueban alternando sesiones (logueate con un rol, probá, cerrá sesión, logueate con otro).

- [ ] **Doctor no puede entrar a `/admin`**: logueado como Doctor, escribir en la barra de direcciones `http://localhost:3000/admin` y presionar Enter. Se espera: redirección automática a una pantalla "Acceso no autorizado" con el mensaje "Tu usuario no tiene permiso para acceder a esta página." y un link "Volver a iniciar sesión".
- [ ] **Doctor no puede entrar a `/recepcion`**: mismo intento con `http://localhost:3000/recepcion`. Se espera: mismo resultado, "Acceso no autorizado".
- [ ] **Secretaria no puede entrar a `/admin`**: logueada como Secretaria, intentar `http://localhost:3000/admin`. Se espera: "Acceso no autorizado".
- [ ] **Secretaria no puede entrar a `/doctor`**: intentar `http://localhost:3000/doctor`. Se espera: "Acceso no autorizado".
- [ ] **Administrador no puede entrar a `/doctor`**: logueado como Administrador, intentar `http://localhost:3000/doctor`. Se espera: "Acceso no autorizado".
- [ ] **Administrador no puede entrar a `/recepcion`**: intentar `http://localhost:3000/recepcion`. Se espera: "Acceso no autorizado".
- [ ] **No existe acceso público para pacientes**: sin ninguna sesión iniciada (cerrar sesión o abrir una ventana de incógnito), intentar entrar a `http://localhost:3000/patients/login`. Se espera: una página de error 404 genuina del navegador/Next.js ("This page could not be found" o similar) — no una pantalla de login real. Es un chequeo intencional: ese flujo de acceso de pacientes fue eliminado del sistema, así que la ruta no debe existir en absoluto.
- [ ] Repetir el intento con cualquier otra ruta bajo `/patients/` que recuerdes de versiones anteriores (por ejemplo `/patients/algo/register`). Se espera: mismo resultado, error 404.

---

## Referencia rápida de credenciales sembradas

| Rol | Origen de las credenciales |
|---|---|
| Administrador (inicial) | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` en tu `.env.local`, cargadas por `pnpm db:seed-admin` |
| Doctor | Las que hayas definido al usar "Crear acceso" en `/admin/doctors` (sección 2.3) |
| Secretaria | Las que hayas definido al crear la secretaria en `/admin/secretarias` (sección 2.4) |

No hay credenciales de paciente — el rol Paciente no existe como acceso al sistema.
