import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS } from "./credentials";
import { loginAs, uniqueSuffix } from "./helpers";
import { createPatientUser, registerFullPatient, requestAppointment } from "./patient-flow";
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

test.describe("ADM-09 - choque de horario", () => {
  test("segundo turno para el mismo doctor y horario falla con el mensaje literal", async ({ browser }) => {
    // The AppointmentForm's time picker proactively hides slots that are
    // already booked (it re-fetches available slots per doctor+date), so a
    // strictly sequential "book A, then try B at the same slot" never lets
    // B even select the taken time in the UI - it's just disabled. This
    // race is real-world reachable (two patients booking at the same
    // moment), so reproduce it: both fill the SAME still-free slot
    // (without submitting) before either one commits, then submit A first
    // and B second - B's react-hook-form state still holds the now-stale
    // slot, so its submit reaches the server and hits the same
    // existsOverlapping check ADM-08's confirm flow would hit.
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    const runA = uniqueSuffix();
    const dniA = `32${runA}`;
    const { userId: userIdA } = await createPatientUser(pageA, {
      name: `Paciente ADM09 A ${runA}`,
      email: `qa.adm09.a.${runA}@test.local`,
      phone: "+5491166667777",
      identificationNumber: dniA,
    });
    await registerFullPatient(pageA, { userId: userIdA, identificationNumber: dniA, doctorName: DOCTOR_NAME });

    const runB = uniqueSuffix();
    const dniB = `33${runB}`;
    const { userId: userIdB } = await createPatientUser(pageB, {
      name: `Paciente ADM09 B ${runB}`,
      email: `qa.adm09.b.${runB}@test.local`,
      phone: "+5491177778888",
      identificationNumber: dniB,
    });
    await registerFullPatient(pageB, { userId: userIdB, identificationNumber: dniB, doctorName: DOCTOR_NAME });

    // Both fill (but don't submit) the identical doctor+date+time - at this
    // point the slot is still free for both.
    await requestAppointment(pageA, {
      userId: userIdA,
      identificationNumber: dniA,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DAY_OF_MONTH,
      timeLabel: TIME_LABEL,
      reason: "Primer turno de choque de horario",
      submit: false,
    });
    await requestAppointment(pageB, {
      userId: userIdB,
      identificationNumber: dniB,
      doctorName: DOCTOR_NAME,
      dayOfMonth: DAY_OF_MONTH,
      timeLabel: TIME_LABEL,
      reason: "Segundo turno, mismo horario, debe fallar",
      submit: false,
    });

    // A submits first and wins the slot.
    await pageA.getByRole("button", { name: "Solicitar turno" }).click();
    await expect(pageA).toHaveURL(/\/new-appointment\/success\?appointmentId=/);

    // B submits second, against the same (now-taken) slot it still has
    // selected in memory.
    await pageB.bringToFront();
    await pageB.getByRole("button", { name: "Solicitar turno" }).click();

    await expect(pageB).toHaveURL(/\/new-appointment$/); // no redirect to success
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
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin/doctors");

    const row = page.locator("li", { hasText: DOCTOR_NAME });
    await row.getByRole("button", { name: "Desactivar" }).click();

    await expect(row.getByText("(inactivo)")).toBeVisible();
    await expect(row.getByRole("button", { name: "Reactivar" })).toBeVisible();

    // Still listed in the admin roster (getAllDoctors).
    await page.reload();
    await expect(page.locator("li", { hasText: DOCTOR_NAME })).toBeVisible();

    // Disappears from the active-doctors dropdown used by new-appointment.
    const run = uniqueSuffix();
    const { userId } = await createPatientUser(page, {
      name: `Paciente ADM05 ${run}`,
      email: `qa.adm05.${run}@test.local`,
      phone: "+5491188889999",
      identificationNumber: `34${run}`,
    });
    await page.goto(`/patients/${userId}/new-appointment`);
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
