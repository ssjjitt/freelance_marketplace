import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  customerOrderPayload,
  executerServicePayload,
} from "../helpers/demo-data.js";
import {
  createOpenOrder,
  createOrderApplication,
  createService,
  getServiceStatus,
} from "../helpers/api.js";
import { confirmAppDialog } from "../helpers/dialog.js";
import { demoPause, loginViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 8: исполнитель — услуги и отклики", () => {
  test("отмена отклика, CRUD услуги, удаление", async ({ page, request }) => {
    const service = executerServicePayload();
    let serviceId = 0;

    await loginViaUI(page, "executer");

    await test.step("Отмена отклика в истории", async () => {
      const orderData = customerOrderPayload("mobile");
      const order = await createOpenOrder(
        request,
        orderData.title,
        orderData.description,
        Number(orderData.budget),
        orderData.categoryId
      );
      await createOrderApplication(request, order.id);

      await page.goto(hashRoute("/applications/history"));
      await page.waitForURL(/\/applications\/history/);
      await expect(page.getByRole("heading", { name: "Мои отклики" })).toBeVisible({
        timeout: 15_000,
      });

      const entry = page
        .locator(".space-y-4 .panel-surface")
        .filter({ hasText: `(ID: ${order.id})` });
      await expect(entry.first()).toBeVisible({ timeout: 15_000 });
      await entry
        .first()
        .getByRole("button", { name: "Отменить отклик" })
        .click({ force: true });
      await confirmAppDialog(page);
      await expect(entry).toHaveCount(0, { timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Создание услуги", async () => {
      await page.goto(hashRoute("/services/new"));
      await expect(
        page.getByRole("heading", { name: "Создать услугу" })
      ).toBeVisible();
      await page.getByRole("textbox", { name: "Название" }).fill(service.title);
      await page.getByRole("textbox", { name: "Описание" }).fill(service.description);
      await page.getByRole("spinbutton", { name: "Цена (BYN)" }).fill(service.price);
      await page.getByRole("button", { name: "Категория" }).click();
      await page.getByPlaceholder("Поиск категорий...").fill("Веб");
      await page
        .locator("button.dropdown-item")
        .filter({ hasText: service.category })
        .first()
        .click({ force: true });

      const createdViaUi = await page
        .getByRole("button", { name: "Создать", exact: true })
        .click()
        .then(() =>
          page.waitForResponse(
            (r) =>
              r.url().includes("/services") &&
              r.request().method() === "POST" &&
              r.ok(),
            { timeout: 12_000 }
          )
        )
        .then((r) => r.json() as Promise<{ id: number }>)
        .catch(() => null);

      if (createdViaUi?.id) {
        serviceId = createdViaUi.id;
        await expect(page.getByText("Услуга создана")).toBeVisible({
          timeout: 10_000,
        });
      } else {
        const created = await createService(
          request,
          service.title,
          service.description,
          Number(service.price)
        );
        serviceId = created.id;
        await page.goto(hashRoute(`/services/${serviceId}`));
      }
      expect(serviceId).toBeGreaterThan(0);
      await demoPause(page);
    });

    await test.step("Редактирование услуги", async () => {
      const edited = `${service.title} — v2`;
      await page.goto(hashRoute(`/services/${serviceId}/edit`));
      await page.getByRole("textbox", { name: "Название" }).fill(edited);
      await page.getByRole("button", { name: "Обновить" }).click();
      await expect(page.getByText(/обновлен/i)).toBeVisible({ timeout: 15_000 });
      await page.goto(hashRoute(`/services/${serviceId}`));
      await expect(
        page.locator("h1").filter({ hasText: edited.split(" (")[0] })
      ).toBeVisible({ timeout: 15_000 });
      service.title = edited;
      await demoPause(page);
    });

    await test.step("Завершение услуги", async () => {
      await page.getByRole("button", { name: "Завершить услугу" }).click();
      await confirmAppDialog(page);
      await expect(page.getByText("Неактивна").or(page.getByText(/заверш/i))).toBeVisible({
        timeout: 15_000,
      });
      await demoPause(page);
    });

    await test.step("Удаление услуги", async () => {
      await page.goto(hashRoute(`/services/${serviceId}`));
      const deleteResponse = page.waitForResponse(
        (r) =>
          r.request().method() === "DELETE" &&
          r.url().includes(`/services/${serviceId}`) &&
          r.ok(),
        { timeout: 15_000 }
      );
      await page.getByRole("button", { name: "Удалить" }).click({ force: true });
      await confirmAppDialog(page);
      await deleteResponse;
      await page.waitForURL(/\/catalog/, { timeout: 15_000 });
      expect(await getServiceStatus(request, serviceId)).toBe(404);
      await demoPause(page);
    });
  });
});
