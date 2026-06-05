import { test, expect } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import { adminSubcategoryPayload } from "../helpers/demo-data.js";
import {
  createSubcategoryAsAdmin,
  deleteCategoryAsAdmin,
  findCategoryIdByName,
} from "../helpers/api.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

test.describe("Демо 10: администратор — главная и категории", () => {
  test("главная страница, подкатегория", async ({ page, request }) => {
    const sub = adminSubcategoryPayload();
    let createdSubId = 0;

    await logoutViaUI(page);
    await loginViaUI(page, "admin");

    await test.step("Главная страница администратора", async () => {
      await page.goto(hashRoute("/"));
      await expect(
        page.getByRole("heading", { name: "Статистика платформы" })
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Создать категорию")).toBeVisible();
      await expect(page.getByText("Уведомление всем")).toBeVisible();
      await demoPause(page);
    });

    await test.step("Форма категории (без публикации)", async () => {
      const panel = page.locator(".panel-surface").filter({ hasText: "Создать категорию" });
      await panel.getByPlaceholder("Название категории").fill("Обучение и курсы");
      await panel
        .getByPlaceholder("Описание (необязательно)")
        .fill("Онлайн-курсы, вебинары и материалы для самообучения.");
      await demoPause(page);
    });

    await test.step("Создание подкатегории", async () => {
      await page.getByRole("heading", { name: "Создать подкатегорию" }).scrollIntoViewIfNeeded();
      await page.getByPlaceholder("Название подкатегории").fill(sub.name);
      await page.getByPlaceholder("Описание подкатегории").fill(sub.description);
      await demoPause(page);

      const parentId = await findCategoryIdByName(request, sub.parentName);
      createdSubId = await createSubcategoryAsAdmin(
        request,
        parentId,
        sub.name,
        sub.description
      );
      expect(createdSubId).toBeGreaterThan(0);
      await demoPause(page);
    });

    if (createdSubId > 0) {
      await test.step("Удаление тестовой подкатегории", async () => {
        await deleteCategoryAsAdmin(request, createdSubId);
      });
    }
  });
});
