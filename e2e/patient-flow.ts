import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { ADMIN_CREDENTIALS, SECRETARIA_CREDENTIALS } from "./credentials";
import { getPatientIdentificationFileIdByEmail } from "./db";
import { loginAs, pickAppointmentDateTime } from "./helpers";

const ID_DOCUMENT_PATH = "public/assets/icons/user.svg";

// TASK-023/024: patient onboarding is 100% staff-mediated now — there is no
// more public self-registration/login flow to drive through Playwright.
// This replaces the old createPatientUser + registerFullPatient two-step
// dance with a single staff-side submission of CreatePatientForm, via
// /recepcion/pacientes/nuevo (the primary flow — Secretaria).
export async function createStaffPatient(
  page: Page,
  input: {
    name: string;
    email: string;
    phone: string;
    doctorName: string;
    insuranceProviderName?: string;
    identificationNumber?: string;
  },
) {
  await loginAs(page, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);
  await page.goto("/recepcion/pacientes/nuevo");

  await page.getByLabel("Nombre completo", { exact: true }).fill(input.name);
  await page.getByLabel("Correo electrónico", { exact: true }).fill(input.email);
  const phoneInput = page.locator(".input-phone input").first();
  await phoneInput.click();
  await phoneInput.fill(input.phone);

  // Plain date picker (no time), type + Enter commits it — same widget as
  // the old RegisterForm used for birthDate.
  const birthDateInput = page.locator(".date-picker input").first();
  await birthDateInput.click();
  await birthDateInput.fill("01/15/1990");
  await birthDateInput.press("Enter");

  await page.getByLabel("Masculino", { exact: true }).click();

  await page.getByLabel("Dirección", { exact: true }).fill("Av. Siempre Viva 742");
  await page.getByLabel("Ocupación", { exact: true }).fill("QA Automation");

  await page.getByRole("combobox", { name: "Médico de cabecera" }).click();
  await page.getByRole("option", { name: input.doctorName }).click();

  if (input.insuranceProviderName) {
    await page.getByRole("combobox", { name: "Obra social" }).click();
    await page.getByRole("option", { name: input.insuranceProviderName }).click();
  }

  await page.getByRole("combobox", { name: "Tipo de identificación" }).click();
  await page.getByRole("option", { name: "Documento Nacional de Identidad (DNI)" }).click();
  await page
    .getByLabel("Número de identificación", { exact: true })
    .fill(input.identificationNumber ?? `30${Date.now()}${Math.floor(Math.random() * 1000)}`);
  // Required on this form (unlike the old public flow) — there's no patient
  // present later to come back and add it.
  await page.locator("input[type=file]").setInputFiles(ID_DOCUMENT_PATH);

  await page.getByRole("button", { name: "Crear paciente" }).click();

  await expect(page.getByText(`Paciente ${input.name} creado con éxito.`)).toBeVisible();

  const fileId = await getPatientIdentificationFileIdByEmail(input.email);

  return { email: input.email, fileId };
}

// TASK-023/024: appointment requests are staff-side too now (there's no
// patient session to request one for themselves) — reuses the Admin's
// "Nuevo turno" flow from TASK-018 (AdminNewAppointmentModal), searching
// for the patient just created by exact email.
export async function bookAppointmentAsAdmin(
  page: Page,
  opts: {
    patientEmail: string;
    doctorName: string;
    dayOfMonth: string;
    timeLabel: string;
    reason: string;
    // false lets a caller fill (and commit into react-hook-form state) a
    // doctor+date+time slot while it's still free, then submit later once
    // it's no longer free — reproducing ADM-09's slot-collision race.
    submit?: boolean;
  },
) {
  await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Nuevo turno" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByPlaceholder("Email o teléfono del paciente").fill(opts.patientEmail);
  await dialog.getByRole("button", { name: "Buscar" }).click();

  await dialog.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  await pickAppointmentDateTime(page, opts.dayOfMonth, opts.timeLabel);

  await dialog.getByLabel("Motivo del turno", { exact: true }).fill(opts.reason);

  if (opts.submit !== false) {
    await dialog.getByRole("button", { name: "Solicitar turno" }).click();
  }

  return dialog;
}
