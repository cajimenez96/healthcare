import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getPatientIdentificationFileId } from "./db";
import { loginAsPatient, pickAppointmentDateTime } from "./helpers";

const ID_DOCUMENT_PATH = "public/assets/icons/user.svg";
const DEFAULT_PIN = "1234";

export async function createPatientUser(
  page: Page,
  input: {
    name: string;
    email: string;
    phone: string;
    identificationNumber: string;
    pin?: string;
  },
) {
  const pin = input.pin ?? DEFAULT_PIN;

  await page.goto("/");
  await page.getByLabel("Nombre completo", { exact: true }).fill(input.name);
  await page.getByLabel("Correo electrónico", { exact: true }).fill(input.email);
  const phoneInput = page.locator(".input-phone input");
  await phoneInput.click();
  await phoneInput.fill(input.phone);

  await page.getByRole("combobox", { name: "Tipo de identificación" }).click();
  await page.getByRole("option", { name: "Documento Nacional de Identidad (DNI)" }).click();
  await page.getByLabel("Número de identificación", { exact: true }).fill(input.identificationNumber);
  await page.getByLabel("Elegí un PIN de acceso", { exact: false }).fill(pin);

  await page.getByRole("button", { name: "Comenzar" }).click();

  await expect(page).toHaveURL(/\/patients\/[a-f0-9]{24}\/register$/);
  const match = page.url().match(/\/patients\/([a-f0-9]{24})\/register/);
  const userId = match![1];
  return { userId, identificationNumber: input.identificationNumber, pin };
}

export async function registerFullPatient(
  page: Page,
  opts: {
    userId: string;
    identificationNumber: string;
    pin?: string;
    doctorName: string;
    insuranceProviderName?: string;
    uploadIdentification?: boolean;
  },
) {
  // A patient session established in an earlier test() block (e.g. by
  // createPatientUser) doesn't carry over to this one's fresh page/context —
  // re-authenticate unconditionally so this helper works either way.
  await loginAsPatient(page, opts.identificationNumber, opts.pin ?? DEFAULT_PIN);
  await page.goto(`/patients/${opts.userId}/register`);

  // Birth date - plain date picker (no time), type + Enter commits it.
  const birthDateInput = page.locator(".date-picker input").first();
  await birthDateInput.click();
  await birthDateInput.fill("01/15/1990");
  await birthDateInput.press("Enter");

  await page.getByLabel("Masculino", { exact: true }).click();

  await page.getByLabel("Dirección", { exact: true }).fill("Av. Siempre Viva 742");
  await page.getByLabel("Ocupación", { exact: true }).fill("QA Automation");

  await page.getByLabel("Nombre de contacto de emergencia", { exact: true }).fill("Contacto Emergencia QA");
  const emergencyPhone = page.locator(".input-phone input").nth(1);
  await emergencyPhone.click();
  await emergencyPhone.fill("+5491155556666");

  // Radix Select triggers expose the FormLabel text as their accessible
  // name (via aria-labelledby), regardless of whether they're still showing
  // the placeholder or a pre-filled default value - so target by label, not
  // by the placeholder text which may or may not be visible.
  await page.getByRole("combobox", { name: "Médico de cabecera" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  if (opts.insuranceProviderName) {
    await page.getByRole("combobox", { name: "Obra social" }).click();
    await page.getByRole("option", { name: opts.insuranceProviderName }).click();
  }

  await page.getByLabel("N° de afiliado", { exact: true }).fill("POL-QA-0001");

  // Tipo/Número de identificación are no longer asked here — collected in
  // step 1 (createPatientUser) since TASK-015, shown read-only above the
  // file uploader instead.

  if (opts.uploadIdentification) {
    await page.locator("input[type=file]").setInputFiles(ID_DOCUMENT_PATH);
  }

  await page.locator("#treatmentConsent").click();
  await page.locator("#disclosureConsent").click();
  await page.locator("#privacyConsent").click();

  await page.getByRole("button", { name: "Enviar y continuar" }).click();
  await expect(page).toHaveURL(new RegExp(`/patients/${opts.userId}/new-appointment$`));

  // Read back from Mongo directly rather than sniffing the Server Action's
  // network response - the RSC response body isn't reliably readable via
  // CDP once the client follows the redirect (see e2e/db.ts).
  let fileId: string | undefined;
  if (opts.uploadIdentification) {
    fileId = await getPatientIdentificationFileId(opts.userId);
  }

  return { fileId };
}

export async function requestAppointment(
  page: Page,
  opts: {
    userId: string;
    identificationNumber: string;
    pin?: string;
    doctorName: string;
    dayOfMonth: string;
    timeLabel: string;
    reason: string;
    // false lets a caller fill (and commit into react-hook-form state) a
    // doctor+date+time slot while it's still free, then submit later once
    // it's no longer free client-side - reproducing ADM-09's slot-collision
    // race without relying on the time-picker's own live availability list
    // (which proactively hides already-booked slots once it's re-fetched).
    submit?: boolean;
  },
) {
  // Same rationale as registerFullPatient — re-authenticate unconditionally,
  // this may be a fresh test() page with no session yet.
  await loginAsPatient(page, opts.identificationNumber, opts.pin ?? DEFAULT_PIN);
  await page.goto(`/patients/${opts.userId}/new-appointment`);

  await page.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  await pickAppointmentDateTime(page, opts.dayOfMonth, opts.timeLabel);

  await page.getByLabel("Motivo del turno", { exact: true }).fill(opts.reason);

  if (opts.submit !== false) {
    await page.getByRole("button", { name: "Solicitar turno" }).click();
  }

  return page;
}
