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

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

test.describe("Демо 12: менеджер — тикет и спор", () => {
  test.setTimeout(300_000);

  test("разрешение тикета поддержки и спора по заказу", async ({ page, request }) => {
    const ticket = supportTicketPayload();

    const orderData = customerOrderPayload("copywriting", { unique: true });
    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    const app = await createOrderApplication(request, order.id);
    await rejectApplication(request, app.id);

    const dispute = disputePayload();
    const resolution = managerDisputeResolutionPayload();

    log("Подготовка: заказчик создаёт тикет");
    await loginViaUI(page, "customer", { fromHome: false });
    const createdTicket = await createSupportTicketInBrowser(
      page,
      ticket.subject,
      ticket.description
    );
    await logoutViaUI(page);

    log("Подготовка: исполнитель открывает спор по заказу");
    await loginViaUI(page, "executer", { fromHome: false });
    await page.goto(hashRoute(`/orders/${order.id}`));
    await page.getByRole("button", { name: "Начать спор" }).click();
    await page.getByPlaceholder("Причина спора").fill(dispute.reason);
    await page.getByPlaceholder("Комментарий (необязательно)").fill(dispute.description);
    await page.getByRole("button", { name: "Отправить спор" }).click();
    await expect(
      page.getByText("Спор открыт. Менеджер подключится к рассмотрению.")
    ).toBeVisible({ timeout: 15_000 });
    await dismissAppAlert(page);
    await logoutViaUI(page);

    log("Вход менеджера");
    await loginViaUI(page, "manager", { fromHome: false });
    await page.goto(hashRoute("/manager"));
    await expect(page.getByRole("heading", { name: /Панель менеджера/i })).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);

    log("1. Менеджер: список тикетов поддержки");
    await page.goto(hashRoute("/manager/tickets"));
    await expect(
      page.getByRole("heading", { name: "Тикеты помощи", level: 1 })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ticket.subject).first()).toBeVisible({ timeout: 15_000 });
    await demoPause(page);

    log("2. Менеджер: просмотр тикета");
    await page.goto(hashRoute(`/manager/tickets/${createdTicket.id}`));
    await expect(page.getByText(ticket.subject)).toBeVisible();
    await expect(page.getByText(ticket.description)).toBeVisible();
    await demoPause(page);

    log("3. Менеджер: тикет «В работе»");
    await saveTicketStatus(page, "В работе");

    log("4. Менеджер: тикет «Решен»");
    await saveTicketStatus(page, "Решен");

    log("5. Менеджер: список споров");
    await page.goto(hashRoute("/manager/disputes"));
    await expect(
      page.getByRole("heading", { name: "Споры и арбитраж" })
    ).toBeVisible({ timeout: 15_000 });
    const disputeRow = page
      .locator("tbody tr")
      .filter({ hasText: `Заказ #${order.id}` })
      .first();
    await expect(disputeRow).toBeVisible({ timeout: 15_000 });
    await demoPause(page);

    log("6. Менеджер: карточка спора");
    const disputeLink = disputeRow.getByRole("link").first();
    const href = await disputeLink.getAttribute("href");
    const disputeId = href?.match(/disputes\/(\d+)/)?.[1];
    expect(disputeId).toBeTruthy();
    await disputeLink.click();
    await expect(page.getByText(`Спор #${disputeId}`)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(dispute.reason)).toBeVisible();
    await demoPause(page);

    log("7. Менеджер: разрешение спора");
    await resolveDisputeAsManager(page, disputeId!, "executer_wins", resolution.comment);
    await expect(page.getByText("Спор разрешен")).toBeVisible();
    await expect(page.getByText("Выиграл исполнитель")).toBeVisible();

    log("✓ Тикет и спор обработаны менеджером");
  });
});
