import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  customerOrderPayload,
  disputePayload,
  executerResumePayload,
  supportTicketPayload,
} from "../helpers/demo-data.js";
import {
  createOpenOrder,
  createOrderApplication,
  createSupportTicket,
  rejectApplication,
  updateTicketStatus,
} from "../helpers/api.js";
import { dismissAppAlert } from "../helpers/dialog.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 9: менеджер — тикеты, споры, резюме", () => {
  test("тикеты, список споров, разрешение спора, модерация резюме", async ({
    page,
    request,
  }) => {
    const ticket = supportTicketPayload();
    const createdTicket = await createSupportTicket(
      request,
      ticket.subject,
      ticket.description
    );

    const orderData = customerOrderPayload("copywriting");
    const order = await createOpenOrder(
      request,
      orderData.title,
      orderData.description,
      Number(orderData.budget),
      orderData.categoryId
    );
    const app = await createOrderApplication(request, order.id);
    await rejectApplication(request, app.id);

    await logoutViaUI(page);
    await loginViaUI(page, "executer", { fromHome: false });
    await page.goto(hashRoute(`/orders/${order.id}`));
    await page.getByRole("button", { name: "Начать спор" }).click();
    const dispute = disputePayload();
    await page.getByPlaceholder("Причина спора").fill(dispute.reason);
    await page.getByPlaceholder("Комментарий (необязательно)").fill(dispute.description);
    await page.getByRole("button", { name: "Отправить спор" }).click();
    await expect(
      page.getByText("Спор открыт. Менеджер подключится к рассмотрению.")
    ).toBeVisible({ timeout: 15_000 });
    await dismissAppAlert(page);

    await logoutViaUI(page);
    await loginViaUI(page, "manager", { fromHome: false });

    await test.step("Список и просмотр тикета, смена статуса", async () => {
      const ticketsLink = page.getByRole("link", { name: /ТИКЕТЫ/i });
      if (await ticketsLink.isVisible().catch(() => false)) {
        await ticketsLink.click();
      } else {
        await page.goto(hashRoute("/manager/tickets"));
      }
      await page.waitForURL(/\/manager\/tickets/);
      await expect(
        page.getByRole("heading", { name: "Тикеты помощи", level: 1 })
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);

      await page.goto(hashRoute(`/manager/tickets/${createdTicket.id}`));
      await expect(page.getByText(ticket.subject)).toBeVisible();

      await updateTicketStatus(request, createdTicket.id, "in_progress");
      await page.reload();
      await expect(page.locator("button").filter({ hasText: /В работе|in_progress/i })).toBeVisible({
        timeout: 10_000,
      });

      await updateTicketStatus(request, createdTicket.id, "resolved");
      await page.reload();
      await expect(page.locator("button").filter({ hasText: /Решен|resolved/i })).toBeVisible({
        timeout: 10_000,
      });
      await demoPause(page);
    });

    await test.step("Список споров и разрешение", async () => {
      await page.goto(hashRoute("/manager/disputes"));
      await expect(
        page.getByRole("heading", { name: "Споры и арбитраж" })
      ).toBeVisible({ timeout: 15_000 });

      const row = page.locator("tbody tr").filter({ hasText: `Заказ #${order.id}` }).first();
      await expect(row).toBeVisible({ timeout: 15_000 });
      const link = row.getByRole("link").first();
      const href = await link.getAttribute("href");
      const disputeId = href?.match(/disputes\/(\d+)/)?.[1];
      expect(disputeId).toBeTruthy();

      await page.goto(hashRoute(`/manager/disputes/${disputeId}`));
      await expect(page.getByText(`Спор #${disputeId}`)).toBeVisible();
      await page.locator("select").selectOption("executer_wins");
      await page.getByPlaceholder("Объясните решение...").fill("E2E: пересмотр отклонения.");
      await page.getByRole("button", { name: "Разрешить спор" }).click();
      await expect(page.getByText("Спор успешно разрешен")).toBeVisible({
        timeout: 15_000,
      });
      await demoPause(page);
    });

    await test.step("Модерация резюме", async () => {
      const resume = executerResumePayload();
      await page.goto(hashRoute("/manager/resumes"));
      await expect(
        page.getByRole("heading", { name: "Модерация резюме" })
      ).toBeVisible({ timeout: 15_000 });

      const row = page.locator("tbody tr").filter({ hasText: resume.title.split("(")[0].trim() });
      if (await row.first().isVisible().catch(() => false)) {
        await row.first().getByRole("button", { name: "Одобрить" }).click();
        await demoPause(page);
      }
    });

    await test.step("Модерация услуг (просмотр раздела)", async () => {
      await page.goto(hashRoute("/manager/services"));
      await expect(page.getByRole("heading", { name: "Модерация услуг" })).toBeVisible({
        timeout: 15_000,
      });
      await demoPause(page);
    });
  });
});
