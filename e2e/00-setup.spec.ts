import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS, DOCTOR_CREDENTIALS, RUN_ID } from "./credentials";
import { loginAs } from "./helpers";
import { writeState } from "./state";

// This spec creates the one Doctor used across the whole suite: alta from
// /admin/doctors (ADM-02) + "Crear acceso" (ADM-06), per the task's
// instruction that the Doctor account is not seeded, it's produced by the
// E2E flow itself. AUTH-02/AUTH-05 (Doctor role) and the FLU-02/FLU-03
// clinical flow both depend on this account existing, so it must run first.
const DOCTOR_NAME = `Dra. QA Automatizada ${RUN_ID}`;

test.describe.serial("00-setup: ADM-02 + ADM-06 (Doctor with access)", () => {
  test("ADM-02 - alta de doctor con disponibilidad todos los dias", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/doctors");

    await page.getByRole("button", { name: "Crear Doctor" }).click();

    await page.getByLabel("Nombre").fill(DOCTOR_NAME);
    await page.getByLabel("Especialidad").fill("Odontología General QA");
    await page.getByLabel("Matrícula").fill(`MP-QA-${RUN_ID}`);

    // Photo is required on create (ADM-03). Any file works (GridFS storage
    // has no mime restriction) - reuse an existing small public asset.
    await page
      .locator("input[type=file]")
      .setInputFiles("public/assets/icons/user.svg");

    // Tick every day of the week with a wide 08:00-20:00 window so the
    // AppointmentForm's date picker never has to fight day-of-week
    // restrictions later in the suite.
    for (const day of [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ]) {
      await page.getByText(day, { exact: true }).locator("..").getByRole("checkbox").click();
    }
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.nth(0).fill("08:00");
    await timeInputs.nth(1).fill("20:00");

    await page.getByRole("button", { name: "Crear doctor" }).click();

    await expect(page).toHaveURL(/\/admin\/doctors$/);
    await expect(page.getByText(DOCTOR_NAME, { exact: false })).toBeVisible();
    // Active by default - no "(inactivo)" suffix next to the name.
    await expect(
      page.locator("li", { hasText: DOCTOR_NAME }).getByText("(inactivo)"),
    ).toHaveCount(0);
  });

  test("ADM-06 - crear acceso de login para el doctor", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await page.goto("/admin/doctors");

    // CreateDoctorAccessForm doesn't render the doctor's name once the row
    // switches into "createAccess" mode, so a hasText-based locator would
    // stop resolving mid-test. Pin the row by DOM position instead, found
    // once while it's still showing the name in view mode.
    const allRows = page.locator("li");
    const rowCount = await allRows.count();
    let rowIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      if ((await allRows.nth(i).innerText()).includes(DOCTOR_NAME)) {
        rowIndex = i;
        break;
      }
    }
    expect(rowIndex, `no se encontro la fila del doctor "${DOCTOR_NAME}"`).toBeGreaterThanOrEqual(0);
    const row = allRows.nth(rowIndex);

    await row.getByRole("button", { name: "Crear acceso" }).click();

    await row.getByLabel("Email de acceso").fill(DOCTOR_CREDENTIALS.email);
    await row.getByLabel("Contraseña").fill(DOCTOR_CREDENTIALS.password);
    await row.getByRole("button", { name: "Crear acceso" }).click();

    // On success the row goes back to view mode (createAccess form unmounts).
    await expect(page.getByLabel("Email de acceso")).toHaveCount(0);
    await expect(page.getByText("No se pudo crear el acceso", { exact: false })).toHaveCount(0);

    writeState({
      doctor: {
        id: "", // not exposed in the UI; not needed by later specs
        name: DOCTOR_NAME,
        email: DOCTOR_CREDENTIALS.email,
        password: DOCTOR_CREDENTIALS.password,
      },
    });
  });

  test("El doctor recien creado puede loguearse y llega a /doctor", async ({ page }) => {
    await loginAs(page, DOCTOR_CREDENTIALS.email, DOCTOR_CREDENTIALS.password);
    await expect(page).toHaveURL(/\/doctor$/);
  });
});
