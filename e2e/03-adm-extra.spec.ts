import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS } from "./credentials";
import { loginAs, uniqueSuffix } from "./helpers";
import { bookAppointmentAsAdmin, createStaffPatient } from "./patient-flow";
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

// A different time-of-day than 02-flujo.spec.ts's slots (10:00/11:00 AM),
// so even if both files land on the same day for this same shared doctor,
// they never collide. Second-granularity across a wide day range keeps
// quick repeated runs during local iteration from colliding with a
// previous run's still-booked slot.
const DAY_OF_MONTH = String(2 + (Math.floor(Date.now() / 1000) % 26));
const TIME_LABEL = "9:00 AM";

// TASK-023/024: both patient creation and appointment booking are
// staff-mediated now (createStaffPatient / bookAppointmentAsAdmin instead
// of the deleted public self-service flow). The slot-collision race this
// test reproduces is still real-world reachable - two receptionists (or,
// here, the same Administrador in two tabs) booking the same doctor+time at
// once - it just no longer needs two different patient sessions to set up.
test.describe("ADM-09 - choque de horario", () => {
  test("segundo turno para el mismo doctor y horario falla con el mensaje literal", async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    const runA = uniqueSuffix();
    const emailA = `qa.adm09.a.${runA}@test.local`;
    await createStaffPatient(pageA, {
      name: `Paciente ADM09 A ${runA}`,
      email: emailA,
      phone: "+5491166667777",
      doctorName: DOCTOR_NAME,
    });

    const runB = uniqueSuffix();
    const emailB = `qa.adm09.b.${runB}@test.local`;
    await createStaffPatient(pageB, {
      name: `Paciente ADM09 B ${runB}`,
      email: emailB,
      phone: "+5491177778888",
      doctorName: DOCTOR_NAME,
    });

    // Both fill (but don't submit) the identical doctor+date+time on the
    // Admin's "Nuevo turno" dialog (AppointmentForm's time picker
    // proactively hides slots that are already booked, so a strictly
    // sequential "book A, then try B at the same slot" never lets B even
    // select the taken time in the UI) - at this point the slot is still
    // free for both.
    const dialogA = await bookAppointmentAsAdmin(pageA, {
      patientEmail: emailA,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DAY_OF_MONTH,
      timeLabel: TIME_LABEL,
      reason: "Primer turno de choque de horario",
      submit: false,
    });
    const dialogB = await bookAppointmentAsAdmin(pageB, {
      patientEmail: emailB,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DAY_OF_MONTH,
      timeLabel: TIME_LABEL,
      reason: "Segundo turno, mismo horario, debe fallar",
      submit: false,
    });

    // A submits first and wins the slot.
    await dialogA.getByRole("button", { name: "Solicitar turno" }).click();
    await expect(dialogA).toBeHidden();

    // B submits second, against the same (now-taken) slot it still has
    // selected in memory.
    await pageB.bringToFront();
    await dialogB.getByRole("button", { name: "Solicitar turno" }).click();

    await expect(dialogB).toBeVisible(); // didn't close - no success
    await expect(
      dialogB.getByText(
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
    await createStaffPatient(page, {
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
    // (Admin's direct booking flow, TASK-018).
    await page.goto("/admin");
    await page.getByRole("button", { name: "Nuevo turno" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Email o teléfono del paciente").fill(patientEmail);
    await dialog.getByRole("button", { name: "Buscar" }).click();
    await dialog.getByRole("combobox", { name: "Doctor" }).click();
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
