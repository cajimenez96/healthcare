import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS } from "./credentials";
import { loginAs, uniqueSuffix } from "./helpers";
import {
  clickCalendarSlot,
  createStaffPatient,
  goToNewAppointmentWithSelection,
} from "./patient-flow";
import { readState } from "./state";

test.describe.configure({ mode: "serial" });

// See the same note in 02-flujo.spec.ts: must be read lazily (beforeAll),
// not at module scope, since all spec files are statically loaded before
// any test (incl. 00-setup.spec.ts's) actually runs.
let DOCTOR_NAME: string;

test.beforeAll(() => {
  const state = readState();
  if (!state.doctor) {
    throw new Error("BLOQUEADO: no se encontro el Doctor creado por 00-setup.spec.ts.");
  }
  DOCTOR_NAME = state.doctor.name;
});

// A different weeks-ahead offset than 02-flujo.spec.ts's slots, so even if
// both files land on the same day for this same shared doctor, they never
// collide. Second-granularity across a wide range keeps quick repeated runs
// during local iteration from colliding with a previous run's still-booked
// slot.
const WEEKS_AHEAD = 7 + (Math.floor(Date.now() / 1000) % 6);
const DAY_INDEX = Math.floor(Date.now() / 1000) % 7;
const HOUR = 8 + (Math.floor(Date.now() / 1000) % 11);

// TASK-023/024: both patient creation and appointment booking are
// staff-mediated now. TASK-043 replaced the "fill the form, submit later"
// deferred-submit trick this test used to reproduce the race
// (AdminNewAppointmentModal/AppointmentForm, deleted) with two pages that
// each independently load the doctor's calendar for the exact same
// week/day/hour (both fetch the doctor's busy appointments once, before
// either books) and then click that identical slot in sequence — the second
// click still targets a cell its own (now-stale) view still shows as free,
// so the race is reproduced the same way, just via two page loads instead of
// two unsubmitted forms. The slot-collision race itself is still
// real-world reachable - two receptionists (or, here, the same
// Administrador in two tabs) booking the same doctor+time at once.
test.describe("ADM-09 - choque de horario", () => {
  test("segundo turno para el mismo doctor y horario falla con el mensaje literal", async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    const runA = uniqueSuffix();
    const emailA = `qa.adm09.a.${runA}@test.local`;
    const { identificationNumber: dniA } = await createStaffPatient(pageA, {
      name: `Paciente ADM09 A ${runA}`,
      email: emailA,
      phone: "+5491166667777",
      doctorName: DOCTOR_NAME,
    });

    const runB = uniqueSuffix();
    const emailB = `qa.adm09.b.${runB}@test.local`;
    const { identificationNumber: dniB } = await createStaffPatient(pageB, {
      name: `Paciente ADM09 B ${runB}`,
      email: emailB,
      phone: "+5491177778888",
      doctorName: DOCTOR_NAME,
    });

    // Both reach the doctor's calendar for the identical target week - at
    // this point the slot is still free for both.
    await goToNewAppointmentWithSelection(pageA, {
      patientIdentificationNumber: dniA,
      doctorName: DOCTOR_NAME,
      treatmentName: "Consulta Odontológica",
    });
    await goToNewAppointmentWithSelection(pageB, {
      patientIdentificationNumber: dniB,
      doctorName: DOCTOR_NAME,
      treatmentName: "Consulta Odontológica",
    });

    // A clicks first and wins the slot.
    await clickCalendarSlot(pageA, { weeksAhead: WEEKS_AHEAD, dayIndex: DAY_INDEX, hour: HOUR });
    await expect(pageA.getByText("Turno agendado con éxito.")).toBeVisible();

    // B clicks the same slot second, against its own view (fetched before A
    // booked) which still shows it as free.
    await pageB.bringToFront();
    await clickCalendarSlot(pageB, { weeksAhead: WEEKS_AHEAD, dayIndex: DAY_INDEX, hour: HOUR });

    await expect(
      pageB.getByText(
        "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo.",
      ),
    ).toBeVisible();

    await context.close();
  });
});

test.describe("ADM-05 - desactivar / reactivar doctor", () => {
  test("desactivar oculta al doctor de los formularios de turno pero lo mantiene en /admin/doctors", async ({ page }) => {
    // Created up front, while the doctor is still active - CreatePatientForm
    // requires a primaryPhysician, so there'd be nothing to pick from once
    // this is the only doctor and it's deactivated. Reused below to reach
    // the booking dropdown after deactivation.
    const run = uniqueSuffix();
    const patientEmail = `qa.adm05.${run}@test.local`;
    const { identificationNumber: patientDni } = await createStaffPatient(page, {
      name: `Paciente ADM05 ${run}`,
      email: patientEmail,
      phone: "+5491188889999",
      doctorName: DOCTOR_NAME,
    });

    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin/doctors");

    const row = page.locator("li", { hasText: DOCTOR_NAME });
    await row.getByRole("button", { name: "Desactivar" }).click();

    await expect(row.getByText("(inactivo)")).toBeVisible();
    await expect(row.getByRole("button", { name: "Reactivar" })).toBeVisible();

    // Still listed in the admin roster (getAllDoctors).
    await page.reload();
    await expect(page.locator("li", { hasText: DOCTOR_NAME })).toBeVisible();

    // Disappears from the active-doctors dropdown used by "Nuevo turno"
    // (Admin's direct booking flow, TASK-043 — the full-page calendar that
    // replaced AdminNewAppointmentModal, TASK-018).
    await page.goto("/admin/turnos/nuevo");
    await page.getByPlaceholder("DNI del paciente").fill(patientDni);
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.getByRole("combobox", { name: "Doctor" }).click();
    await expect(page.getByRole("option", { name: DOCTOR_NAME })).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  test("reactivar devuelve al doctor a las listas activas", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin/doctors");

    const row = page.locator("li", { hasText: DOCTOR_NAME });
    await row.getByRole("button", { name: "Reactivar" }).click();
    await expect(row.getByText("(inactivo)")).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Desactivar" })).toBeVisible();
  });
});
