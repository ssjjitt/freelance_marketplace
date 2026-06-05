import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashRoute } from "./helpers/routes.js";
import { USERS } from "./helpers/credentials.js";
import { createOpenOrder, createOrderApplication } from "./helpers/api.js";

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const CUSTOMER_STATE = path.join(E2E_DIR, "playwright/.auth/customer.json");
const EXECUTER_STATE = path.join(E2E_DIR, "playwright/.auth/executer.json");

/**
 * Тест 3: связка ролей — одобрение отклика, уведомление исполнителю, автосоздание чата.
 */
test.describe("Тест 3: взаимодействие заказчик ↔ исполнитель", () => {
  test("одобрение отклика, уведомление, чат", async ({ browser, request }) => {
    const orderTitle = `E2E связка ${Date.now()}`;
    const order = await createOpenOrder(request, orderTitle);
    const application = await createOrderApplication(request, order.id);

    const customerContext = await browser.newContext({
      storageState: CUSTOMER_STATE,
    });
    const executerContext = await browser.newContext({
      storageState: EXECUTER_STATE,
    });
    const customerPage = await customerContext.newPage();
    const executerPage = await executerContext.newPage();

    try {
      await test.step("Заказчик одобряет отклик", async () => {
        await customerPage.goto(hashRoute(`/orders/${order.id}`));
        await expect(
          customerPage.getByRole("heading", { level: 1, name: orderTitle })
        ).toBeVisible();

        const applicationCard = customerPage
          .locator(".border.border-white\\/10.rounded-xl")
          .filter({ hasText: USERS.executer.username });
        await expect(applicationCard).toBeVisible();
        await expect(applicationCard.getByText("Ожидает")).toBeVisible();

        await applicationCard.getByRole("button", { name: "Одобрить" }).click();
        await expect(applicationCard.getByText("Одобрен")).toBeVisible({
          timeout: 15_000,
        });
      });

      await test.step("Исполнитель: уведомление application_approved", async () => {
        await executerPage.goto(hashRoute("/notifications"));
        await expect(
          executerPage.getByRole("heading", { name: "Оповещения" })
        ).toBeVisible();

        const approvalNotice = executerPage
          .locator("article")
          .filter({ hasText: "Ваш отклик одобрен" })
          .filter({ hasText: orderTitle });
        await expect(approvalNotice).toBeVisible({ timeout: 15_000 });
      });

      await test.step("Исполнитель: чат с заказчиком после одобрения", async () => {
        await executerPage.goto(hashRoute("/chats"));
        await expect(
          executerPage.getByRole("heading", { name: "Чаты" })
        ).toBeVisible();

        const chatWithCustomer = executerPage
          .locator(".chat-list-item")
          .filter({ hasText: USERS.customer.username });
        await expect(chatWithCustomer).toBeVisible({ timeout: 15_000 });

        await chatWithCustomer.click();

        await expect(
          executerPage.getByText(
            new RegExp(`Отклик #${application.id} одобрен`, "i")
          )
        ).toBeVisible({ timeout: 15_000 });
        await expect(
          executerPage.locator(".chat-main-header").getByText(USERS.customer.username)
        ).toBeVisible();
      });
    } finally {
      await customerContext.close();
      await executerContext.close();
    }
  });
});
