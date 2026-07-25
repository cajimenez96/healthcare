import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getPatientIdentificationFileId } from "./db";
import { pickAppointmentDateTime } from "./helpers";

const ID_DOCUMENT_PATH = "public/assets/icons/user.svg";

export async function createPatientUser(
  page: Page,
  input: { name: string; email: string; phone: string },
) {
  await page.goto("/");
  await page.getByLabel("Full name", { exact: true }).fill(input.name);
  await page.getByLabel("Email", { exact: true }).fill(input.email);
  const phoneInput = page.locator(".input-phone input");
  await phoneInput.click();
  await phoneInput.fill(input.phone);
  await page.getByRole("button", { name: "Get Started" }).click();

  await expect(page).toHaveURL(/\/patients\/[a-f0-9]{24}\/register$/);
  const match = page.url().match(/\/patients\/([a-f0-9]{24})\/register/);
  const userId = match![1];
  return { userId };
}

export async function registerFullPatient(
  page: Page,
  opts: {
    userId: string;
    doctorName: string;
    insuranceProviderName?: string;
    uploadIdentification?: boolean;
  },
) {
  await page.goto(`/patients/${opts.userId}/register`);

  // Birth date - plain date picker (no time), type + Enter commits it.
  const birthDateInput = page.locator(".date-picker input").first();
  await birthDateInput.click();
  await birthDateInput.fill("01/15/1990");
  await birthDateInput.press("Enter");

  await page.getByLabel("Male", { exact: true }).click();

  await page.getByLabel("Address", { exact: true }).fill("Av. Siempre Viva 742");
  await page.getByLabel("Occupation", { exact: true }).fill("QA Automation");

  await page.getByLabel("Emergency contact name", { exact: true }).fill("Contacto Emergencia QA");
  const emergencyPhone = page.locator(".input-phone input").nth(1);
  await emergencyPhone.click();
  await emergencyPhone.fill("+5491155556666");

  // Radix Select triggers expose the FormLabel text as their accessible
  // name (via aria-labelledby), regardless of whether they're still showing
  // the placeholder or a pre-filled default value - so target by label, not
  // by the placeholder text which may or may not be visible.
  await page.getByRole("combobox", { name: "Primary care physician" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  if (opts.insuranceProviderName) {
    await page.getByRole("combobox", { name: "Insurance provider" }).click();
    await page.getByRole("option", { name: opts.insuranceProviderName }).click();
  }

  await page.getByLabel("Insurance policy number", { exact: true }).fill("POL-QA-0001");

  await page.getByRole("combobox", { name: "Identification Type" }).click();
  await page.getByRole("option", { name: "National Identity Card" }).click();
  await page.getByLabel("Identification Number", { exact: true }).fill("30111222");

  if (opts.uploadIdentification) {
    await page.locator("input[type=file]").setInputFiles(ID_DOCUMENT_PATH);
  }

  await page.locator("#treatmentConsent").click();
  await page.locator("#disclosureConsent").click();
  await page.locator("#privacyConsent").click();

  await page.getByRole("button", { name: "Submit and Continue" }).click();
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
  await page.goto(`/patients/${opts.userId}/new-appointment`);

  await page.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  await pickAppointmentDateTime(page, opts.dayOfMonth, opts.timeLabel);

  await page.getByLabel("Appointment reason", { exact: true }).fill(opts.reason);

  if (opts.submit !== false) {
    await page.getByRole("button", { name: "Submit Apppointment" }).click();
  }

  return page;
}
