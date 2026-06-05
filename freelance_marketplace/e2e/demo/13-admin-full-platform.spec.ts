import { test, expect, type Page } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  adminBroadcastPayload,
  adminCategoryPayload,
  adminSubcategoryPayload,
} from "../helpers/demo-data.js";
import {
  deleteCategoryAsAdmin,
  findCategoryIdByName,
} from "../helpers/api.js";
import { demoPause, loginViaUI, logoutViaUI } from "../helpers/demo-ui.js";

const MODERATION_TARGET_USER = "antikvar";

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

async function pickParentCategory(page: Page, label: string): Promise<void> {
  await page
    .locator("form")
    .filter({ hasText: "Создать подкатегорию" })
    .getByRole("button")
    .filter({ hasText: /Выберите категорию|Разработка/i })
    .first()
    .click();
  await page.locator("button.dropdown-item").filter({ hasText: label }).last().click();
}

test.describe("Демо 13: администратор — полный обзор", () => {
  test.setTimeout(600_000);

  test("дашборд, категории, модерация, пользователи, рассылка", async ({
    page,
    request,
  }) => {
    const broadcast = adminBroadcastPayload();
    const category = adminCategoryPayload();
    const subcategory = adminSubcategoryPayload();
    subcategory.name = `${subcategory.name} (${Date.now().toString(36).slice(-4)})`;

    let createdCategoryId = 0;
    let createdSubId = 0;

    await logoutViaUI(page);
    await loginViaUI(page, "admin");

    log("1. Админ: дашборд — статистика платформы");
    await expect(
      page.getByRole("heading", { name: "Статистика платформы" })
    ).toBeVisible({ timeout: 15_000 });
    const statsPanel = page.locator(".form-panel").filter({ hasText: "Статистика платформы" });
    for (const label of ["Пользователей", "Заказов", "Услуг", "Активных заказов"]) {
      await expect(statsPanel.getByText(label, { exact: true })).toBeVisible();
    }
    await expect
      .poll(async () => Number((await statsPanel.locator(".text-4xl.font-bold").first().textContent()) ?? 0))
      .toBeGreaterThan(0);
    await demoPause(page);

    log("2. Админ: статистика за месяц и лента активности");
    await page.getByRole("heading", { name: "Статистика за месяц" }).scrollIntoViewIfNeeded();
    await demoPause(page);
    const activity = page.getByRole("heading", { name: "Лента активности" });
    if (await activity.isVisible().catch(() => false)) {
      await activity.scrollIntoViewIfNeeded();
      await demoPause(page);
    }

    log("3. Админ: создание категории (главная)");
    const catPanel = page.locator(".panel-surface").filter({ hasText: "Создать категорию" });
    await catPanel.scrollIntoViewIfNeeded();
    await catPanel.getByPlaceholder("Название категории").fill(category.name);
    await catPanel.getByPlaceholder("Описание (необязательно)").fill(category.description);
    await demoPause(page);
    const createCat = page.waitForResponse(
      (r) => r.url().includes("/categories") && r.request().method() === "POST" && r.ok()
    );
    await catPanel.getByRole("button", { name: "Создать", exact: true }).click();
    const catResp = await createCat;
    createdCategoryId = ((await catResp.json()) as { id: number }).id;
    await expect(page.getByText("Категория создана успешно")).toBeVisible({ timeout: 15_000 });
    await demoPause(page);

    log("4. Админ: создание подкатегории (главная)");
    await page.getByRole("heading", { name: "Создать подкатегорию" }).scrollIntoViewIfNeeded();
    const subForm = page.locator("form").filter({ hasText: "Создать подкатегорию" });
    await subForm.getByPlaceholder("Название подкатегории").fill(subcategory.name);
    await subForm.getByPlaceholder("Описание подкатегории").fill(subcategory.description);
    await pickParentCategory(page, subcategory.parentName);
    await demoPause(page);
    const createSub = page.waitForResponse(
      (r) =>
        r.url().includes("/categories/subcategory") &&
        r.request().method() === "POST" &&
        r.ok()
    );
    await page.getByRole("button", { name: "Создать подкатегорию" }).click();
    const subResp = await createSub;
    createdSubId = ((await subResp.json()) as { id: number }).id;
    await expect(page.getByText("Подкатегория создана успешно")).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);

    log("5. Админ: быстрое одобрение резюме (главная)");
    const resumePanel = page.locator(".panel-surface").filter({ hasText: "Одобрить резюме" });
    const approveOnHome = resumePanel.getByRole("button", { name: "Одобрить" }).first();
    if (await approveOnHome.isVisible().catch(() => false)) {
      await approveOnHome.click();
      await expect(page.getByText("Резюме одобрено")).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    }

    log("6. Админ: массовая рассылка");
    const notifyPanel = page.locator(".panel-surface").filter({ hasText: "Уведомление всем" });
    await notifyPanel.scrollIntoViewIfNeeded();
    await notifyPanel.getByPlaceholder("Заголовок").fill(broadcast.title);
    await notifyPanel.getByPlaceholder("Сообщение").fill(broadcast.message);
    await demoPause(page);
    await notifyPanel.getByRole("button", { name: "Отправить" }).click();
    await expect(page.getByText("Уведомление отправлено всем пользователям")).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);

    log("7. Админ: панель /admin — пользователи и категории");
    await page.goto(hashRoute("/admin"));
    await expect(page.getByRole("heading", { name: "Панель администратора" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Категории" })).toBeVisible();
    await expect(page.getByText(category.name)).toBeVisible();
    await demoPause(page);

    log("8. Админ: блокировка и разблокировка пользователя");
    const userCard = page
      .locator(".form-panel")
      .filter({ hasText: "Пользователи" })
      .locator(".rounded-xl")
      .filter({ hasText: MODERATION_TARGET_USER })
      .first();
    await userCard.scrollIntoViewIfNeeded();
    await userCard.getByRole("button", { name: "Заблокировать" }).click();
    await expect(userCard.getByText("Заблокирован")).toBeVisible({ timeout: 15_000 });
    await demoPause(page);
    await userCard.getByRole("button", { name: "Разблокировать" }).click();
    await expect(userCard.getByText("Активен")).toBeVisible({ timeout: 15_000 });
    await demoPause(page);

    log("9. Админ: модерация резюме (/admin/resumes)");
    await page.goto(hashRoute("/admin/resumes"));
    await expect(page.getByRole("heading", { name: "Модерация резюме" })).toBeVisible({
      timeout: 15_000,
    });
    const approveResume = page.getByRole("button", { name: /Одобрить/i }).first();
    if (await approveResume.isVisible().catch(() => false)) {
      await approveResume.click();
      await expect(page.getByText(/Резюме одобрено/i)).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    }

    log("10. Админ: модерация услуг (/admin/services)");
    await page.goto(hashRoute("/admin/services"));
    await expect(page.getByRole("heading", { name: "Модерация сервисов" })).toBeVisible({
      timeout: 15_000,
    });
    const approveService = page.getByRole("button", { name: /Одобрить/i }).first();
    if (await approveService.isVisible().catch(() => false)) {
      await approveService.click();
      await expect(page.getByText(/Сервис одобрен|одобрен/i)).toBeVisible({ timeout: 15_000 });
      await demoPause(page);
    }

    log("11. Админ: сводная модерация (/admin/moderation)");
    await page.goto(hashRoute("/admin/moderation"));
    await expect(page.getByRole("heading", { name: "Панель модерации" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("В ожидании проверки").first()).toBeVisible();
    await demoPause(page);

    log("12. Админ: разделы менеджера (тикеты, споры, заказы)");
    await page.goto(hashRoute("/manager/tickets"));
    await expect(page.getByRole("heading", { name: "Тикеты помощи", level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);
    await page.goto(hashRoute("/manager/disputes"));
    await expect(page.getByRole("heading", { name: "Споры и арбитраж" })).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);
    await page.goto(hashRoute("/manager/orders"));
    await expect(page.getByRole("heading", { name: "Модерация заказов" })).toBeVisible({
      timeout: 15_000,
    });
    await demoPause(page);

    log("✓ Полный обзор админ-панели завершён");

    if (createdSubId > 0) {
      await deleteCategoryAsAdmin(request, createdSubId);
    }
    if (createdCategoryId > 0) {
      await deleteCategoryAsAdmin(request, createdCategoryId);
    } else {
      const id = await findCategoryIdByName(request, category.name).catch(() => 0);
      if (id) await deleteCategoryAsAdmin(request, id);
    }
  });
});
