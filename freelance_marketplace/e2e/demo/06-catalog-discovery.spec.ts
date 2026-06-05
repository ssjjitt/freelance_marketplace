import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { SEED_CATALOG } from "../helpers/seed-fixtures.js";
import { findCatalogOrder, findCatalogService } from "../helpers/api.js";
import { demoPause, loginViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 6: каталог — поиск, категории, фильтры", () => {
  test("поиск, фильтры, сортировка, просмотр заказа и услуги", async ({
    page,
    request,
  }) => {
    const order = await findCatalogOrder(
      request,
      SEED_CATALOG.order.searchToken,
      "SPA",
      "SMM",
      "кабинет"
    );
    const service = await findCatalogService(
      request,
      SEED_CATALOG.service.searchToken,
      "Figma",
      "API",
      "NestJS"
    );

    await loginViaUI(page, "customer");

    await test.step("Каталог: вкладки и поиск", async () => {
      await page.goto(hashRoute("/catalog"));
      await expect(page.getByPlaceholder("Поиск...")).toBeVisible();
      await page.getByRole("button", { name: "Заказы" }).click();
      await demoPause(page);

      await page.getByPlaceholder("Поиск...").fill(order.title);
      await demoPause(page, 800);

      await expect(
        page.locator(`a[href="#/orders/${order.id}"]`).first()
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Категория и цена", async () => {
      const categoryBtn = page
        .locator("aside")
        .getByRole("button")
        .filter({ hasText: SEED_CATALOG.order.category })
        .first();
      if (await categoryBtn.isVisible().catch(() => false)) {
        await categoryBtn.click();
        await demoPause(page);
      }

      await page.getByPlaceholder("От").fill("100");
      await page.getByPlaceholder("До").fill("5000");
      await demoPause(page, 500);
    });

    await test.step("Сортировка: направление", async () => {
      const sortToggle = page.getByTitle(/По возрастанию|По убыванию/i);
      await expect(sortToggle).toBeVisible();
      await sortToggle.click();
      await demoPause(page);
      await sortToggle.click();
      await demoPause(page);
    });

    await test.step("Просмотр карточки заказа", async () => {
      await page.goto(hashRoute(`/orders/${order.id}`));
      await expect(
        page.locator("h1").filter({ hasText: order.title })
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });

    await test.step("Просмотр карточки услуги", async () => {
      await page.goto(hashRoute("/catalog"));
      await page.getByRole("button", { name: "Услуги" }).click();
      await page.getByPlaceholder("Поиск...").fill(service.title);
      await demoPause(page, 800);

      await page.goto(hashRoute(`/services/${service.id}`));
      await expect(
        page.locator("h1").filter({ hasText: service.title })
      ).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    });
  });
});
