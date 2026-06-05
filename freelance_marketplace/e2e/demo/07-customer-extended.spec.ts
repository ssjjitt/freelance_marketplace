import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  customerOrderPayload,
  DEMO_AUX_ORDER_TITLES,
  reportPayload,
  reviewPayload,
} from "../helpers/demo-data.js";
import {
  approveApplication,
  createOpenOrder,
  createOrderApplication,
  getAuthUserId,
} from "../helpers/api.js";
import { confirmAppDialog, dismissAppAlert, fillAppDialogPrompt } from "../helpers/dialog.js";
import { USERS } from "../helpers/credentials.js";
import { demoPause, loginViaUI, openSidebarLink } from "../helpers/demo-ui.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarFixture = path.join(__dirname, "../fixtures/avatar-1x1.png");

test.describe("Демо 7: заказчик — расширенные сценарии", () => {
  test("редактирование, отклики, отзыв, жалоба, избранное, профиль", async ({
    page,
    request,
  }) => {
    const order = customerOrderPayload("accounting");
    const created = await createOpenOrder(
      request,
      order.title,
      order.description,
      Number(order.budget),
      order.categoryId
    );
    const app = await createOrderApplication(request, created.id);
    const executerId = await getAuthUserId(request, USERS.executer.username);

    await loginViaUI(page, "customer");

    await test.step("Редактирование заказа", async () => {
      const editedTitle = `${order.title} — правка`;
      await page.goto(hashRoute(`/orders/${created.id}/edit`));
      await expect(
        page.getByRole("heading", { name: "Редактировать заказ" })
      ).toBeVisible();
      await page.getByRole("textbox", { name: "Название" }).fill(editedTitle);
      await page.getByRole("button", { name: "Обновить" }).click();
      await expect(page.getByText("Заказ обновлен")).toBeVisible({
        timeout: 15_000,
      });
      await page.goto(hashRoute(`/orders/${created.id}`));
      await expect(
        page.getByRole("heading", { level: 1, name: editedTitle })
      ).toBeVisible();
      await demoPause(page);
    });

    await test.step("Просмотр и отклонение отклика", async () => {
      await page.goto(hashRoute(`/orders/${created.id}`));
      await expect(page.getByRole("heading", { name: /Отклики/i })).toBeVisible();
      const card = page
        .locator(".border.border-white\\/10.rounded-xl")
        .filter({ hasText: USERS.executer.username });
      await card.getByRole("button", { name: "Отклонить" }).click();
      await expect(card.getByText("Отклонен")).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Жалоба на заказ (вход исполнителя)", async () => {
      const foreign = await createOpenOrder(
        request,
        DEMO_AUX_ORDER_TITLES.complaint,
        "Заказ для проверки жалобы",
        300
      );
      await page.goto(hashRoute("/"));
      await page.locator("header.navbar button").first().click();
      await page.getByRole("button", { name: "Выйти" }).click();
      await page.waitForURL(/login/);
      await loginViaUI(page, "executer", { fromHome: false });

      await page.goto(hashRoute(`/orders/${foreign.id}`));
      await page.getByRole("button", { name: "Пожаловаться на заказ" }).click();
      await fillAppDialogPrompt(page, reportPayload().reason);
      await expect(page.getByText("Жалоба отправлена менеджеру")).toBeVisible({
        timeout: 15_000,
      });
      await dismissAppAlert(page);
      await loginViaUI(page, "customer", { fromHome: false });
    });

    await test.step("Избранное: добавить и удалить исполнителя", async () => {
      await page.goto(hashRoute(`/profile/${executerId}`));
      await page.getByRole("button", { name: "В избранное" }).click();
      await expect(page.getByText("В избранном")).toBeVisible({ timeout: 10_000 });
      await demoPause(page);

      await openSidebarLink(page, "Избранное");
      const row = page.locator(".panel-surface").filter({
        hasText: USERS.executer.username,
      });
      await expect(row.first()).toBeVisible();
      await row.first().getByTitle("Удалить из избранного").click();
      await confirmAppDialog(page);
      await demoPause(page);
    });

    await test.step("Редактирование профиля", async () => {
      await page.goto(hashRoute("/profile/edit"));
      await expect(
        page.getByRole("heading", { name: "Профиль пользователя" })
      ).toBeVisible();
      await page.getByRole("textbox", { name: "Город" }).fill("Минск");
      await page.getByRole("button", { name: "Сохранить изменения" }).click();
      await expect(page.getByText("Профиль успешно обновлен")).toBeVisible({
        timeout: 15_000,
      });
      await demoPause(page);
    });

    await test.step("Изменение аватара", async () => {
      await page.goto(hashRoute("/profile"));
      await page.getByTitle("Изменить аватар").click();
      await expect(page.getByText("Редактор аватара")).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(avatarFixture);
      await demoPause(page, 400);
      await page.getByRole("button", { name: "Сохранить" }).last().click();
      await expect(page.getByText("Редактор аватара")).toBeHidden({
        timeout: 20_000,
      });
      await demoPause(page);
    });

    await test.step("Одобрение, завершение и отзыв", async () => {
      const reviewOrder = await createOpenOrder(
        request,
        DEMO_AUX_ORDER_TITLES.review,
        "Заказ для отзыва после завершения",
        600
      );
      const reviewApp = await createOrderApplication(request, reviewOrder.id);
      await approveApplication(request, reviewApp.id);

      await page.goto(hashRoute(`/orders/${reviewOrder.id}`));
      await page.getByRole("button", { name: "Завершить заказ" }).click();
      await confirmAppDialog(page);
      await expect(page.getByText("Оставить отзыв")).toBeVisible({
        timeout: 15_000,
      });

      const review = reviewPayload();
      await page
        .getByRole("textbox", { name: "Комментарий" })
        .fill(review.comment);
      await page.getByRole("button", { name: "Оценить" }).click();
      await expect(page.getByText("Ваш отзыв")).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Удаление заказа", async () => {
      const toDelete = await createOpenOrder(
        request,
        DEMO_AUX_ORDER_TITLES.delete,
        "Заказ на удаление",
        100
      );
      await page.goto(hashRoute(`/orders/${toDelete.id}`));
      await page.getByRole("button", { name: "Удалить" }).click();
      await confirmAppDialog(page);
      await page.goto(hashRoute("/my-items"));
      await expect(
        page.locator(".panel-surface").filter({ hasText: toDelete.title })
      ).toHaveCount(0, { timeout: 15_000 });
      await demoPause(page);
    });

  });
});
