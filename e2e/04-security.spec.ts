import { expect, test } from "@playwright/test";

import { loginAsPatient, uniqueSuffix } from "./helpers";
import { createPatientUser } from "./patient-flow";
import { readState } from "./state";

// SEG-01 / SEG-02 were documented, accepted findings (docs/TESTING.md §5 y
// §10) until TASK-015 added real patient authentication (DNI+PIN). These
// specs now confirm the FIX: an anonymous third party can no longer reach
// either resource, while the actual owning patient still can.

test.describe("SEG-01 - proteccion del perfil de un paciente (post TASK-015)", () => {
  test("un actor no autenticado ya NO puede leer el PII de otro usuario via userId", async ({ page, browser }) => {
    const run = uniqueSuffix();
    const name = `Paciente SEG01 ${run}`;
    const email = `qa.seg01.${run}@test.local`;
    const phone = "+5491199990000";
    const identificationNumber = `35${run}`;
    const pin = "1234";

    // PAC-01 only (no PAC-03) - completing just the public "get started"
    // form is enough to create a User with PII, before any real
    // registration/consent has happened.
    const { userId } = await createPatientUser(page, { name, email, phone, identificationNumber, pin });

    // Fresh, cookie-less browser context - simulates a completely
    // unauthenticated third party who only obtained/guessed the userId.
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    // page.goto() follows the redirect chain and returns the FINAL
    // response - middleware answers with a 307 to /patients/login (verified
    // manually against the raw response), but that login page itself is a
    // real, legitimately-200 page. So the redirect target (URL) and the
    // absence of the protected form are the correct signals here, not the
    // final response's status code.
    await anonPage.goto(`/patients/${userId}/register`);
    await expect(anonPage).toHaveURL(/\/patients\/login/);
    await expect(anonPage.getByLabel("Correo electrónico")).toHaveCount(0);

    await anonContext.close();

    // The actual owner, logging in with their own DNI+PIN, still can.
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await loginAsPatient(ownerPage, identificationNumber, pin);
    await ownerPage.goto(`/patients/${userId}/register`);
    await expect(ownerPage.getByLabel("Correo electrónico")).toHaveValue(email);

    await ownerContext.close();
  });
});

test.describe("SEG-02 - proteccion de descarga de documentos (post TASK-015)", () => {
  test("un fileId de documento de identificacion ya NO se descarga sin sesion", async ({ browser }) => {
    const state = readState();
    test.skip(
      !state.identificationFileId,
      "BLOQUEADO: no hay identificationFileId (deberia haberlo guardado 02-flujo.spec.ts / PAC-03).",
    );

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    const response = await anonPage.goto(`/api/files/${state.identificationFileId}`);
    expect(response?.status()).toBe(401);

    await anonContext.close();
  });

  test("con cualquier sesion autenticada, el archivo se descarga igual (no exige ser el dueño)", async ({
    page,
    browser,
  }) => {
    const state = readState();
    test.skip(!state.identificationFileId, "BLOQUEADO: no hay identificationFileId.");

    const run = uniqueSuffix();
    const { identificationNumber, pin } = await createPatientUser(page, {
      name: `Paciente SEG02 ${run}`,
      email: `qa.seg02.${run}@test.local`,
      phone: "+5491100009999",
      identificationNumber: `36${run}`,
    });

    const context = await browser.newContext();
    const authedPage = await context.newPage();
    await loginAsPatient(authedPage, identificationNumber, pin);

    const response = await authedPage.goto(`/api/files/${state.identificationFileId}`);
    expect(response?.status()).toBe(200);

    await context.close();
  });
});
