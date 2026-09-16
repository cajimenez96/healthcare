# Especificación Técnica y Funcional: Sistema Clínico Odontológico (MVP)

> **Base de Código Reference:** [CarePulse (`adrianhajdin/healthcare`)](https://github.com/adrianhajdin/healthcare)  
> **Adaptación:** Sistema Integral de Gestión Dental y Médica

---

## 1. Descripción General del Sistema

El **Sistema de Gestión Odontológica y Médica** es una plataforma web orientada al control operativo, clínico y financiero de la atención de salud. El onboarding de pacientes y la reserva de turnos son enteramente mediados por el staff: el paciente no tiene acceso propio al sistema (sin login, sin auto-registro, sin auto-gestión de turnos). El sistema otorga herramientas específicas a Secretaría/Administrador para el alta de pacientes y la agenda, y a Doctores para la atención clínica (odontograma e historial) y el cobro diferencial de prestaciones según **Obras Sociales y Prepagas**.

---

## 2. Definición de Roles y Matriz de Acciones

El sistema contempla **3 roles con acceso propio** (Secretaría, Doctor, Administrador). El **Paciente** es una entidad gestionada por el sistema (ficha clínica, turnos), pero no tiene ningún acceso a la plataforma: no existe login de paciente ni auto-registro — todo su onboarding y la reserva de turnos son mediados por Secretaría/Administrador.

| Rol               | Responsabilidades Principales                                                       | Acciones en la Interfaz                                                                                                                                                                              |
| :---------------- | :------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Paciente**      | Ninguna — entidad administrada por el sistema, sin acceso propio.                      | — No inicia sesión ni interactúa con la plataforma. Su ficha y sus turnos son creados y gestionados enteramente por Secretaría/Administrador.                                                        |
| **Secretaría**    | Control de admisión, agenda global y cobro.                                          | • Alta de pacientes (ficha completa) y validación de sus datos.<br>• Alta, confirmación, reagenda y cancelación de turnos.<br>• Calcular y cobrar copagos/aranceles en recepción.                    |
| **Doctor**        | Atención clínica y registro de prestaciones.                                          | • Consulta de agenda diaria personal.<br>• Edición del Odontograma interactivo.<br>• Carga de anamnesis, evoluciones y prestaciones.                                                                 |
| **Administrador** | Parametrización del sistema y finanzas.                                              | • Configurar permisos por rol (RBAC dinámico).<br>• Gestor de Obras Sociales, Planes y Copagos.<br>• Alta de personal médico y asignación de horarios; alta de pacientes.<br>• Reportes de facturación y liquidaciones. |

---

## 3. Flujos de Negocio Principales (End-to-End)

[SECRETARÍA] [DOCTOR]
│ │
├── 1. Da de alta al paciente │
│ y crea el turno │
│ (Estado: Pendiente) │
├── 2. Confirma Turno │
│ y Valida Obra Social │
│ ├── 3. Atiende Consulta,
│ │ Actualiza Odontograma
│ │ y Carga Prestaciones
│◄── 4. Cita Atendida ─────┤
│ │
├── 5. Calcula Copago y │
│ Cobra en Recepción │
▼ ▼

### Flujo 1: Alta de Paciente y Turno (mediado por Secretaría/Administrador)

1. La **Secretaría** (o el **Administrador**) da de alta la ficha del paciente desde `/recepcion/pacientes/nuevo` (o `/admin/pacientes/nuevo`) y agenda el turno seleccionando médico y fecha/hora disponible — el paciente nunca accede a la web ni elige nada por sí mismo.
2. El sistema genera la cita en estado `Pendiente`.
3. La **Secretaría** valida la Obra Social/Plan asignado al paciente (por defecto, "Particular / Sin Convenio") y confirma el turno desde el listado.
4. A diferencia del flujo público que existió brevemente (ver §4, fila "Portal del Paciente"), el paciente no recibe notificación automática de confirmación: el envío de SMS de confirmación/cancelación es un gap conocido y aceptado por decisión de producto para pacientes de alta staff-side (ver TASK-028 en `docs/PLANNING.md`), no una tarea pendiente.

### Flujo 2: Atención Médica y Odontograma

1. El **Doctor** abre la cita desde su agenda e ingresa al perfil clínico del paciente.
2. Registra la anamnesis y actualiza los hallazgos/tratamientos en el **Odontograma Interactivo**.
3. Carga las prestaciones realizadas en la sesión (ej. _Obturación de resina - Pieza 16_) y guarda la **Evolución**.
4. La cita cambia automáticamente al estado `Atendida`.

### Flujo 3: Cierre Financiero y Cobro

1. La **Secretaría** selecciona la cita finalizada en su módulo de cobros.
2. El sistema procesa la matriz de coberturas configurada y calcula:
   - **Monto Cubierto:** Valor a liquidar a la Obra Social / Prepaga.
   - **Copago Paciente:** Saldo a cobrar en efectivo/transferencia al paciente en mano.
3. Se registra el pago y la cita concluye en estado `Finalizada`.

---

## 4. Análisis de Brechas (Gap Analysis vs. Repo `healthcare`)

Comparativa entre lo existente en el repositorio base **CarePulse (`adrianhajdin/healthcare`)** y lo que se debe construir para completar el MVP:

| Módulo / Funcionalidad        | Estado en `healthcare`        | Faltante Requerido para MVP                                                          | Esfuerzo   |
| :---------------------------- | :---------------------------- | :----------------------------------------------------------------------------------- | :--------- |
| **Portal del Paciente**       | ❌ **Eliminado (TASK-023/024)** | El paciente no tiene portal propio: alta de ficha y reserva de turno están completamente mediadas por Secretaría/Administrador (`CreatePatientForm`), con selección opcional de Obra Social/Plan y N° de Afiliado. | —          |
| **Reserva de Turnos**         | ✅ **Implementado**           | Incluir estados de cita adicionales: `En Espera`, `Atendido` y `Finalizado`.         | Bajo       |
| **Notificaciones (SMS)**      | ✅ **Implementado**           | Adaptar plantillas de Twilio para incluir detalles del copago estimado.              | Muy Bajo   |
| **Autenticación & Admin**     | ⚠️ **Parcial** (PIN estático) | Implementar sistema multi-usuario con login real (NextAuth / JWT).                   | Medio      |
| **Directorio de Médicos**     | ✅ **Resuelto (TASK-006)** (gestión dinámica) | Falta UI de filtrado por especialidad/estado en el listado de `/admin/doctors`.      | Bajo       |
| **Permisos Dinámicos (RBAC)** | ❌ **No existe**              | Crear tabla de permisos y panel de configuración gráfica para el Admin.              | Medio-Alto |
| **Odontograma Digital**       | ❌ **No existe**              | Integrar el componente visual de React (migrado de `odonto`) con persistencia.       | Alto       |
| **Obras Sociales & Copagos**  | ❌ **No existe**              | Crear entidades `ObrasSociales`, `Planes`, `Coberturas` y la calculadora de copagos. | Alto       |
| **Historial de Evoluciones**  | ❌ **No existe**              | Crear la vista clínica de lectura/escritura de notas exclusiva para el Doctor.       | Medio      |

---

## 5. Arquitectura de Datos Sugerida (Extensiones de Colecciones/Tablas)

Para completar los requerimientos del MVP sobre la base de datos de CarePulse, se deben crear o extender las siguientes entidades:
[Usuarios / Roles]
├── id
├── email / password
└── rol_id ──────────────► [Roles & Permisos]
├── rol_nombre (Admin, Secretaria, Doctor, Paciente)
└── permisos_json

[Pacientes]
├── id_usuario
├── datos_personales
├── plan_id ──────────────► [Planes] ◄───────── [Obras Sociales]
└── numero_afiliado │ ├── id
│ └── nombre
▼
[Citas / Turnos] [Coberturas / Aranceles]
├── id_paciente ├── plan_id
├── id_doctor ├── tratamiento_id ─► [Tratamientos / Nomenclador]
├── fecha_hora ├── monto_cubierto
└── estado └── copago_paciente

[Historial Clinico]
├── cita_id
├── notas_evolucion
└── odontograma_json (Estado de piezas dentales)

