import { expect, type Page } from "@playwright/test";
import { hashRoute } from "./routes.js";

export async function login(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto(hashRoute("/login"));
  await page.getByPlaceholder("Логин").fill(username);
  await page.getByPlaceholder("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();

  await page.waitForFunction(
    () => localStorage.getItem("user") !== null,
    { timeout: 15_000 }
  );

  // LoginForm: window.location.href = "/profile" (без hash) — дождаться редиректа
  await page.waitForURL(/\/profile/, { timeout: 15_000 });

  await page.goto(hashRoute("/"));
  await expect(page.locator("body")).toBeVisible();
}
