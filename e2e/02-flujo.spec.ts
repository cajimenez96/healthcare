import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS, SECRETARIA_CREDENTIALS } from "./credentials";
import { loginAs, uniqueSuffix } from "./helpers";
import { createPatientUser, registerFullPatient, requestAppointment } from "./patient-flow";
import { readState, writeState } from "./state";

test.describe.configure({ mode: "serial" });

// NOTE: test files are all statically loaded before any test runs, so this
// cannot be read at module scope (00-setup.spec.ts wouldn't have run yet).
// It's populated in beforeAll, which runs at actual execution time - after
// 00-setup.spec.ts's tests (an earlier file, same worker) have completed.
let DOCTOR_NAME: string;
let DOCTOR_EMAIL: string;
let DOCTOR_PASSWORD: string;

test.beforeAll(() => {
  const state = readState();
  if (!state.doctor) {
    throw new Error(
      "BLOQUEADO: no se encontro el Doctor creado por 00-setup.spec.ts. Corre ese spec primero.",
    );
  }
  DOCTOR_NAME = state.doctor.name;
  DOCTOR_EMAIL = state.doctor.email;
  DOCTOR_PASSWORD = state.doctor.password;
});

const RUN = uniqueSuffix();
const PATIENT_NAME = `Paciente QA ${RUN}`;
const PATIENT_EMAIL = `qa.patient.${RUN}@test.local`;
const PATIENT_PHONE = "+5491133334444";
const PATIENT_DNI = `30${RUN}`;
const PATIENT_PIN = "1234";

// Our doctor's availability covers every weekday 08:00-20:00 (see
// 00-setup), so any future date/time works - but the doctor (and its
// booked slots) persists in the real DB across re-runs of this spec against
// an already-running dev server, so pick the day from the current run
// instant instead of a fixed constant to avoid colliding with a
// still-scheduled appointment left over from a previous run.
const DAY_OF_MONTH = String(2 + (Math.floor(Date.now() / 1000) % 20));
const DOC06_DAY_OF_MONTH = String(2 + ((Math.floor(Date.now() / 1000) + 1) % 20));
const TIME_LABEL = "10:00 AM";

let patientUserId: string;
let appointmentId: string;

test.describe("FLU-01 - alta de paciente hasta turno pending", () => {
  test("PAC-01 - alta inicial de paciente", async ({ page }) => {
    const { userId } = await createPatientUser(page, {
      name: PATIENT_NAME,
      email: PATIENT_EMAIL,
      phone: PATIENT_PHONE,
      identificationNumber: PATIENT_DNI,
      pin: PATIENT_PIN,
    });
    patientUserId = userId;
    expect(patientUserId).toMatch(/^[a-f0-9]{24}$/);
  });

  test("PAC-03 - registro completo con obra social y documento de identificacion", async ({ page }) => {
    const { fileId } = await registerFullPatient(page, {
      userId: patientUserId,
      identificationNumber: PATIENT_DNI,
      pin: PATIENT_PIN,
      doctorName: DOCTOR_NAME,
      insuranceProviderName: "Particular / Sin Convenio",
      uploadIdentification: true,
    });

    expect(fileId, "SEG-02 necesita un fileId de un documento subido").toBeTruthy();

    writeState({
      patient: {
        userId: patientUserId,
        name: PATIENT_NAME,
        email: PATIENT_EMAIL,
        phone: PATIENT_PHONE,
      },
      identificationFileId: fileId,
    });
  });

  test("PAC-07 - solicitud de turno queda pending", async ({ page }) => {
    await requestAppointment(page, {
      userId: patientUserId,
      identificationNumber: PATIENT_DNI,
      pin: PATIENT_PIN,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DAY_OF_MONTH,
      timeLabel: TIME_LABEL,
      reason: "Dolor de muela persistente",
    });

    await expect(page).toHaveURL(/\/new-appointment\/success\?appointmentId=/);
    const match = page.url().match(/appointmentId=([a-f0-9]{24})/);
    appointmentId = match![1];
    expect(appointmentId).toMatch(/^[a-f0-9]{24}$/);

    writeState({
      appointment: {
        appointmentId,
        scheduleIso: "",
        dayOfMonth: DAY_OF_MONTH,
        timeLabel: TIME_LABEL,
      },
    });
  });

  test("Criterio de aceptacion FLU-01 - el turno pending es visible para el Administrador", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin");

    const row = page.locator("tr", { hasText: PATIENT_NAME });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pendiente", { exact: true })).toBeVisible();
  });
});

