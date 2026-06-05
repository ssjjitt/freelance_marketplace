import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { customerOrderPayload } from "../helpers/demo-data.js";
import { createOpenOrder } from "../helpers/api.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

const MODERATION_TARGET_USER = "antikvar";

test.describe("Демо 4: панель менеджера", () => {
  test("вход → модерация заказа → блокировка пользователя", async ({
    page,
    request,
  }) => {
    const order = customerOrderPayload("design");
    const created = await createOpenOrder(
      request,
      order.title,
      order.description,
      Number(order.budget),
      order.categoryId
    );

    await test.step("Вход менеджера", async () => {
      await logoutViaUI(page);
      await loginViaUI(page, "manager");
      await expect(page).toHaveURL(/\/manager/);
      await expect(page.getByRole("heading", { name: /Панель менеджера/i })).toBeVisible();
      await demoPause(page);
    });

    await test.step("Модерация заказов: бейдж доверия", async () => {
      await page.goto(hashRoute("/manager/orders"));
      await expect(
        page.getByRole("heading", { name: "Модерация заказов" })
      ).toBeVisible();
      await page
        .getByPlaceholder("Поиск по ID, названию, заказчику, категории, статусу...")
        .fill(created.title);
      await demoPause(page);

      const row = page.locator("tbody tr").filter({ hasText: created.title }).first();
      await row.getByRole("button", { name: "Одобрить" }).click();
      await expect(row.getByText("Одобрено менеджером")).toBeVisible({
        timeout: 15_000,
      });
      await demoPause(page);
    });

    await test.step("Управление пользователями", async () => {
      await page.goto(hashRoute("/manager/users"));
      await page
        .getByPlaceholder("Поиск по id, username, email, роли...")
        .fill(MODERATION_TARGET_USER);
      const userRow = page.locator("tbody tr").filter({
        hasText: MODERATION_TARGET_USER,
      });
      await userRow.getByRole("button", { name: "Блокировать" }).click();
      await expect(userRow.getByText("Заблокирован")).toBeVisible();
      await demoPause(page);
      await userRow.getByRole("button", { name: "Разблокировать" }).click();
      await expect(userRow.getByText("Активен")).toBeVisible();
      await demoPause(page);
    });
  });
});
