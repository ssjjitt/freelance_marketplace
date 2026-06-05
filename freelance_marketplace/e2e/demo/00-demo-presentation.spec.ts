import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { customerOrderPayload, executerApplicationPayload } from "../helpers/demo-data.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";
import { openSidebarLink } from "../helpers/demo-navigation.js";

test.describe("Демо: презентация основного пути", () => {
  test("гость → заказчик → заказ → исполнитель → отклик", async ({ browser }) => {
    const order = customerOrderPayload("landing", { unique: true });
    const application = executerApplicationPayload();

    const customerContext = await browser.newContext();
    const executerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    const executerPage = await executerContext.newPage();

    try {
      await test.step("Гость: главная, каталог и защита личного кабинета", async () => {
        await customerPage.goto(hashRoute("/"));
        await expect(customerPage.getByText("Freelance Маркетплейс")).toBeVisible({
          timeout: 15_000,
        });
        await expect(customerPage.getByRole("link", { name: "Войти" })).toBeVisible();
        await expect(customerPage.getByRole("link", { name: "Регистрация" })).toBeVisible();
        await demoPause(customerPage);

        await customerPage.goto(hashRoute("/catalog"));
        await customerPage.getByRole("button", { name: "Заказы" }).click();
        await demoPause(customerPage);
        await customerPage.getByRole("button", { name: "Услуги" }).click();
        await demoPause(customerPage);

        await customerPage.goto(hashRoute("/my-items"));
        await expect(
          customerPage.getByText(/Требуется авторизация|Войти/i).first()
        ).toBeVisible({ timeout: 10_000 });
        await demoPause(customerPage);
      });

      await test.step("Заказчик: вход и публикация заказа", async () => {
        await loginViaUI(customerPage, "customer");

        await customerPage.goto(hashRoute("/"));
        await expect(
          customerPage.getByRole("link", { name: "Разместить заказ" })
        ).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);

        await customerPage.getByRole("link", { name: "Разместить заказ" }).click();
        await expect(
          customerPage.getByRole("heading", { name: "Создать заказ" })
        ).toBeVisible({ timeout: 15_000 });

        await customerPage.getByRole("textbox", { name: "Название" }).fill(order.title);
        await customerPage.getByRole("textbox", { name: "Описание" }).fill(order.description);
        await customerPage.getByRole("spinbutton", { name: "Бюджет (BYN)" }).fill(order.budget);
        await customerPage.getByRole("textbox", { name: "Срок выполнения" }).fill(order.deadline);
        await demoPause(customerPage);

        await customerPage.getByRole("button", { name: "Категория" }).click();
        await customerPage
          .locator("button.dropdown-item")
          .filter({ hasText: order.category })
          .click();
        await demoPause(customerPage);

        await customerPage.getByRole("button", { name: "Создать", exact: true }).click();
        await expect(customerPage.getByText("Заказ создан")).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);
      });

      await test.step("Заказчик: проверка заказа в моих заказах", async () => {
        await openSidebarLink(customerPage, "Управление заказами/услугами");

        const card = customerPage
          .locator(".panel-surface")
          .filter({ hasText: order.title })
          .first();
        await expect(card).toBeVisible({ timeout: 15_000 });
        await expect(card.locator(".badge-open")).toHaveText("Открыт");
        await demoPause(customerPage);
      });

      await test.step("Исполнитель: вход, каталог и отклик на заказ", async () => {
        await loginViaUI(executerPage, "executer");

        await executerPage.goto(hashRoute("/catalog"));
        await executerPage.getByRole("button", { name: "Заказы" }).click();
        await demoPause(executerPage);

        const card = executerPage
          .locator(".catalog-card")
          .filter({ hasText: order.title })
          .first();
        await expect(card).toBeVisible({ timeout: 15_000 });
        await demoPause(executerPage);

        await card.getByRole("link", { name: "Открыть" }).click();
        await expect(
          executerPage.getByRole("heading", { level: 1, name: order.title })
        ).toBeVisible({ timeout: 15_000 });
        await demoPause(executerPage);

        await executerPage.getByRole("button", { name: "Откликнуться на заказ" }).click();
        const form = executerPage.locator("form.form-panel").filter({
          has: executerPage.getByRole("heading", { name: "Откликнуться" }),
        });
        await form.getByRole("textbox", { name: "Сообщение" }).fill(application.message);
        await form
          .getByRole("spinbutton", { name: "Предложенная цена (BYN)" })
          .fill(application.proposedPrice);
        await demoPause(executerPage);

        await form.getByRole("button", { name: "Откликнуться", exact: true }).click();
        await expect(executerPage.getByText("Вы откликнулись на этот заказ")).toBeVisible({ timeout: 15_000 });
        await demoPause(executerPage);
      });

      await test.step("Заказчик: вход назад и проверка отклика", async () => {
        await logoutViaUI(customerPage);
        await loginViaUI(customerPage, "customer");

        await openSidebarLink(customerPage, "Управление заказами/услугами");

        const card = customerPage
          .locator(".panel-surface")
          .filter({ hasText: order.title })
          .first();
        await card.getByRole("link", { name: "Открыть" }).click();
        await expect(
          customerPage.getByRole("heading", { level: 1, name: order.title })
        ).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);

        await expect(customerPage.getByRole("heading", { name: /Отклики/i })).toBeVisible({ timeout: 15_000 });

        const applicationCard = customerPage
          .locator(".border.border-white\\/10.rounded-xl")
          .filter({ hasText: application.message });
        await expect(applicationCard).toBeVisible({ timeout: 15_000 });
        await demoPause(customerPage);
      });
    } finally {
      await customerContext.close();
      await executerContext.close();
    }
  });
});