test.describe("FLU-02 - confirmacion y atencion clinica", () => {
  test("ADM-08 - Administrador confirma el turno pending -> scheduled", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin");

    const row = page.locator("tr", { hasText: PATIENT_NAME });
    await row.getByRole("button", { name: "Confirmar", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Confirmar turno" }).click();

    await expect(dialog).toBeHidden();
    await page.reload();
    const refreshedRow = page.locator("tr", { hasText: PATIENT_NAME });
    await expect(refreshedRow.getByText("Confirmada", { exact: true })).toBeVisible();
  });

  test("DOC-03 - Doctor entra a la ficha del paciente desde su agenda", async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    await page.goto("/doctor");

    const row = page.locator("li", { hasText: PATIENT_NAME });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Ver ficha" }).click();

    await expect(page).toHaveURL(/\/doctor\/patient\/[a-f0-9]{24}\?appointmentId=/);
    await expect(page.getByText("Antecedentes médicos")).toBeVisible();
    await expect(page.getByText("Alergias:")).toBeVisible();
    await expect(page.getByText("Odontograma", { exact: true })).toBeVisible();
    await expect(page.getByText("Nueva evolución", { exact: true })).toBeVisible();
  });

  test("DOC-04 - odontograma inicial genera 32 piezas sin condicion", async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    await page.goto("/doctor");
    await page.locator("li", { hasText: PATIENT_NAME }).getByRole("link", { name: "Ver ficha" }).click();

    const toothButtons = page.locator('button[title^="11 · "], button[title^="48 · "]');
    await expect(toothButtons.first()).toBeVisible();

    // 32 teeth * 5 faces = 160 clickable face buttons, each titled "<FDI> · <face>".
    const allFaceButtons = page.locator('button[title*=" · "]');
    await expect(allFaceButtons).toHaveCount(160);

    // None marked yet -> all white.
    const markedButtons = page.locator(
      'button[class*="bg-red-500"], button[class*="bg-blue-500"], button[class*="bg-slate-700"], button[class*="bg-purple-500"], button[class*="bg-yellow-500"]',
    );
    await expect(markedButtons).toHaveCount(0);
  });

  test("DOC-05 - el ciclo de 6 estados por cara es exacto y persiste", async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    await page.goto("/doctor");
    await page.locator("li", { hasText: PATIENT_NAME }).getByRole("link", { name: "Ver ficha" }).click();

    const face = page.locator('button[title^="11 · vestibular"]');
    await expect(face).toBeVisible();

    const cycle = [
      { click: 1, class: /bg-red-500/, name: "Caries" },
      { click: 2, class: /bg-blue-500/, name: "Obturado" },
      { click: 3, class: /bg-slate-700/, name: "Ausente" },
      { click: 4, class: /bg-purple-500/, name: "Endodoncia" },
      { click: 5, class: /bg-yellow-500/, name: "Corona" },
      { click: 6, class: /bg-white/, name: "sin marcar" },
    ];

    for (const step of cycle) {
      await face.click();
      await expect(face, `paso ${step.click} del ciclo debe ser ${step.name}`).toHaveClass(step.class);
    }

    // Leave it on "Caries" (1 click) before saving, so we can assert persistence.
    await face.click();
    await expect(face).toHaveClass(/bg-red-500/);

    await page.getByRole("button", { name: "Guardar odontograma" }).click();
    await expect(page.getByRole("button", { name: "Guardando..." })).toHaveCount(0);

    await page.reload();
    const faceAfterReload = page.locator('button[title^="11 · vestibular"]');
    await expect(faceAfterReload).toHaveClass(/bg-red-500/);
  });

  test("DOC-06 - aislamiento del odontograma entre pacientes", async ({ page }) => {
    // Second throwaway patient, booked (pending, no admin confirmation
    // needed - the doctor's own agenda lists appointments regardless of
    // status) purely to exercise cross-patient isolation.
    const run2 = uniqueSuffix();
    const patient2Name = `Paciente QA DOC06 ${run2}`;
    const patient2Dni = `31${run2}`;
    const { userId: userId2 } = await createPatientUser(page, {
      name: patient2Name,
      email: `qa.patient.doc06.${run2}@test.local`,
      phone: "+5491144445555",
      identificationNumber: patient2Dni,
    });
    await registerFullPatient(page, {
      userId: userId2,
      identificationNumber: patient2Dni,
      doctorName: DOCTOR_NAME,
      insuranceProviderName: "Particular / Sin Convenio",
    });
    await requestAppointment(page, {
      userId: userId2,
      identificationNumber: patient2Dni,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DOC06_DAY_OF_MONTH,
      timeLabel: "11:00 AM",
      reason: "Control de rutina",
    });
    // Without this, the subsequent loginAs()'s page.goto("/login") can abort
    // the still-in-flight createAppointment submission - requestAppointment
    // clicks submit but doesn't wait for its own success redirect, matching
    // PAC-07/ADM-09's convention of asserting at the call site.
    await expect(page).toHaveURL(/\/new-appointment\/success\?appointmentId=/);

    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    await page.goto("/doctor");
    await page.locator("li", { hasText: patient2Name }).getByRole("link", { name: "Ver ficha" }).click();

    const patient2Face = page.locator('button[title^="21 · oclusal"]');
    await patient2Face.click(); // -> Caries
    await patient2Face.click(); // -> Obturado
    await expect(patient2Face).toHaveClass(/bg-blue-500/);
    await page.getByRole("button", { name: "Guardar odontograma" }).click();

    // Patient 1's tooth 11/vestibular must still be Caries (untouched), and
    // patient 1's tooth 21/oclusal must still be unmarked (never touched).
    await page.goto("/doctor");
    await page.locator("li", { hasText: PATIENT_NAME }).getByRole("link", { name: "Ver ficha" }).click();
    await expect(page.locator('button[title^="11 · vestibular"]')).toHaveClass(/bg-red-500/);
    await expect(page.locator('button[title^="21 · oclusal"]')).toHaveClass(/bg-white/);

    // And patient 2 must not have inherited patient 1's Caries mark either.
    await page.goto("/doctor");
    await page.locator("li", { hasText: patient2Name }).getByRole("link", { name: "Ver ficha" }).click();
    await expect(page.locator('button[title^="11 · vestibular"]')).toHaveClass(/bg-white/);
    await expect(page.locator('button[title^="21 · oclusal"]')).toHaveClass(/bg-blue-500/);
  });

  test("DOC-09 - evolucion con prestaciones tildadas (Consulta + Obturacion = $20.000)", async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    await page.goto("/doctor");
    await page.locator("li", { hasText: PATIENT_NAME }).getByRole("link", { name: "Ver ficha" }).click();

    await page.getByLabel("Nota de evolución").fill(
      "Consulta de control, se realiza obturación en pieza 11.",
    );
    await page
      .locator("label", { hasText: "Consulta Odontológica" })
      .locator('input[type="checkbox"]')
      .click();
    await page
      .locator("label", { hasText: "Obturación de Resina" })
      .locator('input[type="checkbox"]')
      .click();

    await page.getByRole("button", { name: "Guardar evolución" }).click();

    await expect(
      page.getByText("Prestaciones: Consulta Odontológica, Obturación de Resina"),
    ).toBeVisible();
  });

  test("Criterio de aceptacion FLU-02 - el turno aparece en la cola de cobro con el total correcto", async ({ page }) => {
    await loginAs(page, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);
    await page.goto("/recepcion");

    const card = page.locator("div", { hasText: PATIENT_NAME }).filter({ hasText: "Total" });
    await expect(card.first()).toBeVisible();
    await expect(card.first().getByText("$20.000")).toBeVisible();
  });
});

