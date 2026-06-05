import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { adminBroadcastPayload } from "../helpers/demo-data.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 5: администратор", () => {
  test("вход → статистика → рассылка → проверка у заказчика", async ({
    page,
    browser,
  }) => {
    const broadcast = adminBroadcastPayload();

    await test.step("Вход администратора", async () => {
      await logoutViaUI(page);
      await loginViaUI(page, "admin");
      await expect(
        page.getByRole("heading", { name: "Статистика платформы" })
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Счётчики платформы", async () => {
      const panel = page
        .locator(".form-panel")
        .filter({ hasText: "Статистика платформы" });
      await expect(panel.getByText("Пользователей", { exact: true })).toBeVisible();
      await expect(panel.getByText("Заказов", { exact: true })).toBeVisible();
      await expect
        .poll(async () => Number((await panel.locator(".text-4xl.font-bold").first().textContent()) ?? 0))
        .toBeGreaterThan(0);
      await demoPause(page);
    });

    await test.step("Массовое уведомление", async () => {
      const notify = page.locator(".panel-surface").filter({ hasText: "Уведомление всем" });
      await notify.getByPlaceholder("Заголовок").fill(broadcast.title);
      await notify.getByPlaceholder("Сообщение").fill(broadcast.message);
      await demoPause(page);
      await notify.getByRole("button", { name: "Отправить" }).click();
      await expect(
        page.getByText("Уведомление отправлено всем пользователям")
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Заказчик видит рассылку", async () => {
      const ctx = await browser.newContext();
      const customerPage = await ctx.newPage();
      try {
        await loginViaUI(customerPage, "customer");
        await customerPage.goto(hashRoute("/notifications"));
        await expect(
          customerPage.locator("article").filter({ hasText: broadcast.title }).first()
        ).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);
      } finally {
        await ctx.close();
      }
    });
  });
});
