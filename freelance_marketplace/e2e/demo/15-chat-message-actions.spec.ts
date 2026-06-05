import { test, expect, type Locator, type Page } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  chatMessageActionsPayload,
  customerOrderPayload,
} from "../helpers/demo-data.js";
import {
  approveApplication,
  createOpenOrder,
  createOrderApplication,
} from "../helpers/api.js";
import { USERS } from "../helpers/credentials.js";
import { demoPause, loginViaUI } from "../helpers/demo-ui.js";

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

function ownMessageRow(page: Page, text: string): Locator {
  return page
    .locator(".chat-messages-pane .group.justify-end")
    .filter({ has: page.locator("p", { hasText: text }) })
    .last();
}

async function openChatWithExecuter(page: Page): Promise<void> {
  await page.goto(hashRoute("/chats"));
  const chatItem = page
    .locator(".chat-list-item")
    .filter({ hasText: USERS.executer.username })
    .first();
  await expect(chatItem).toBeVisible({ timeout: 20_000 });
  await chatItem.click();
  await expect(
    page.locator(".chat-main-header").getByText(USERS.executer.username)
  ).toBeVisible({ timeout: 15_000 });
  await demoPause(page, 400);
}

async function sendChatMessage(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder("Введите сообщение...");
  await input.fill(text);
  const sent = page.waitForResponse(
    (r) =>
      r.url().includes("/messages") &&
      r.request().method() === "POST" &&
      r.status() === 201
  );
  await page.getByTitle("Отправить").click();
  await sent;
  await expect(ownMessageRow(page, text)).toBeVisible({ timeout: 15_000 });
  await demoPause(page, 400);
}

test.describe("Демо 15: чат — редактирование и удаление сообщений", () => {
  test.setTimeout(180_000);

  test("заказчик редактирует и удаляет свои сообщения", async ({ page, request }) => {
    const texts = chatMessageActionsPayload();
    const orderData = customerOrderPayload("smm", { unique: true });

    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    const app = await createOrderApplication(request, order.id);
    await approveApplication(request, app.id);

    await loginViaUI(page, "customer", { fromHome: false });
    await openChatWithExecuter(page);

    log("1. Отправка сообщения для редактирования");
    await sendChatMessage(page, texts.toEdit);

    log("2. Редактирование сообщения");
    const editRow = ownMessageRow(page, texts.toEdit);
    await editRow.scrollIntoViewIfNeeded();
    await editRow.hover();
    await editRow.getByTitle("Редактировать").click();
    await expect(page.locator(".chat-bubble-edit textarea")).toBeVisible({
      timeout: 10_000,
    });
    await demoPause(page, 500);

    const textarea = page.locator(".chat-bubble-edit textarea");
    await textarea.fill(texts.edited);
    const saveEdit = page.waitForResponse(
      (r) =>
        r.url().includes("/chats/messages/") &&
        r.request().method() === "PUT" &&
        r.ok()
    );
    await page.locator(".chat-bubble-edit").getByRole("button", { name: "Сохранить" }).click();
    await saveEdit;
    await expect(ownMessageRow(page, texts.edited)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".chat-messages-pane").getByText(texts.toEdit)).toHaveCount(0);
    await demoPause(page, 800);

    log("3. Отправка сообщения для удаления");
    await sendChatMessage(page, texts.toDelete);

    log("4. Удаление сообщения");
    const deleteRow = ownMessageRow(page, texts.toDelete);
    await deleteRow.scrollIntoViewIfNeeded();
    await deleteRow.hover();
    const deleteMsg = page.waitForResponse(
      (r) =>
        r.url().includes("/chats/messages/") &&
        r.request().method() === "DELETE" &&
        r.ok()
    );
    await deleteRow.getByTitle("Удалить").click();
    await deleteMsg;
    await expect(page.locator(".chat-messages-pane").getByText(texts.toDelete)).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(ownMessageRow(page, texts.edited)).toBeVisible();
    await demoPause(page, 800);

    log("✓ Редактирование и удаление сообщений в чате");
  });
});
