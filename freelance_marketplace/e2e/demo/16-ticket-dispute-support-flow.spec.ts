import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  customerOrderPayload,
  disputePayload,
  managerDisputeResolutionPayload,
  supportTicketPayload,
} from "../helpers/demo-data.js";
import {
  createOpenOrder,
  createOrderApplication,
  rejectApplication,
} from "../helpers/api.js";
import { dismissAppAlert } from "../helpers/dialog.js";
import {
  createSupportTicketInBrowser,
  resolveDisputeAsManager,
  saveTicketStatus,
} from "../helpers/demo-support.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";
import { USERS } from "../helpers/credentials.js";

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

test.describe("Демо 16: тикет поддержки и спор — полный цикл", () => {
  test.setTimeout(600_000);

  test("заказчик → тикет → менеджер → спор → решение спора", async ({ page, request }) => {
    const ticket = supportTicketPayload();
    const dispute = disputePayload();
    const resolution = managerDisputeResolutionPayload();

    const orderData = customerOrderPayload("design", { unique: true });
    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    const app = await createOrderApplication(request, order.id);
    await rejectApplication(request, app.id);

    // ─── Часть 1: обращение в поддержку ─────────────────────────────────────
    log("1. Заказчик: вход и создание тикета поддержки");
    await loginViaUI(page, "customer", { fromHome: false });
    const createdTicket = await createSupportTicketInBrowser(
      page,
      ticket.subject,
      ticket.description
    );
    await logoutViaUI(page);

    log("2. Менеджер: рассмотрение тикета");
    await loginViaUI(page, "manager", { fromHome: false });
    await page.waitForURL(/\/manager(\/|$)/, { timeout: 15_000 });
    await page.goto(hashRoute("/manager/tickets"));
    await page.waitForURL(/\/manager\/tickets/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Тикеты помощи", level: 1 })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ticket.subject).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(USERS.customer.username).first()).toBeVisible();
    await demoPause(page);

    log("3. Менеджер: карточка тикета — описание обращения");
    await page.goto(hashRoute(`/manager/tickets/${createdTicket.id}`));
    await expect(page.getByText(ticket.subject)).toBeVisible();
    await expect(page.getByText(ticket.description)).toBeVisible();
    await expect(page.getByText(USERS.customer.username)).toBeVisible();
    await demoPause(page);

    log("4. Менеджер: тикет «В работе»");
    await saveTicketStatus(page, "В работе");

    log("5. Менеджер: тикет «Решен» (решение по обращению)");
    await saveTicketStatus(page, "Решен");
    await expect(page.locator("button.ui-select").filter({ hasText: "Решен" })).toBeVisible();
    await logoutViaUI(page);

    // ─── Часть 2: спор по заказу ────────────────────────────────────────────
    log("6. Исполнитель: открытие спора по отклонённому отклику");
    await loginViaUI(page, "executer", { fromHome: false });
    await page.goto(hashRoute(`/orders/${order.id}`));
    await expect(page.getByRole("heading", { level: 1, name: orderData.title })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Начать спор" }).click();
    await page.getByPlaceholder("Причина спора").fill(dispute.reason);
    await page.getByPlaceholder("Комментарий (необязательно)").fill(dispute.description);
    await page.getByRole("button", { name: "Отправить спор" }).click();
    await expect(
      page.getByText("Спор открыт. Менеджер подключится к рассмотрению.")
    ).toBeVisible({ timeout: 15_000 });
    await dismissAppAlert(page);
    await logoutViaUI(page);

    log("7. Менеджер: список споров");
    await loginViaUI(page, "manager", { fromHome: false });
    await page.waitForURL(/\/manager(\/|$)/, { timeout: 15_000 });
    await page.goto(hashRoute("/manager/disputes"));
    await page.waitForURL(/\/manager\/disputes/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Споры и арбитраж" })
    ).toBeVisible({ timeout: 15_000 });
    const disputeRow = page
      .locator("tbody tr")
      .filter({ hasText: `Заказ #${order.id}` })
      .first();
    await expect(disputeRow).toBeVisible({ timeout: 15_000 });
    await expect(disputeRow.getByText(dispute.reason)).toBeVisible();
    await demoPause(page);

    log("8. Менеджер: карточка спора — детали");
    const disputeLink = disputeRow.getByRole("link").first();
    const href = await disputeLink.getAttribute("href");
    const disputeId = href?.match(/disputes\/(\d+)/)?.[1];
    expect(disputeId).toBeTruthy();
    await disputeLink.click();
    await expect(page.getByText(`Спор #${disputeId}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(dispute.reason)).toBeVisible();
    await expect(page.getByText(dispute.description)).toBeVisible();
    await demoPause(page);

    log("9. Менеджер: разрешение спора (решение в пользу исполнителя)");
    await resolveDisputeAsManager(page, disputeId!, "executer_wins", resolution.comment);
    await expect(page.getByText("Спор разрешен")).toBeVisible();
    await expect(page.getByText("Выиграл исполнитель")).toBeVisible();

    log("✓ Тикет поддержки и спор обработаны менеджером");
  });
});
