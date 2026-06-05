import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { confirmAppDialog } from "../helpers/dialog.js";
import { customerOrderPayload } from "../helpers/demo-data.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 1: путь заказчика", () => {
  test("вход → размещение заказа → мои заказы → завершение", async ({
    page,
  }) => {
    const order = customerOrderPayload("landing", { unique: true });
    let orderId = 0;

    await test.step("Выход и повторный вход", async () => {
      await logoutViaUI(page);
      await loginViaUI(page, "customer");
    });

    await test.step("Главная: выбор «Разместить заказ»", async () => {
      await page.goto(hashRoute("/"));
      await expect(
        page.getByRole("link", { name: "Разместить заказ" })
      ).toBeVisible();
      await demoPause(page);
      await page.getByRole("link", { name: "Разместить заказ" }).click();
      await expect(
        page.getByRole("heading", { name: "Создать заказ" })
      ).toBeVisible();
    });

    await test.step("Заполнение и публикация заказа", async () => {
      await page.getByRole("textbox", { name: "Название" }).fill(order.title);
      await page.getByRole("textbox", { name: "Описание" }).fill(order.description);
      await page.getByRole("spinbutton", { name: "Бюджет (BYN)" }).fill(order.budget);
      await page.getByRole("textbox", { name: "Срок выполнения" }).fill(order.deadline);
      await demoPause(page);

      await page.getByRole("button", { name: "Категория" }).click();
      await page
        .locator("button.dropdown-item")
        .filter({ hasText: order.category })
        .click();
      await demoPause(page);

      await page.getByRole("button", { name: "Создать", exact: true }).click();
      await expect(page.getByText("Заказ создан")).toBeVisible({ timeout: 15_000 });
      await page.waitForURL(/\/catalog/, { timeout: 10_000 });
      await demoPause(page);
    });

    await test.step("Проверка в «Мои заказы»", async () => {
      await openSidebarAndGo(page, "Управление заказами/услугами");
      await expect(
        page.getByRole("heading", { name: "Мои заказы и услуги" })
      ).toBeVisible();

      const card = page.locator(".panel-surface").filter({ hasText: order.title }).first();
      await expect(card).toBeVisible();
      await expect(card.locator(".badge-open")).toHaveText("Открыт");
      await demoPause(page);

      await card.getByRole("link", { name: "Открыть" }).click();
      const idMatch = page.url().match(/\/orders\/(\d+)/);
      orderId = Number(idMatch?.[1] ?? 0);
      expect(orderId).toBeGreaterThan(0);
    });

    await test.step("Завершение заказа", async () => {
      await page.goto(hashRoute(`/orders/${orderId}`));
      await page.getByRole("button", { name: "Завершить заказ" }).click();
      await confirmAppDialog(page);
      await expect(
        page
          .locator(".panel-surface")
          .filter({ has: page.getByRole("heading", { level: 1, name: order.title }) })
          .locator("span")
          .filter({ hasText: /^Завершён$/ })
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Статус «Завершён» в списке", async () => {
      await openSidebarAndGo(page, "Управление заказами/услугами");
      const card = page.locator(".panel-surface").filter({ hasText: order.title }).first();
      await expect(card.locator(".badge-success")).toHaveText("Завершён");
      await demoPause(page);
    });
  });
});

async function openSidebarAndGo(page: import("@playwright/test").Page, linkName: string) {
  await page.locator("header.navbar button").first().click();
  await demoPause(page, 200);
  await page.getByRole("link", { name: linkName }).click();
  await demoPause(page);
}
