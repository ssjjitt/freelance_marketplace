import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  customerOrderPayload,
  executerApplicationPayload,
  executerResumePayload,
} from "../helpers/demo-data.js";
import { createOpenOrder } from "../helpers/api.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 2: путь исполнителя", () => {
  test("вход → резюме → каталог → отклик → история", async ({ page, request }) => {
    const resume = executerResumePayload();
    const application = executerApplicationPayload();
    const orderSeed = customerOrderPayload("crm");
    const order = await test.step("Подготовка заказа заказчика (API)", async () => {
      return createOpenOrder(
        request,
        orderSeed.title,
        orderSeed.description,
        Number(orderSeed.budget),
        orderSeed.categoryId
      );
    });

    await test.step("Вход исполнителя", async () => {
      await logoutViaUI(page);
      await loginViaUI(page, "executer");
    });

    await test.step("Создание резюме", async () => {
      await openSidebarLink(page, "Профиль");
      await demoPause(page);
      await page.goto(hashRoute("/resumes/new"));
      await expect(
        page.getByRole("heading", { name: "Создать резюме" })
      ).toBeVisible();

      await page.getByRole("textbox", { name: "Название" }).fill(resume.title);
      await page.getByRole("textbox", { name: "Описание" }).fill(resume.description);
      await page.getByRole("textbox", { name: "Опыт работы" }).fill(resume.experience);
      await page.getByRole("textbox", { name: "Образование" }).fill(resume.education);
      await demoPause(page);

      await page.getByRole("button", { name: "Создать", exact: true }).click();
      await expect(
        page.getByText("Резюме создано и отправлено на модерацию")
      ).toBeVisible({ timeout: 15_000 });
      await page.waitForURL(/\/profile/, { timeout: 10_000 }).catch(() => {});
      await demoPause(page);
    });

    await test.step("Каталог: поиск заказа и отклик", async () => {
      await page.goto(hashRoute("/catalog"));
      await page.getByRole("button", { name: "Заказы" }).click();
      await demoPause(page);

      const card = page.locator(".catalog-card").filter({ hasText: orderSeed.title }).first();
      await expect(card).toBeVisible({ timeout: 15_000 });
      await demoPause(page);

      await page.goto(hashRoute(`/orders/${order.id}`));
      await page.getByRole("button", { name: "Откликнуться на заказ" }).click();

      const form = page.locator("form.form-panel").filter({
        has: page.getByRole("heading", { name: "Откликнуться" }),
      });
      await form.getByRole("textbox", { name: "Сообщение" }).fill(application.message);
      await form
        .getByRole("spinbutton", { name: "Предложенная цена (BYN)" })
        .fill(application.proposedPrice);
      await demoPause(page);
      await form.getByRole("button", { name: "Откликнуться", exact: true }).click();

      await expect(page.getByText("Вы откликнулись на этот заказ")).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("История откликов", async () => {
      await page.goto(hashRoute("/applications/history"));
      await expect(page.getByRole("heading", { name: "Мои отклики" })).toBeVisible({
        timeout: 15_000,
      });

      const entry = page.locator(".panel-surface").filter({ hasText: orderSeed.title }).first();
      await expect(entry).toBeVisible();
      await expect(entry.getByText(/На рассмотрении/i)).toBeVisible();
      await demoPause(page);
    });
  });
});

async function openSidebarLink(page: import("@playwright/test").Page, name: string) {
  await page.locator("header.navbar button").first().click();
  await page.getByRole("link", { name }).click();
  await demoPause(page, 200);
}
