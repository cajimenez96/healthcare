# Especificación Técnica y Funcional: Sistema Clínico Odontológico (MVP)

> **Base de Código Reference:** [CarePulse (`adrianhajdin/healthcare`)](https://github.com/adrianhajdin/healthcare)  
> **Adaptación:** Sistema Integral de Gestión Dental y Médica

---

## 1. Descripción General del Sistema

El **Sistema de Gestión Odontológica y Médica** es una plataforma web orientada al control operativo, clínico y financiero de la atención de salud. Permite descentralizar la carga administrativa mediante la auto-gestión del paciente para la solicitud de citas, mientras otorga herramientas específicas a Secretarias y Doctores para la admisión, atención clínica (odontograma e historial) y cobro diferencial de prestaciones según **Obras Sociales y Prepagas**.

---

## 2. Definición de Roles y Matriz de Acciones

El sistema contempla **4 roles principales** con accesos y permisos diferenciados:

| Rol               | Responsabilidades Principales                 | Acciones en la Interfaz                                                                                                                                                                              |
| :---------------- | :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Paciente**      | Auto-gestión de citas e información personal. | • Auto-registro y onboarding médico.<br>• Búsqueda de profesionales por especialidad.<br>• Solicitud, consulta y cancelación de turnos.                                                              |
| **Secretaría**    | Control de admisión, agenda global y cobro.   | • Validar/completar datos de pacientes.<br>• Aprobar, reagendar y confirmar turnos.<br>• Calcular y cobrar copagos/aranceles en recepción.                                                           |
| **Doctor**        | Atención clínica y registro de prestaciones.  | • Consulta de agenda diaria personal.<br>• Edición del Odontograma interactivo.<br>• Carga de anamnesis, evoluciones y prestaciones.                                                                 |
| **Administrador** | Parametrización del sistema y finanzas.       | • Configurar permisos por rol (RBAC dinámico).<br>• Gestor de Obras Sociales, Planes y Copagos.<br>• Alta de personal médico y asignación de horarios.<br>• Reportes de facturación y liquidaciones. |

---

## 3. Flujos de Negocio Principales (End-to-End)

[PACIENTE] [SECRETARÍA] [DOCTOR]
│ │ │
├── 1. Solicita Turno ──────►│ │
│ (Estado: Pendiente) ├── 2. Confirma Turno │
│ │ y Valida Prepaga │
│ │ ├── 3. Atiende Consulta,
│ │ │ Actualiza Odontograma
│ │ │ y Carga Prestaciones
│ │◄── 4. Cita Atendida ─────┤
│ │ │
│ ├── 5. Calcula Copago y │
│ │ Cobra en Recepción │
▼ ▼ ▼

### Flujo 1: Solicitud de Cita y Admisión

1. El **Paciente** accede a la web, busca un médico por especialidad y selecciona fecha/hora disponible.
2. El sistema genera la cita en estado `Pendiente`.
3. La **Secretaría** recibe la notificación en su panel, valida la Obra Social/Plan asignado al paciente y presiona `Confirmar`.
4. El paciente recibe una notificación automática de confirmación (SMS/Email).

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
| **Portal del Paciente**       | ✅ **Implementado**           | Agregar campos para selección de Obra Social, Plan y N° de Afiliado.                 | Bajo       |
| **Reserva de Turnos**         | ✅ **Implementado**           | Incluir estados de cita adicionales: `En Espera`, `Atendido` y `Finalizado`.         | Bajo       |
| **Notificaciones (SMS)**      | ✅ **Implementado**           | Adaptar plantillas de Twilio para incluir detalles del copago estimado.              | Muy Bajo   |
| **Autenticación & Admin**     | ⚠️ **Parcial** (PIN estático) | Implementar sistema multi-usuario con login real (NextAuth / JWT).                   | Medio      |
| **Directorio de Médicos**     | ⚠️ **Parcial** (Hardcoded)    | Migrar la lista estática a colecciones/tablas dinámicas con filtros.                 | Medio      |
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

