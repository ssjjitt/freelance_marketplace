import { test, expect, type Locator, type Page } from "@playwright/test";
import { hashRoute } from "../helpers/routes.js";
import {
  adminBroadcastPayload,
  adminSubcategoryPayload,
  customerOrderPayload,
  executerApplicationPayload,
  executerResumePayload,
  executerServicePayload,
} from "../helpers/demo-data.js";
import {
  createSubcategoryAsAdmin,
  deleteCategoryAsAdmin,
  findCatalogOrder,
  findCatalogService,
  findCategoryIdByName,
  getAuthUserId,
} from "../helpers/api.js";
import { USERS } from "../helpers/credentials.js";

const PASSWORD = "Qwert123_";
const STEP_PAUSE = 1500;
const TYPE_DELAY = 50;

function log(step: string): void {
  console.log(`\n▶ [DEMO] ${step}`);
}

async function beat(page: Page): Promise<void> {
  await page.waitForTimeout(STEP_PAUSE);
}

async function humanClick(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.hover();
  await locator.page().waitForTimeout(200);
  await locator.click();
}

async function humanType(locator: Locator, text: string): Promise<void> {
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(text, { delay: TYPE_DELAY });
}

/** Дата и числа — без посимвольного ввода (иначе ломается type=date). */
async function humanFill(locator: Locator, text: string): Promise<void> {
  await locator.click();
  await locator.fill(text);
}

/** Тема приложения: localStorage `freelance-marketplace-theme` + кнопка в шапке. */
async function ensureTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  const toLight = page.getByRole("button", { name: "Включить светлую тему", exact: true });
  const toDark = page.getByRole("button", { name: "Включить тёмную тему", exact: true });
  await expect(toLight.or(toDark)).toBeVisible({ timeout: 15_000 });
  if (theme === "light" && (await toLight.isVisible())) {
    await humanClick(toLight);
  } else if (theme === "dark" && (await toDark.isVisible())) {
    await humanClick(toDark);
  }
  await beat(page);
}

const ROLE_THEME: Partial<
  Record<"customer" | "executer" | "manager" | "admin", "light" | "dark">
> = {
  customer: "light",
  executer: "dark",
};

async function loginAs(
  page: Page,
  role: "customer" | "executer" | "manager" | "admin"
): Promise<void> {
  const username = USERS[role].username;
  log(`Вход: ${username}`);
  await page.goto(hashRoute("/login"));
  await expect(page.getByRole("heading", { name: "Логин" })).toBeVisible();
  await beat(page);

  await humanType(page.getByPlaceholder("Логин"), username);
  await humanType(page.getByPlaceholder("Пароль"), PASSWORD);
  await humanClick(page.getByRole("button", { name: "Войти" }));

  await page.waitForFunction(
    () => localStorage.getItem("user") !== null,
    { timeout: 20_000 }
  );
  await page.waitForURL(/\/(profile|manager)/, { timeout: 20_000 });

  if (role === "manager") {
    await page.goto(hashRoute("/"));
    await page.waitForURL(/\/manager/, { timeout: 20_000 });
  } else {
    await page.goto(hashRoute("/"));
  }
  const theme = ROLE_THEME[role];
  if (theme) {
    await ensureTheme(page, theme);
  } else {
    await beat(page);
  }
}

async function logout(page: Page): Promise<void> {
  log("Выход из аккаунта");
  await page.goto(hashRoute("/"));
  if (await page.getByRole("link", { name: "Войти" }).isVisible().catch(() => false)) {
    return;
  }
  await humanClick(page.locator("header.navbar button").first());
  await humanClick(page.getByRole("button", { name: "Выйти" }));
  await page.waitForURL(/login/, { timeout: 20_000 });
  await beat(page);
}

async function pickCategory(page: Page, categoryName: string): Promise<void> {
  await humanClick(page.getByRole("button", { name: "Категория" }));
  await page.getByPlaceholder("Поиск категорий...").fill(categoryName.split(" ")[0]);
  await page.waitForTimeout(400);
  await humanClick(
    page.locator("button.dropdown-item").filter({ hasText: categoryName }).first()
  );
}

