import { test, expect } from "@playwright/test";
import { hashRoute } from "./helpers/routes.js";
import { createOpenOrder } from "./helpers/api.js";

/**
 * Тест 2: путь исполнителя — резюме, отклик на заказ из каталога, история откликов.
 */
test.describe("Тест 2: путь исполнителя", () => {
  test("резюме, отклик из каталога, история", async ({ page, request }) => {
    const resumeTitle = `E2E резюме ${Date.now()}`;
    const orderTitle = `E2E отклик ${Date.now()}`;

    await test.step("Создание резюме", async () => {
      await page.goto(hashRoute("/resumes/new"));
      await expect(
        page.getByRole("heading", { name: "Создать резюме" })
      ).toBeVisible();

      await page.getByRole("textbox", { name: "Название" }).fill(resumeTitle);
      await page.getByRole("textbox", { name: "Описание" }).fill(
        "Портфолио и опыт для демонстрации e2e-теста исполнителя."
      );
      await page
        .getByRole("textbox", { name: "Опыт работы" })
        .fill("3+ года веб-разработки, React, TypeScript.");
      await page
        .getByRole("textbox", { name: "Образование" })
        .fill("Высшее техническое.");

      await page.getByRole("button", { name: "Создать", exact: true }).click();
      await expect(page.getByText("Резюме создано и отправлено на модерацию")).toBeVisible({
        timeout: 15_000,
      });
    });

    const order = await test.step("Подготовка открытого заказа (API)", async () => {
      return createOpenOrder(request, orderTitle);
    });

    await test.step("Отклик через каталог", async () => {
      await page.goto(hashRoute("/catalog"));
      await page.getByRole("button", { name: "Заказы" }).click();

      const card = page.locator(".catalog-card").filter({ hasText: orderTitle });
      await expect(card).toBeVisible({ timeout: 15_000 });
      // Каталог перерисовывается при догрузке — переход по id стабильнее клика «Подробнее»
      await page.goto(hashRoute(`/orders/${order.id}`));
      await expect(page).toHaveURL(new RegExp(`/orders/${order.id}`));
      await page.getByRole("button", { name: "Откликнуться на заказ" }).click();

      const applicationForm = page.locator("form.form-panel").filter({
        has: page.getByRole("heading", { name: "Откликнуться" }),
      });
      await applicationForm
        .getByRole("textbox", { name: "Сообщение" })
        .fill("Готов выполнить в срок, есть релевантный опыт.");
      await applicationForm
        .getByRole("spinbutton", { name: "Предложенная цена (BYN)" })
        .fill("480");
      await applicationForm
        .getByRole("button", { name: "Откликнуться", exact: true })
        .click();

      await expect(page.getByText("Вы откликнулись на этот заказ")).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("История откликов", async () => {
      await page.goto(hashRoute("/applications/history"));
      await expect(page.getByRole("heading", { name: "Мои отклики" })).toBeVisible();

      const entry = page.locator(".panel-surface").filter({ hasText: orderTitle });
      await expect(entry).toBeVisible({ timeout: 15_000 });
      await expect(entry.getByText(/На рассмотрении/i)).toBeVisible();
    });
  });
});
