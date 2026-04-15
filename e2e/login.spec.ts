import { test, expect } from "@playwright/test";

// These tests intentionally run without the stored auth state so we can
// exercise the login page and the unauthenticated route guard.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Página de Login", () => {
  test("muestra el formulario con email, contraseña y botón", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("TaskFlow")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" })
    ).toBeVisible();
  });

  test("muestra mensaje de error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("noexiste@example.com");
    await page.getByLabel("Contraseña").fill("claveincorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Credenciales incorrectas")).toBeVisible();
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirige al dashboard tras login exitoso", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel("Contraseña").fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("guarda de ruta redirige /dashboard al login cuando no hay sesión", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Middleware should redirect unauthenticated users to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
