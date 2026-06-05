import { test, expect } from "@playwright/test";
import { hashRoute } from "./helpers/routes.js";
import { createOpenOrder } from "./helpers/api.js";

/** Тестовый пользователь для блокировки (не customer/executer/manager). */
const MODERATION_TARGET_USER = "antikvar";

/**
 * Тест 4: панель менеджера — одобрение заказа (бейдж доверия) и блокировка пользователя.
 */
test.describe("Тест 4: панель менеджера", () => {
  test("модерация заказов и пользователей", async ({ page, request }) => {
    const orderTitle = `E2E модерация ${Date.now()}`;
    const order = await createOpenOrder(request, orderTitle);

    await test.step("Бейдж «Одобрено менеджером» для заказа", async () => {
      await page.goto(hashRoute("/manager/orders"));
      await expect(
        page.getByRole("heading", { name: "Модерация заказов" })
      ).toBeVisible();

      await page
        .getByPlaceholder("Поиск по ID, названию, заказчику, категории, статусу...")
        .fill(orderTitle);

      const orderRow = page.locator("tbody tr").filter({ hasText: orderTitle });
      await expect(orderRow).toBeVisible({ timeout: 15_000 });
      await orderRow.getByRole("button", { name: "Одобрить" }).click();

      await expect(orderRow.getByText("Одобрено менеджером")).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        orderRow.getByRole("button", { name: "Одобрить" })
      ).toHaveCount(0);
    });

    await test.step("Блокировка и разблокировка пользователя", async () => {
      await page.goto(hashRoute("/manager/users"));
      await expect(
        page.getByRole("heading", { name: "Управление пользователями" })
      ).toBeVisible();

      await page
        .getByPlaceholder("Поиск по id, username, email, роли...")
        .fill(MODERATION_TARGET_USER);

      const userRow = page.locator("tbody tr").filter({
        hasText: MODERATION_TARGET_USER,
      });
      await expect(userRow).toBeVisible({ timeout: 15_000 });
      await expect(userRow.getByText("Активен")).toBeVisible();

      await userRow.getByRole("button", { name: "Блокировать" }).click();
      await expect(userRow.getByText("Заблокирован")).toBeVisible({
        timeout: 15_000,
      });

      await userRow.getByRole("button", { name: "Разблокировать" }).click();
      await expect(userRow.getByText("Активен")).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});