test.describe("FLU-03 - cobro y cierre del ciclo", () => {
  test("SEC-01 - la cola de cobro lista el turno con prestaciones cargadas", async ({ page }) => {
    await loginAs(page, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);
    await page.goto("/recepcion");
    await expect(page.locator("div", { hasText: PATIENT_NAME }).first()).toBeVisible();
  });

  test("SEC-03 / SEC-04 / SEC-05 - cobro exitoso, total exacto y doble cobro falla", async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    await loginAs(page1, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);
    await page1.goto("/recepcion");

    // Second, stale tab opened on the billing queue BEFORE charging, kept
    // around to reproduce SEC-05's "double submit" scenario afterwards.
    const page2 = await context.newPage();
    await page2.goto("/recepcion");

    const card1 = page1.locator("div", { hasText: PATIENT_NAME }).filter({ hasText: "Total" }).first();
    await expect(card1.getByText("$20.000")).toBeVisible(); // SEC-04

    await card1.getByRole("combobox", { name: "Medio de pago" }).click();
    await page1.getByRole("option", { name: "Efectivo" }).click();
    await card1.getByRole("button", { name: "Cobrar y cerrar turno" }).click();

    await expect(page1).toHaveURL(/\/recepcion\/recibo\/[a-f0-9]{24}$/);
    const reciboUrl = page1.url();

    await expect(page1.getByText("Comprobante de Cobro")).toBeVisible();
    await expect(page1.getByText(PATIENT_NAME)).toBeVisible();
    await expect(page1.getByText(DOCTOR_NAME)).toBeVisible();
    await expect(page1.getByText("Efectivo")).toBeVisible();
    await expect(page1.getByText("QA Secretaria")).toBeVisible();
    await expect(page1.getByText("Total abonado")).toBeVisible();
    await expect(page1.locator("p", { hasText: "Total abonado" })).toContainText("$20.000");

    // The appointment must have dropped out of the billing queue.
    await page1.goto("/recepcion");
    await expect(page1.locator("div", { hasText: PATIENT_NAME })).toHaveCount(0);

    // SEC-05: page2 still holds the pre-charge BillingForm for this same
    // appointment in memory. Submitting it now must fail with the exact
    // literal error, since Payment.appointmentId has a unique index.
    // bringToFront() guards against Chromium's background-tab
    // discard/throttling silently reloading page2 while page1 was busy.
    await page2.bringToFront();
    const card2 = page2.locator("div", { hasText: PATIENT_NAME }).filter({ hasText: "Total" }).first();
    await card2.getByRole("combobox", { name: "Medio de pago" }).click();
    await page2.getByRole("option", { name: "Efectivo" }).click();
    await card2.getByRole("button", { name: "Cobrar y cerrar turno" }).click();

    await expect(page2.getByText("No se pudo registrar el cobro. Intentá de nuevo.")).toBeVisible();
    await expect(page2).toHaveURL(/\/recepcion$/);

    // SEC-07 (bonus, cheap once we're here): the receipt is still viewable
    // and unchanged, not duplicated.
    await page1.goto(reciboUrl);
    await expect(page1.locator("p", { hasText: "Total abonado" })).toContainText("$20.000");

    await context.close();
  });
});
