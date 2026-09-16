import { expect, test } from "@playwright/test";

import { SECRETARIA_CREDENTIALS } from "./credentials";
import { loginAs } from "./helpers";
import { readState } from "./state";

// SEG-01 / SEG-02 were documented, accepted findings (docs/TESTING.md §5 y
// §10) until TASK-015 added real patient authentication (DNI+PIN). TASK-023
// then removed the patient portal entirely as a product decision - patients
// get no self-service access of any kind anymore, onboarding is 100%
// staff-mediated (TASK-024). SEG-01's original scenario ("an anonymous
// third party can't read another patient's PII via a guessed userId, but
// the owning patient still can") no longer applies: there's no patient
// session to be the owning patient in the first place. What replaces it is
// simpler and stronger - the whole prefix is unreachable, for anyone.

test.describe("SEG-01 - el portal de pacientes fue eliminado (post TASK-023)", () => {
  test("las rutas publicas de pacientes ya no existen (404)", async ({ page }) => {
    const dummyId = "000000000000000000000000";

    for (const route of [
      "/patients/login",
      `/patients/${dummyId}/register`,
      `/patients/${dummyId}/new-appointment`,
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} deberia devolver 404`).toBe(404);
    }
  });
});

test.describe("SEG-02 - proteccion de descarga de documentos (staff-only post TASK-023)", () => {
  test("un fileId de documento de identificacion ya NO se descarga sin sesion", async ({ browser }) => {
    const state = readState();
    test.skip(
      !state.identificationFileId,
      "BLOQUEADO: no hay identificationFileId (deberia haberlo guardado 02-flujo.spec.ts).",
    );

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    const response = await anonPage.goto(`/api/files/${state.identificationFileId}`);
    expect(response?.status()).toBe(401);

    await anonContext.close();
  });

  test("con una sesion de staff, el archivo se descarga (ya no hay sesion de paciente posible)", async ({
    browser,
  }) => {
    const state = readState();
    test.skip(!state.identificationFileId, "BLOQUEADO: no hay identificationFileId.");

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);

    const response = await page.goto(`/api/files/${state.identificationFileId}`);
    expect(response?.status()).toBe(200);

    await context.close();
  });
});
