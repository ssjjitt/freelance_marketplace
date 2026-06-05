import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { demonstrateRegistration, demoPause, loginViaUI } from "../helpers/demo-ui.js";

test.describe("Демо: гость, регистрация и вход", () => {
  test("главная без входа → каталог → регистрация → вход заказчика", async ({
    page,
  }) => {
    await test.step("Главная для гостя", async () => {
      await page.goto(hashRoute("/"));
      await expect(page.getByText("Freelance Маркетплейс")).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Регистрация" })).toBeVisible();
      await demoPause(page);
    });

    await test.step("Просмотр каталога без авторизации", async () => {
      await page.goto(hashRoute("/catalog"));
      await expect(page).toHaveURL(/\/catalog/);
      await page.getByRole("button", { name: "Заказы" }).click();
      await demoPause(page);
      await page.getByRole("button", { name: "Услуги" }).click();
      await demoPause(page);
    });

    await test.step("Попытка личного кабинета — требуется вход", async () => {
      await page.goto(hashRoute("/my-items"));
      await expect(page.getByText(/Требуется авторизация|Войти/i).first()).toBeVisible({
        timeout: 10_000,
      });
      await demoPause(page);
    });

    await test.step("Регистрация: шаги 1–2 (роли и почта)", async () => {
      await demonstrateRegistration(page);
    });

    await test.step("Вход под демо-заказчиком", async () => {
      await loginViaUI(page, "customer", { fromHome: false });
      await expect(
        page.getByRole("link", { name: /Новый заказ|Разместить заказ/i }).first()
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });
  });
});
