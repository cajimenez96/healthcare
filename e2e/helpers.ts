import type { Page } from "@playwright/test";

/**
 * Logs in through /login and waits for the outcome to settle: either the
 * post-login redirect away from /login (success) or the inline error
 * message (AUTH-03 negative case). Without this wait, an immediate
 * page.goto() right after the click can race the async signIn() +
 * getSession() + router.push and cancel the in-flight session cookie set.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);

  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/callback/credentials")),
    page.getByRole("button", { name: "Ingresar" }).click(),
  ]);
  void response;

  await Promise.race([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10_000 }).catch(() => {}),
    page
      .getByText("Email o contraseña incorrectos.")
      .waitFor({ timeout: 10_000 })
      .catch(() => {}),
  ]);
}

export function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
