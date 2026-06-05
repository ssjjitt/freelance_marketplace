import { test, expect, type Page } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { customerOrderPayload, realtimeChatMessages } from "../helpers/demo-data.js";
import {
  approveApplication,
  createOpenOrder,
  createOrderApplication,
} from "../helpers/api.js";
import { USERS } from "../helpers/credentials.js";
import { createDemoBrowserContext } from "../helpers/demo-video.js";
import { demoPause, loginViaUI } from "../helpers/demo-ui.js";

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

async function openChat(page: Page, peerUsername: string): Promise<void> {
  await page.goto(hashRoute("/chats"));
  const chatItem = page.locator(".chat-list-item").filter({ hasText: peerUsername }).first();
  await expect(chatItem).toBeVisible({ timeout: 20_000 });
  await chatItem.click();
  await expect(page.locator(".chat-main-header").getByText(peerUsername)).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(1500);
  await demoPause(page, 400);
}

async function sendChatMessage(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder("Введите сообщение...");
  await input.click();
  await input.fill(text);
  const sent = page.waitForResponse(
    (r) =>
      r.url().includes("/messages") &&
      r.request().method() === "POST" &&
      r.status() === 201
  );
  await page.getByTitle("Отправить").click();
  await sent;
  await expect(page.locator(".chat-messages-pane").getByText(text).first()).toBeVisible({
    timeout: 15_000,
  });
}

async function expectChatListPreview(
  page: Page,
  peerUsername: string,
  text: string
): Promise<void> {
  await expect(
    page.locator(".chat-list-item").filter({ hasText: peerUsername }).getByText(text)
  ).toBeVisible({ timeout: 20_000 });
  await demoPause(page, 600);
}

test.describe("Демо 14: чат в реальном времени (Socket.IO)", () => {
  test.setTimeout(300_000);

  test("заказчик и исполнитель обмениваются сообщениями без перезагрузки", async ({
    browser,
    request,
  }, testInfo) => {
    const orderData = customerOrderPayload("landing", { unique: true });
    const messages = realtimeChatMessages();

    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    const app = await createOrderApplication(request, order.id);
    await approveApplication(request, app.id);

    const customerContext = await createDemoBrowserContext(browser, testInfo, "customer");
    const executerContext = await createDemoBrowserContext(browser, testInfo, "executer");
    const customerPage = await customerContext.newPage();
    const executerPage = await executerContext.newPage();

    try {
      log("1. Вход заказчика и исполнителя (два окна браузера)");
      await loginViaUI(customerPage, "customer", { fromHome: false });
      await loginViaUI(executerPage, "executer", { fromHome: false });

      log("2. Оба участника открывают чат друг с другом");
      await openChat(customerPage, USERS.executer.username);
      await openChat(executerPage, USERS.customer.username);

      log("3. Заказчик отправляет сообщение");
      await sendChatMessage(customerPage, messages.customer);
      await demoPause(customerPage, 600);

      log("4. Исполнитель видит превью в списке чатов (WebSocket, без F5)");
      await expectChatListPreview(executerPage, USERS.customer.username, messages.customer);

      log("5. Исполнитель отвечает");
      await sendChatMessage(executerPage, messages.executer);
      await demoPause(executerPage, 600);

      log("6. Заказчик видит превью ответа в списке (WebSocket, без F5)");
      await expectChatListPreview(customerPage, USERS.executer.username, messages.executer);

      log("7. Исполнитель: push-уведомление о сообщении заказчика");
      await executerPage.goto(hashRoute("/notifications"));
      await expect(
        executerPage
          .locator("article")
          .filter({ hasText: "Новое сообщение" })
          .filter({ hasText: USERS.customer.username })
          .first()
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(executerPage);

      log("✓ Real-time чат: два окна, мгновенное обновление списка и уведомления");
    } finally {
      await customerContext.close();
      await executerContext.close();
    }
  });
});
