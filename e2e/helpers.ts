import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

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

/**
 * Selects a date + time on the AppointmentForm's react-datepicker
 * (showTimeSelect). Opens the popup, advances one month forward to be safely
 * in the future, clicks a fixed day, then clicks the matching time slot.
 */
export async function pickAppointmentDateTime(
  page: Page,
  dayOfMonth: string,
  timeLabel: string,
) {
  const dateInput = page.locator(".date-picker input");
  await dateInput.click();

  const nextMonthButton = page.locator(
    'button.react-datepicker__navigation--next',
  );
  await nextMonthButton.click();

  await page
    .locator(
      ".react-datepicker__day:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--disabled)",
    )
    .filter({ hasText: new RegExp(`^${dayOfMonth}$`) })
    .first()
    .click();

  const timeItem = page.locator(".react-datepicker__time-list-item", {
    hasText: timeLabel,
  });
  await expect(timeItem.first()).toBeVisible({ timeout: 15_000 });
  await timeItem.first().click();

  // The popup should auto-close on time selection, but that can lag behind
  // the click (animation/state timing), leaving it overlapping later
  // elements (e.g. the submit button) and intercepting clicks. Force it
  // closed and wait it out before returning control to the caller.
  await page.keyboard.press("Escape").catch(() => {});
  await expect(page.locator(".react-datepicker-popper")).toHaveCount(0, { timeout: 10_000 }).catch(() => {});
}

export function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
