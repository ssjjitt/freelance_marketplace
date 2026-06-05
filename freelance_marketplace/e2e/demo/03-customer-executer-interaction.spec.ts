import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { customerOrderPayload, executerApplicationPayload } from "../helpers/demo-data.js";
import { createOpenOrder, createOrderApplication } from "../helpers/api.js";
import { USERS } from "../helpers/credentials.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 3: заказчик и исполнитель", () => {
  test("отклик → одобрение → уведомление → чат", async ({ browser, request }) => {
    const orderData = customerOrderPayload("smm");
    const appData = executerApplicationPayload();

    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    await createOrderApplication(request, order.id, appData.message, Number(appData.proposedPrice));

    const customerContext = await browser.newContext();
    const executerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    const executerPage = await executerContext.newPage();

    try {
      await test.step("Заказчик: вход и одобрение отклика", async () => {
        await loginViaUI(customerPage, "customer");
        await customerPage.goto(hashRoute(`/orders/${order.id}`));
        await expect(
          customerPage.getByRole("heading", { level: 1, name: orderData.title })
        ).toBeVisible();
        await demoPause(customerPage);

        const card = customerPage
          .locator(".border.border-white\\/10.rounded-xl")
          .filter({ hasText: USERS.executer.username });
        await card.getByRole("button", { name: "Одобрить" }).click();
        await expect(card.getByText("Одобрен")).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);
      });

      await test.step("Исполнитель: вход и уведомление", async () => {
        await logoutViaUI(executerPage);
        await loginViaUI(executerPage, "executer");
        await executerPage.goto(hashRoute("/notifications"));
        await demoPause(executerPage);

        const notice = executerPage
          .locator("article")
          .filter({ hasText: "Ваш отклик одобрен" })
          .filter({ hasText: orderData.title });
        await expect(notice.first()).toBeVisible({ timeout: 15_000 });
      });

      await test.step("Исполнитель: чат с заказчиком", async () => {
        await executerPage.goto(hashRoute("/chats"));
        const chatItem = executerPage
          .locator(".chat-list-item")
          .filter({ hasText: USERS.customer.username });
        await expect(chatItem).toBeVisible({ timeout: 15_000 });
        await chatItem.click();
        await demoPause(executerPage);

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
