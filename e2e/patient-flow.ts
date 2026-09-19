import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { ADMIN_CREDENTIALS, SECRETARIA_CREDENTIALS } from "./credentials";
import { getPatientIdentificationFileIdByEmail } from "./db";
import { loginAs } from "./helpers";

const ID_DOCUMENT_PATH = "public/assets/icons/user.svg";

// TASK-023/024: patient onboarding is 100% staff-mediated now — there is no
// more public self-registration/login flow to drive through Playwright.
// This replaces the old createPatientUser + registerFullPatient two-step
// dance with a single staff-side submission of CreatePatientForm, via
// /recepcion/pacientes (the primary flow — Secretaria).
// TASK-059: the standalone /recepcion/pacientes/nuevo page is gone —
// creation now happens through the "Crear paciente" Dialog on the unified
// list screen, same pattern already used by "Crear Doctor" (00-setup.spec.ts).
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
  await page.goto("/recepcion/pacientes");
  await page.getByRole("button", { name: "Crear paciente" }).click();

  const dialog = page.getByRole("dialog");

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

  const identificationNumber =
    input.identificationNumber ?? `30${Date.now()}${Math.floor(Math.random() * 1000)}`;

  await page.getByRole("combobox", { name: "Tipo de identificación" }).click();
  await page.getByRole("option", { name: "Documento Nacional de Identidad (DNI)" }).click();
  await page
    .getByLabel("Número de identificación", { exact: true })
    .fill(identificationNumber);
  // Required on this form (unlike the old public flow) — there's no patient
  // present later to come back and add it.
  await page.locator("input[type=file]").setInputFiles(ID_DOCUMENT_PATH);

  // Scoped to the dialog — the "Crear paciente" trigger button (always
  // visible on the list, TASK-059) stays in the DOM behind the overlay with
  // the exact same accessible name as this submit button.
  await dialog.getByRole("button", { name: "Crear paciente" }).click();

  // The dialog closes on success (CreatePatientForm's setOpen?.(false)), so
  // instead of a success message that may already be gone by the time this
  // assertion runs, wait for the new patient to show up in the underlying
  // list (PatientsList refreshes itself via the onCreated callback).
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(input.name, { exact: false }).first()).toBeVisible();

  const fileId = await getPatientIdentificationFileIdByEmail(input.email);

  // TASK-043: callers now need the DNI back too — the new "Nuevo turno" page
  // (bookAppointmentAsAdmin below) searches for the patient by DNI
  // (TASK-033), not by email/phone like the deleted AdminNewAppointmentModal.
  return { email: input.email, fileId, identificationNumber };
}

// TASK-043: AdminNewAppointmentModal is gone — "Nuevo turno" is now the
// full-page calendar, unified with the appointment list at /admin/turnos
// (TASK-060, ?new=true triggers the booking flow instead of a separate
// /nuevo route). Navigates there, searches for the patient by DNI
// (TASK-033, not email/phone like the deleted modal), and picks doctor +
// prestación, leaving the doctor's week calendar mounted and ready for
// clickCalendarSlot below. Split out from the actual slot click (unlike the
// old single-call helper) because ADM-09 needs two pages to reach the
// identical calendar view independently before either clicks.
export async function goToNewAppointmentWithSelection(
  page: Page,
  opts: {
    patientIdentificationNumber: string;
    doctorName: string;
    treatmentName: string;
  },
) {
  await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
  await page.goto("/admin/turnos?new=true");

  // TASK-050: real-time debounced search (name OR DNI), no separate "Buscar"
  // button anymore — type the DNI and click the matching result card once it
  // appears (Playwright's role locator auto-waits through the debounce +
  // round trip).
  await page
    .getByPlaceholder("Buscar por nombre o DNI")
    .fill(opts.patientIdentificationNumber);
  await page
    .getByRole("button")
    .filter({ hasText: opts.patientIdentificationNumber })
    .first()
    .click();

  await page.getByRole("combobox", { name: "Doctor" }).click();
  await page.getByRole("option", { name: opts.doctorName }).click();

  await page.getByRole("combobox", { name: "Prestación" }).click();
  await page
    .getByRole("option", { name: new RegExp(`^${opts.treatmentName}`) })
    .click();

  // TASK-051: once patient + doctor + treatment are all selected, the
  // calendar no longer mounts inline — it opens in a Dialog behind a "Ver
  // calendario" trigger button.
  await page.getByRole("button", { name: "Ver calendario" }).click();
  await expect(page.locator(".rbc-time-content")).toBeVisible();
}

// Clicks an empty week-view slot at least `weeksAhead` weeks out, at
// `dayIndex` (0-6, Monday-first per the "es" date-fns locale the calendar
// uses) and `hour` (24h, on the hour — matches this suite's doctor, whose
// availability spans every day 08:00-20:00, see 00-setup.spec.ts, so any
// hour in that range books directly with no out-of-availability confirm),
// then confirms it via the "Guardar turno" button (TASK-052 — a slot click
// only selects now, it no longer books by itself). Targets react-big-
// calendar's own DOM structure directly (step=30, timeslots=1 on
// DoctorWeekCalendar means one .rbc-timeslot-group per 30-minute slot) —
// there's no accessible name on an individual grid cell to select by
// role/label instead.
export async function clickCalendarSlot(
  page: Page,
  opts: { weeksAhead: number; dayIndex: number; hour: number },
) {
  const nextButton = page.getByRole("button", { name: "Siguiente" });
  for (let i = 0; i < opts.weeksAhead; i++) {
    await nextButton.click();
  }

  const dayColumn = page
    .locator(".rbc-time-content .rbc-day-slot")
    .nth(opts.dayIndex);
  const slotIndex = (opts.hour - 7) * 2; // DoctorWeekCalendar's MIN_TIME is 07:00
  // force: true — react-big-calendar layers an absolutely-positioned (empty
  // but present) .rbc-events-container over the slot grid to render events
  // in the same visual area, which Playwright's actionability check flags
  // as "intercepting" a plain click even though it's the intended overlay
  // RBC's own Selection utility expects the click to land through.
  await dayColumn
    .locator(".rbc-timeslot-group")
    .nth(slotIndex)
    .locator(".rbc-time-slot")
    .first()
    .click({ force: true });

  await page.getByRole("button", { name: "Guardar turno" }).click();
}

// Convenience wrapper for the common case (no need to click on two separate
// pages first, unlike ADM-09) — navigates, selects, and books in one call.
export async function bookAppointmentAsAdmin(
  page: Page,
  opts: {
    patientIdentificationNumber: string;
    doctorName: string;
    treatmentName: string;
    weeksAhead: number;
    dayIndex: number;
    hour: number;
  },
) {
  await goToNewAppointmentWithSelection(page, opts);
  await clickCalendarSlot(page, opts);
}