test.describe("Сквозное демо платформы (~3 мин)", () => {
  test.setTimeout(600_000);

  test("гость → заказчик → исполнитель → менеджер → взаимодействие → админ", async ({
    page,
    request,
  }) => {
    const order = customerOrderPayload("landing", { unique: true });
    const resume = executerResumePayload({ unique: true });
    const service = executerServicePayload("landing", { unique: true });
    const application = executerApplicationPayload();
    const broadcast = adminBroadcastPayload();
    const subcategory = adminSubcategoryPayload();

    let orderId = 0;
    let executerProfileId = 0;
    let createdSubId = 0;

    const catalogOrder = await findCatalogOrder(request, "кабинет", "SPA", "SMM");
    const catalogService = await findCatalogService(request, "Figma", "Вёрстка", "API");

    // ─── 1. ГОСТЬ ───────────────────────────────────────────────────────────
    log("1. Гость: главная страница");
    await page.goto(hashRoute("/"));
    await expect(page.getByText("Freelance").first()).toBeVisible({ timeout: 15_000 });
    await beat(page);

    log("1. Гость: популярные категории на главной");
    const popularCategory = page
      .locator("a")
      .filter({ hasText: /Разработка|Дизайн|SMM|Веб/i })
      .first();
    if (await popularCategory.isVisible().catch(() => false)) {
      await humanClick(popularCategory);
      await beat(page);
    } else {
      await humanClick(page.getByRole("link", { name: /Все категории/i }));
      await beat(page);
    }

    log("1. Гость: каталог — фильтры, поиск, сортировка");
    await page.goto(hashRoute("/catalog"));
    await humanClick(page.getByRole("button", { name: "Заказы" }));
    await beat(page);

    await humanType(page.getByPlaceholder("От"), "500");
    await humanType(page.getByPlaceholder("До"), "60000");
    await beat(page);

    await humanType(page.getByPlaceholder("Поиск..."), catalogOrder.title.split(" ")[0]);
    await beat(page);

    log("1. Гость: карточка заказа — без кнопки отклика");
    await page.goto(hashRoute(`/orders/${catalogOrder.id}`));
    await expect(page.locator("h1").filter({ hasText: catalogOrder.title })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Откликнуться на заказ" })).toHaveCount(0);
    await beat(page);

    log("1. Гость: карточка услуги — без отклика");
    await page.goto(hashRoute("/catalog"));
    await humanClick(page.getByRole("button", { name: "Услуги" }));
    await beat(page);
    await page.goto(hashRoute(`/services/${catalogService.id}`));
    await expect(page.locator("h1").filter({ hasText: catalogService.title })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /Откликнуться/i })).toHaveCount(0);
    await beat(page);

    log("1. Гость: переход на страницу входа");
    await page.goto(hashRoute("/login"));
    await expect(page.getByRole("heading", { name: "Логин" })).toBeVisible();
    await beat(page);

    // ─── 2. ЗАКАЗЧИК ────────────────────────────────────────────────────────
    await loginAs(page, "customer");

    log("2. Заказчик: «Разместить заказ»");
    await humanClick(page.getByRole("link", { name: "Разместить заказ" }));
    await expect(page.getByRole("heading", { name: "Создать заказ" })).toBeVisible();
    await beat(page);

    log("2. Заказчик: заполнение формы заказа");
    await humanType(page.getByRole("textbox", { name: "Название" }), order.title);
    await humanType(page.getByRole("textbox", { name: "Описание" }), order.description);
    await humanFill(page.getByRole("spinbutton", { name: "Бюджет (BYN)" }), order.budget);
    await humanFill(page.getByRole("textbox", { name: "Срок выполнения" }), order.deadline);
    await pickCategory(page, order.category);
    await beat(page);

    log("2. Заказчик: публикация заказа");
    await humanClick(page.getByRole("button", { name: "Создать", exact: true }));
    await Promise.race([
      page.waitForURL(/\/catalog/, { timeout: 20_000 }),
      expect(page.getByText("Заказ создан")).toBeVisible({ timeout: 20_000 }),
    ]);
    await beat(page);

    log("2. Заказчик: «Мои заказы»");
    await page.goto(hashRoute("/my-items"));
    await expect(page.getByRole("heading", { name: "Мои заказы и услуги" })).toBeVisible({
      timeout: 15_000,
    });
    const orderCard = page.locator(".panel-surface").filter({ hasText: order.title }).first();
    await expect(orderCard).toBeVisible({ timeout: 15_000 });
    await humanClick(orderCard.getByRole("link", { name: "Открыть" }));
    const idMatch = page.url().match(/\/orders\/(\d+)/);
    orderId = Number(idMatch?.[1] ?? 0);
    expect(orderId).toBeGreaterThan(0);
    await beat(page);

    await logout(page);

    // ─── 3. ИСПОЛНИТЕЛЬ ─────────────────────────────────────────────────────
    await loginAs(page, "executer");
    executerProfileId = await getAuthUserId(request, USERS.executer.username);

    log("3. Исполнитель: создание резюме");
    await page.goto(hashRoute("/resumes/new"));
    await expect(page.getByRole("heading", { name: "Создать резюме" })).toBeVisible();
    await humanType(page.getByRole("textbox", { name: "Название" }), resume.title);
    await humanType(page.getByRole("textbox", { name: "Описание" }), resume.description);
    await humanType(page.getByRole("textbox", { name: "Опыт работы" }), resume.experience);
    await humanType(page.getByRole("textbox", { name: "Образование" }), resume.education);

    const skillInput = page.locator("label").filter({ hasText: "Навыки" }).locator("input");
    for (const skill of ["React", "TypeScript", "Figma"]) {
      await skillInput.click();
      await skillInput.fill(skill);
      await skillInput.press("Enter");
      await page.waitForTimeout(300);
    }
    await humanType(
      page.locator('input[type="url"]'),
      "https://github.com/executer-demo/portfolio"
    );
    await beat(page);

    await humanClick(page.getByRole("button", { name: "Создать", exact: true }));
    await expect(page.getByText(/Резюме создано/i)).toBeVisible({ timeout: 20_000 });
    await page.waitForURL(/\/profile/, { timeout: 20_000 });
    await beat(page);

    log("3. Исполнитель: создание услуги");
    await page.goto(hashRoute("/services/new"));
    await page.waitForURL(/\/services\/new/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Создать услугу" })).toBeVisible();
    const serviceForm = page.locator("form.form-panel");
    await humanType(serviceForm.locator('input[type="text"]').first(), service.title);
    await humanType(serviceForm.locator("textarea").first(), service.description);
    await humanFill(serviceForm.locator('input[type="number"]').first(), service.price);
    await pickCategory(page, service.category);
    await beat(page);

    await humanClick(page.getByRole("button", { name: "Создать", exact: true }));
    await Promise.race([
      page.waitForURL(/\/catalog/, { timeout: 20_000 }),
      expect(page.getByText("Услуга создана")).toBeVisible({ timeout: 20_000 }),
    ]);
    await beat(page);

    log("3. Исполнитель: отклик на заказ заказчика");
    await page.goto(hashRoute("/catalog"));
    await humanClick(page.getByRole("button", { name: "Заказы" }));
    await humanType(page.getByPlaceholder("Поиск..."), order.title.split(" ")[0]);
    await beat(page);

    await page.goto(hashRoute(`/orders/${orderId}`));
    await expect(page.getByRole("heading", { level: 1, name: order.title })).toBeVisible({
      timeout: 15_000,
    });
    await humanClick(page.getByRole("button", { name: "Откликнуться на заказ" }));

    const appForm = page.locator("form.form-panel").filter({
      has: page.getByRole("heading", { name: "Откликнуться" }),
    });
    await humanType(appForm.getByRole("textbox", { name: "Сообщение" }), application.message);
    await humanFill(
      appForm.getByRole("spinbutton", { name: "Предложенная цена (BYN)" }),
      application.proposedPrice
    );
    await beat(page);
    await humanClick(appForm.getByRole("button", { name: "Откликнуться", exact: true }));
    await expect(page.getByText("Вы откликнулись на этот заказ")).toBeVisible({
      timeout: 20_000,
    });
    await beat(page);

    await logout(page);

    // ─── 4. МЕНЕДЖЕР ──────────────────────────────────────────────────────
    await loginAs(page, "manager");
    await expect(page.getByRole("heading", { name: /Панель менеджера/i })).toBeVisible({
      timeout: 15_000,
    });
    await beat(page);

    log("4. Менеджер: модерация резюме");
    await page.goto(hashRoute("/manager/resumes"));
    await expect(page.getByRole("heading", { name: "Модерация резюме" })).toBeVisible({
      timeout: 15_000,
    });
    const resumeRow = page.locator("tbody tr").filter({ hasText: resume.title.split(" (")[0] });
    if (await resumeRow.first().isVisible().catch(() => false)) {
      await humanClick(resumeRow.first().getByRole("button", { name: "Одобрить" }));
      await beat(page);
    } else {
      const anyPending = page.locator("tbody tr").filter({ hasText: USERS.executer.username });
      if (await anyPending.first().isVisible().catch(() => false)) {
        await humanClick(anyPending.first().getByRole("button", { name: "Одобрить" }));
        await beat(page);
      }
    }

    log("4. Менеджер: бейдж «Одобрено менеджером» для заказа");
    await page.goto(hashRoute("/manager/orders"));
    await expect(page.getByRole("heading", { name: "Модерация заказов" })).toBeVisible();
    await humanType(
      page.getByPlaceholder("Поиск по ID, названию, заказчику, категории, статусу..."),
      order.title
    );
    await beat(page);
    const orderRow = page.locator("tbody tr").filter({ hasText: order.title }).first();
    await expect(orderRow).toBeVisible({ timeout: 15_000 });
    await humanClick(orderRow.getByRole("button", { name: "Одобрить" }));
    await expect(orderRow.getByText("Одобрено менеджером")).toBeVisible({ timeout: 20_000 });
    await beat(page);

    log("4. Менеджер: раздел споров (демонстрация интерфейса)");
    await page.goto(hashRoute("/manager/disputes"));
    await expect(page.getByRole("heading", { name: "Споры и арбитраж" })).toBeVisible({
      timeout: 15_000,
    });
    await beat(page);

    log("4. Менеджер: раздел тикетов (демонстрация интерфейса)");
    await page.goto(hashRoute("/manager/tickets"));
    await expect(page.getByRole("heading", { name: "Тикеты помощи", level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await beat(page);

    await logout(page);

    // ─── 5. ЗАКАЗЧИК — ВЗАИМОДЕЙСТВИЕ ─────────────────────────────────────
    await loginAs(page, "customer");

    log("5. Заказчик: уведомления");
    await page.goto(hashRoute("/notifications"));
    await expect(
      page.locator("article").filter({ hasText: /отклик|уведомление/i }).first()
    ).toBeVisible({ timeout: 20_000 });
    await beat(page);

    log("5. Заказчик: одобрение отклика исполнителя");
    await page.goto(hashRoute("/applications"));
    await expect(page.getByRole("heading", { name: "Отклики" })).toBeVisible();
    await humanClick(page.getByRole("button", { name: "Отклики на мои заказы/услуги" }));
    await beat(page);

    const appCard = page
      .locator(".panel-surface")
      .filter({ hasText: USERS.executer.username })
      .filter({ hasText: order.title });
    await expect(appCard.first()).toBeVisible({ timeout: 20_000 });
    await humanClick(appCard.first().getByRole("button", { name: "Одобрить" }));
    await expect(appCard.first().getByText("Одобрен")).toBeVisible({ timeout: 20_000 });
    await beat(page);

    log("5. Заказчик: чат с исполнителем (Socket.IO)");
    await page.goto(hashRoute("/chats"));
    const chatItem = page
      .locator(".chat-list-item")
      .filter({ hasText: USERS.executer.username })
      .first();
    await expect(chatItem).toBeVisible({ timeout: 20_000 });
    await humanClick(chatItem);
    await expect(
      page.locator(".chat-main-header").getByText(USERS.executer.username)
    ).toBeVisible();

    const chatMessage = `Здравствуйте! Обсудим детали проекта в чате. #${Date.now().toString(36).slice(-4)}`;
    const chatInput = page.getByPlaceholder("Введите сообщение...");
    await humanType(chatInput, chatMessage);
    const sendMessage = page.waitForResponse(
      (r) =>
        r.url().includes("/messages") &&
        r.request().method() === "POST" &&
        r.status() === 201
    );
    await humanClick(page.getByTitle("Отправить"));
    await sendMessage;
    await expect(
      page.locator(".chat-messages-pane").getByText(chatMessage).first()
    ).toBeVisible({ timeout: 20_000 });
    await beat(page);

    log("5. Заказчик: избранное — профиль исполнителя");
    const favoritesLoaded = page.waitForResponse(
      (r) =>
        r.url().includes("/favorites") &&
        r.request().method() === "GET" &&
        r.status() === 200
    );
    await page.goto(hashRoute(`/profile/${executerProfileId}`));
    await favoritesLoaded;
    const addToFavorites = page.getByRole("button", { name: "В избранное", exact: true });
    const inFavorites = page.getByRole("button", { name: "В избранном", exact: true });
    await expect(addToFavorites.or(inFavorites)).toBeVisible({ timeout: 15_000 });
    if (await addToFavorites.isVisible()) {
      await humanClick(addToFavorites);
    }
    await expect(inFavorites).toBeVisible({ timeout: 15_000 });
    await beat(page);

    await page.goto(hashRoute("/favorites"));
    await expect(
      page.locator(".panel-surface").filter({ hasText: USERS.executer.username }).first()
    ).toBeVisible({ timeout: 15_000 });
    await beat(page);

    await logout(page);

    // ─── 6. АДМИНИСТРАТОР ───────────────────────────────────────────────────
    await loginAs(page, "admin");

    log("6. Администратор: дашборд и статистика");
    await expect(page.getByRole("heading", { name: "Статистика платформы" })).toBeVisible({
      timeout: 15_000,
    });
    await beat(page);

    log("6. Администратор: управление категориями (/admin)");
    await page.goto(hashRoute("/admin"));
    await expect(page.getByRole("heading", { name: "Панель администратора" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "Категории" })).toBeVisible();
    await beat(page);

    log("6. Администратор: создание подкатегории (форма на главной)");
    await page.goto(hashRoute("/"));
    await page.getByRole("heading", { name: "Создать подкатегорию" }).scrollIntoViewIfNeeded();
    const subForm = page.locator("form").filter({ hasText: "Создать подкатегорию" });
    await humanType(subForm.getByPlaceholder("Название подкатегории"), subcategory.name);
    await humanType(subForm.getByPlaceholder("Описание подкатегории"), subcategory.description);
    await humanClick(subForm.getByRole("button").filter({ hasText: /Выберите категорию|Разработка/i }).first());
    await humanClick(page.locator("button").filter({ hasText: subcategory.parentName }).last());
    await beat(page);

    const parentId = await findCategoryIdByName(request, subcategory.parentName);
    const createSubResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/categories/subcategory") &&
        r.request().method() === "POST" &&
        r.ok(),
      { timeout: 20_000 }
    );
    await humanClick(page.getByRole("button", { name: "Создать подкатегорию" }));
    try {
      const resp = await createSubResponse;
      createdSubId = ((await resp.json()) as { id: number }).id;
    } catch {
      createdSubId = await createSubcategoryAsAdmin(
        request,
        parentId,
        subcategory.name,
        subcategory.description
      );
    }
    await beat(page);

    log("6. Администратор: массовая рассылка");
    const notifyPanel = page.locator(".panel-surface").filter({ hasText: "Уведомление всем" });
    await notifyPanel.scrollIntoViewIfNeeded();
    await humanType(notifyPanel.getByPlaceholder("Заголовок"), broadcast.title);
    await humanType(notifyPanel.getByPlaceholder("Сообщение"), broadcast.message);
    await beat(page);
    await humanClick(notifyPanel.getByRole("button", { name: "Отправить" }));
    await expect(page.getByText("Уведомление отправлено всем пользователям")).toBeVisible({
      timeout: 20_000,
    });
    await beat(page);

    if (createdSubId > 0) {
      await deleteCategoryAsAdmin(request, createdSubId).catch(() => undefined);
    }

    log("✓ Сквозной сценарий завершён");
  });
});
