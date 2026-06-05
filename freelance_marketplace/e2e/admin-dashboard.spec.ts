import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashRoute } from "./helpers/routes.js";

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const CUSTOMER_STATE = path.join(E2E_DIR, "playwright/.auth/customer.json");

/**
 * Тест 5: администратор — дашборд со счётчиками и массовая рассылка уведомлений.
 */
test.describe("Тест 5: администратор", () => {
  test("дашборд и массовая рассылка", async ({ page, browser }) => {
    const broadcastTitle = `E2E система ${Date.now()}`;
    const broadcastMessage =
      "Тестовое системное сообщение для демонстрации массовой рассылки.";

    await test.step("Админ-дашборд: счётчики платформы", async () => {
      await page.goto(hashRoute("/"));
      await expect(
        page.getByRole("heading", { name: "Статистика платформы" })
      ).toBeVisible({ timeout: 15_000 });

      const statsPanel = page
        .locator(".form-panel")
        .filter({ hasText: "Статистика платформы" });
      await expect(statsPanel.getByText("Пользователей", { exact: true })).toBeVisible();
      await expect(statsPanel.getByText("Заказов", { exact: true })).toBeVisible();
      await expect(statsPanel.getByText("Услуг", { exact: true })).toBeVisible();
      await expect(statsPanel.getByText("Активных заказов", { exact: true })).toBeVisible();

      await expect
        .poll(
          async () => {
            const usersCount = await statsPanel
              .locator(".text-4xl.font-bold")
              .first()
              .textContent();
            return Number(usersCount ?? 0);
          },
          { timeout: 10_000 }
        )
        .toBeGreaterThan(0);
    });

    await test.step("Массовая рассылка уведомлений", async () => {
      const notifyPanel = page
        .locator(".panel-surface")
        .filter({ hasText: "Уведомление всем" });
      await expect(
        notifyPanel.getByRole("heading", { name: "Уведомление всем" })
      ).toBeVisible();

      await notifyPanel.getByPlaceholder("Заголовок").fill(broadcastTitle);
      await notifyPanel.getByPlaceholder("Сообщение").fill(broadcastMessage);
      await notifyPanel.getByRole("button", { name: "Отправить" }).click();

      await expect(
        page.getByText("Уведомление отправлено всем пользователям")
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Заказчик получил системное уведомление", async () => {
      const customerContext = await browser.newContext({
        storageState: CUSTOMER_STATE,
      });
      const customerPage = await customerContext.newPage();
      try {
        await customerPage.goto(hashRoute("/notifications"));
        await expect(
          customerPage.getByRole("heading", { name: "Оповещения" })
        ).toBeVisible();

        const systemNotice = customerPage
          .locator("article")
          .filter({ hasText: broadcastTitle })
          .filter({ hasText: broadcastMessage });
        await expect(systemNotice).toBeVisible({ timeout: 15_000 });
      } finally {
        await customerContext.close();
      }
    });
  });
});
