# Especificación Técnica: Módulo de Obras Sociales, Coberturas y Tarifa Particular

## 1. Visión General del Módulo

Este documento define la arquitectura financiera y la lógica de negocio para la gestión de aranceles, cobros y coberturas en el sistema médico/odontológico.

La estrategia adoptada para el **MVP** consiste en un **Motor de Reglas Unificado** donde la opción por defecto es la tarifa **Particular** (100% cobro al paciente), dejando las bases de datos preparadas para habilitar convenios con **Obras Sociales y Prepagas** en etapas posteriores sin requerir refactorizaciones estructurales.

---

## 2. Estrategia del MVP (Enfoque "Particular First")

1. **Configuración por Defecto**:
   * En la base de datos existe un registro pre-cargado: `ObraSocial: "Particular / Sin Convenio"` con un `Plan: "Estándar"`.
   * Todo paciente o consulta nueva que no especifique obra social es asignada automáticamente al plan **Particular**.

2. **Cálculo de Cobertura para el MVP**:
   * `Monto Cubierto por Obra Social` = **$0**
   * `Copago / Saldo Paciente` = **100% del Arancel de la Prestación**

3. **Escalabilidad Futura (Post-MVP)**:
   * Para activar convenios con OSDE, Swiss Medical, etc., únicamente se agregan registros en la tabla/colección de `ObrasSociales` y se configuran sus porcentajes/montos de cobertura en la `MatrizCoberturas`.

---

## 3. Modelo de Datos y Entidades

### 3.1. Entidades Principales

```text
[ObraSocial]
 ├── _id: ObjectId
 ├── nombre: String ("Particular / Sin Convenio", "OSDE", "Swiss Medical")
 ├── cuit: String (Opcional)
 └── activa: Boolean

[PlanObraSocial]
 ├── _id: ObjectId
 ├── obraSocialId: ObjectId (Ref: ObraSocial)
 ├── nombrePlan: String ("Estándar", "210", "310", "SMG20")
 └── descripcion: String

[Prestaciones / Nomenclador]
 ├── _id: ObjectId
 ├── codigo: String ("01.01", "02.08")
 ├── nombre: String ("Consulta Odontológica", "Obturación Resina")
 ├── categoria: String ("Diagnóstico", "Operatoria", "Cirugía")
 └── arancelParticularBase: Number (Monto nominal en moneda local)

[MatrizCoberturas]
 ├── _id: ObjectId
 ├── planId: ObjectId (Ref: PlanObraSocial)
 ├── prestacionId: ObjectId (Ref: Prestaciones)
 ├── montoCubiertoOS: Number (Monto que paga la prepaga)
 ├── copagoPaciente: Number (Monto que abona el paciente en recepción)
 └── vigenciaHasta: Date

[ComprobanteCobro / CierreCita]
 ├── _id: ObjectId
 ├── citaId: ObjectId (Ref: Appointment)
 ├── pacienteId: ObjectId (Ref: Patient)
 ├── doctorId: ObjectId (Ref: Doctor)
 ├── planId: ObjectId (Ref: PlanObraSocial)
 ├── desgloseItems: [
 │     {
 │       prestacionId: ObjectId,
 │       montoBase: Number,
 │       montoCubiertoOS: Number,
 │       copagoPaciente: Number
 │     }
 │   ]
 ├── totalCobradoPaciente: Number
 ├── totalFacturarOS: Number
 ├── medioPago: String ("Efectivo", "Transferencia", "Tarjeta")
 └── fechaPago: Date
```

---

## 4. Flujo Operativo y de Negocio

```text
[ALTA DE PACIENTE / SECRETARÍA-ADMINISTRADOR]
  │
  ├─ Secretaría o Administrador carga Obra Social y Plan (Opcional — Default: "Particular / Sin Convenio" si se omite)
  └─ Carga N° de Afiliado (Si aplica)
        │
        ▼
[ATENCIÓN MÉDICA / DOCTOR]
  │
  ├─ Registra Anamnesis y Odontograma
  └─ Selecciona las Prestaciones realizadas (Ej: 1x Consulta + 1x Obturación)
        │
        ▼
[RECEPCIÓN / SECRETARÍA - MÓDULO DE COBRO]
  │
  ├─ El sistema consulta `MatrizCoberturas` según (Plan, Prestaciones)
  ├─ Caso Particular:
  │   ├─ Monto OS = $0
  │   └─ Total Paciente = Suma de Aranceles Particulares Base
  ├─ La Secretaría registra el pago (Efectivo/Digital)
  └─ Se emite comprobante/recibo para el paciente (Apto reintegro)
```

---

## 5. Fases de Implementación Técnica

### Fase 1: MVP (Configuración Inicial)
* Carga del script inicial (Seeder) con la entidad `Particular` y el Nomenclador de Prestaciones base.
* Interfaz de cobro en recepción que liquida el 100% de las prestaciones al paciente.
* Emisión de recibo digital de atención médica/odontológica.

### Fase 2: Expansión Multi-Cohertera (Post-MVP)
* Panel de administración para cargar nuevas Obras Sociales y Planes.
* Editor visual de la `MatrizCoberturas` por arancel fijo o porcentaje.
* Módulo de reporte de facturación agrupado por Obra Social para presentación de liquidaciones mensuales.
