import { expect, test } from "@playwright/test";

import { ADMIN_CREDENTIALS, SECRETARIA_CREDENTIALS } from "./credentials";
import { loginAs } from "./helpers";
import { readState } from "./state";

const PROTECTED_ROUTES = ["/admin", "/doctor", "/recepcion"];

test.describe("AUTH-01 - redireccion a login sin sesion", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`GET ${route} sin sesion redirige a /login?callbackUrl=${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(page.url()).toContain("/login");
      expect(page.url()).toContain(`callbackUrl=${encodeURIComponent(route)}`);
      // Final response after following the redirect chain should be the login page (200).
      expect(response?.status()).toBe(200);
    });
  }
});

test.describe("AUTH-02 - acceso cruzado entre roles (9 cruces)", () => {
  const doctor = readState().doctor;

  const roles: { label: string; email: string; password: string; ownRoute: string; otherRoutes: string[] }[] = [
    {
      label: "Administrador",
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      ownRoute: "/admin",
      otherRoutes: ["/doctor", "/recepcion"],
    },
    {
      label: "Secretaria",
      email: SECRETARIA_CREDENTIALS.email,
      password: SECRETARIA_CREDENTIALS.password,
      ownRoute: "/recepcion",
      otherRoutes: ["/admin", "/doctor"],
    },
  ];

  if (doctor) {
    roles.push({
      label: "Doctor",
      email: doctor.email,
      password: doctor.password,
      ownRoute: "/doctor",
      otherRoutes: ["/admin", "/recepcion"],
    });
  }

  for (const role of roles) {
    for (const otherRoute of role.otherRoutes) {
      test(`${role.label} -> ${otherRoute} redirige a /unauthorized`, async ({ page }) => {
        await loginAs(page, role.email, role.password);
        await expect(page).toHaveURL(new RegExp(`${role.ownRoute}$`));

        await page.goto(otherRoute);
        await expect(page).toHaveURL(/\/unauthorized$/);
        await expect(page.getByText("Acceso no autorizado")).toBeVisible();
        await expect(
          page.getByText(
            "Tu usuario no tiene permiso para acceder a esta página.",
          ),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Volver a iniciar sesión" }),
        ).toBeVisible();
      });
    }
  }

  test.skip(!doctor, "BLOQUEADO: no Doctor state found from 00-setup.spec.ts");
});

test.describe("AUTH-03 - login con credenciales invalidas", () => {
  test("email inexistente muestra el mensaje literal y no navega", async ({ page }) => {
    await loginAs(page, "no-existe-qa@test.local", "cualquierPassword1");
    await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("email valido con contraseña incorrecta muestra el mismo mensaje literal", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, "contraseña-incorrecta-123");
    await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("AUTH-05 - redireccion post-login segun rol", () => {
  test("Administrador -> /admin", async ({ page }) => {
    await loginAs(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("Secretaria -> /recepcion", async ({ page }) => {
    await loginAs(page, SECRETARIA_CREDENTIALS.email, SECRETARIA_CREDENTIALS.password);
    await expect(page).toHaveURL(/\/recepcion$/);
  });

  test("Doctor -> /doctor", async ({ page }) => {
    const doctor = readState().doctor;
    test.skip(!doctor, "BLOQUEADO: no Doctor state found from 00-setup.spec.ts");
    await loginAs(page, doctor!.email, doctor!.password);
    await expect(page).toHaveURL(/\/doctor$/);
  });
});
