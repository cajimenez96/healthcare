import { expect, test } from "@playwright/test";

import { uniqueSuffix } from "./helpers";
import { createPatientUser } from "./patient-flow";
import { readState } from "./state";

// SEG-01 / SEG-02 are documented, accepted findings for this MVP (see
// docs/TESTING.md §5 and §10) - the job here is to CONFIRM the behavior
// still reproduces exactly as documented, not to fix it.

test.describe("SEG-01 - acceso al perfil de un paciente sin autenticacion (IDOR)", () => {
  test("un actor no autenticado puede leer el PII de otro usuario via userId", async ({ page, browser }) => {
    const run = uniqueSuffix();
    const name = `Paciente SEG01 ${run}`;
    const email = `qa.seg01.${run}@test.local`;
    const phone = "+5491199990000";

    // PAC-01 only (no PAC-03) - completing just the public "get started"
    // form is enough to create a User with PII, before any real
    // registration/consent has happened.
    const { userId } = await createPatientUser(page, { name, email, phone });

    // Fresh, cookie-less browser context - simulates a completely
    // unauthenticated third party who only obtained/guessed the userId.
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    const response = await anonPage.goto(`/patients/${userId}/register`);
    expect(response?.status()).toBe(200);

    await expect(anonPage.getByLabel("Email address")).toHaveValue(email);
    const phoneInputValue = await anonPage.locator(".input-phone input").first().inputValue();
    expect(phoneInputValue.replace(/\s/g, "")).toContain(phone.slice(-8));

    await anonContext.close();
  });
});

test.describe("SEG-02 - descarga de documentos sin autenticacion", () => {
  test("un fileId de documento de identificacion se descarga sin sesion", async ({ browser }) => {
    const state = readState();
    test.skip(
      !state.identificationFileId,
      "BLOQUEADO: no hay identificationFileId (deberia haberlo guardado 02-flujo.spec.ts / PAC-03).",
    );

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    const response = await anonPage.goto(`/api/files/${state.identificationFileId}`);
    expect(response?.status()).toBe(200);

    const body = await response!.body();
    expect(body.byteLength).toBeGreaterThan(0);

    await anonContext.close();
  });
});
