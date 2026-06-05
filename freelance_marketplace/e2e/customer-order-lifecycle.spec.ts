import { test, expect } from "@playwright/test";
import { hashRoute } from "./helpers/routes.js";
import { confirmAppDialog } from "./helpers/dialog.js";

/**
 * Тест 1: путь заказчика — создание заказа, проверка в «Мои заказы», завершение сделки.
 * Требует: frontend (5174), backend (8080), БД с учёткой customer / Qwert123_.
 * Авторизация через storageState (проект customer в playwright.config).
 */
test.describe("Тест 1: путь заказчика", () => {
  test("создание заказа, список my-items, завершение", async ({ page }) => {
    const uniqueTitle = `E2E заказ ${Date.now()}`;
    const description =
      "Автотест диплома: проверка полного цикла заказа заказчиком.";
    const budget = "250";
    const deadline = futureDateIso(14);
    let orderId = 0;

    await test.step("Создание заказа", async () => {
      await page.goto(hashRoute("/orders/new"));
      await expect(
        page.getByRole("heading", { name: "Создать заказ" })
      ).toBeVisible();

      await page.getByRole("textbox", { name: "Название" }).fill(uniqueTitle);
      await page.getByRole("textbox", { name: "Описание" }).fill(description);
      await page.getByRole("spinbutton", { name: "Бюджет (BYN)" }).fill(budget);
      await page.getByRole("textbox", { name: "Срок выполнения" }).fill(deadline);

      await page.getByRole("button", { name: "Категория" }).click();
      await page
        .locator("button.dropdown-item")
        .filter({ hasText: "Веб-разработка" })
        .click();

      await page.getByRole("button", { name: "Создать", exact: true }).click();
      await expect(page.getByText("Заказ создан")).toBeVisible({
        timeout: 15_000,
      });
      // OrderForm через ~1 с уходит в каталог — дождаться, чтобы редирект не сбил следующие шаги
      await page.waitForURL(/\/catalog/, { timeout: 10_000 });
    });

    await test.step("Заказ в «Мои заказы»", async () => {
      await page.goto(hashRoute("/my-items"));
      await expect(
        page.getByRole("heading", { name: "Мои заказы и услуги" })
      ).toBeVisible();

      const card = page.locator(".panel-surface").filter({
        hasText: uniqueTitle,
      });
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(card.locator(".badge-open")).toHaveText("Открыт");

      await card.getByRole("link", { name: "Открыть" }).click();
      await expect(page).toHaveURL(/\/orders\/\d+/);
      const idMatch = page.url().match(/\/orders\/(\d+)/);
      orderId = Number(idMatch?.[1] ?? 0);
      expect(orderId).toBeGreaterThan(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        uniqueTitle
      );
    });

    await test.step("Завершение заказа", async () => {
      await page.goto(hashRoute(`/orders/${orderId}`));
      await expect(page.getByRole("heading", { level: 1, name: uniqueTitle })).toBeVisible();

      await page.getByRole("button", { name: "Завершить заказ" }).click();
      await confirmAppDialog(page);

      const statusBadge = page
        .locator(".panel-surface")
        .filter({ has: page.getByRole("heading", { level: 1, name: uniqueTitle }) })
        .locator("span")
        .filter({ hasText: /^Завершён$/ });
      await expect(statusBadge).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Статус в списке my-items", async () => {
      await page.goto(hashRoute("/my-items"));
      const card = page.locator(".panel-surface").filter({
        hasText: uniqueTitle,
      });
      await expect(card.locator(".badge-success")).toHaveText("Завершён");
    });
  });
});

function futureDateIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
