import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

test.use({ storageState: STORAGE_STATE });

test.describe("Dashboard Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("muestra las tres columnas del kanban", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Por hacer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "En progreso" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Terminado" })).toBeVisible();
  });

  test("muestra el header con el email del usuario y botón de logout", async ({ page }) => {
    await expect(page.getByText(process.env.TEST_USER_EMAIL!)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  test("abre el diálogo al hacer clic en Nueva Tarea", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tarea" }).click();

    await expect(page.getByRole("heading", { name: "Nueva Tarea" })).toBeVisible();
    await expect(page.getByLabel("Título")).toBeVisible();
    await expect(page.getByLabel("Prioridad")).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelar" })).toBeVisible();
  });

  test("cancela el diálogo sin crear tarea", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva Tarea" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Dialog should be gone
    await expect(page.getByRole("heading", { name: "Nueva Tarea" })).not.toBeVisible();
  });

  test("crea una nueva tarea y aparece en la columna Por hacer", async ({ page }) => {
    const taskTitle = `Tarea E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Nueva Tarea" }).click();
    await page.getByLabel("Título").fill(taskTitle);
    await page.getByRole("button", { name: "Crear" }).click();

    // Dialog closes and the new task card is visible
    await expect(page.getByRole("heading", { name: "Nueva Tarea" })).not.toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();
  });
});
