import { test, type Page, type Locator } from "@playwright/test";

/** Учётка заказчика из data.sql */
const CUSTOMER = {
  username: process.env.E2E_USER || "customer",
  password: process.env.E2E_PASSWORD || "Qwert123_",
};

const MIN_ACTION_DELAY_MS = 1500;

function hashRoute(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/#${normalized}`;
}

async function humanPause(page: Page, extraMs = 0): Promise<void> {
  const jitter = Math.floor(Math.random() * 400);
  await page.waitForTimeout(MIN_ACTION_DELAY_MS + extraMs + jitter);
}

function logDecision(message: string): void {
  console.log(`[бот] ${message}`);
}

function logSkip(message: string): void {
  console.log(`[бот] Пропуск: ${message}`);
}

async function safeStep(
  page: Page,
  label: string,
  action: () => Promise<void>
): Promise<boolean> {
  try {
    await humanPause(page);
    logDecision(label);
    await action();
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logSkip(`${label} — ${msg}`);
    return false;
  }
}

async function isVisible(locator: Locator, timeout = 2500): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginAsCustomer(page: Page): Promise<void> {
  await page.goto(hashRoute("/login"));
  await page.waitForLoadState("networkidle").catch(() => {});

  await safeStep(page, "Ввожу логин заказчика", async () => {
    await page.getByPlaceholder("Логин").fill(CUSTOMER.username);
  });

  await safeStep(page, "Ввожу пароль", async () => {
    await page.getByPlaceholder("Пароль").fill(CUSTOMER.password);
  });

  await safeStep(page, "Нажимаю «Войти»", async () => {
    await page.getByRole("button", { name: "Войти" }).click();
    await page.waitForTimeout(2000);
    // После входа приложение может уйти на /profile или остаться в SPA
    if (!page.url().includes("profile") && !page.url().includes("#/")) {
      await page.goto(hashRoute("/"));
    } else if (page.url().includes("profile") && !page.url().includes("#")) {
      await page.goto(hashRoute("/"));
    } else {
      await page.goto(hashRoute("/"));
    }
    await page.waitForLoadState("domcontentloaded");
  });

  const onHome =
    page.url().includes("#/") &&
    !page.url().includes("login") &&
    !page.url().includes("register");
  if (!onHome) {
    await page.goto(hashRoute("/"));
    await humanPause(page);
  }
  logDecision("Вход выполнен, перехожу к исследованию главной");
}

async function scanHomeActions(page: Page): Promise<string[]> {
  const found: string[] = [];
  await page.goto(hashRoute("/"));
  await page.waitForLoadState("domcontentloaded");
  await humanPause(page);

  const checks: { name: string; locator: Locator }[] = [
    {
      name: "Создать заказ",
      locator: page.getByRole("link", { name: /Создать заказ/i }),
    },
    {
      name: "Разместить заказ",
      locator: page.getByRole("link", { name: /Разместить заказ/i }),
    },
    {
      name: "Каталог",
      locator: page.getByRole("link", { name: /^Каталог$/i }).or(
        page.locator('a[href*="/catalog"]')
      ),
    },
    {
      name: "Поиск на главной",
      locator: page.getByPlaceholder(/Поиск заказов/i),
    },
    {
      name: "Уведомления (колокольчик)",
      locator: page.locator('a[href*="/notifications"]'),
    },
  ];

  for (const { name, locator } of checks) {
    if (await isVisible(locator)) {
      found.push(name);
      logDecision(`На главной доступно: «${name}»`);
    } else {
      logSkip(`На главной не найдено: «${name}»`);
    }
  }

  return found;
}

async function tryCreateOrder(page: Page): Promise<void> {
  const createLink = page
    .getByRole("link", { name: /Создать заказ/i })
    .or(page.getByRole("link", { name: /Разместить заказ/i }));

  if (!(await isVisible(createLink))) {
    logSkip("Кнопка создания заказа не видна — пробую прямой URL /orders/new");
    await page.goto(hashRoute("/orders/new"));
  } else {
    await safeStep(page, "Открываю форму «Создать заказ»", async () => {
      await createLink.first().click();
      await page.waitForURL(/orders\/new/, { timeout: 10_000 });
    });
  }

  const onForm = page.url().includes("orders/new");
  if (!onForm) {
    logSkip("Форма создания заказа не открылась");
    return;
  }

  const unique = Date.now();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);
  const deadline = futureDate.toISOString().split("T")[0];

  await safeStep(page, "Заполняю название заказа", async () => {
    const titleInput = page
      .locator("label")
      .filter({ hasText: "Название" })
      .locator("input")
      .or(page.getByRole("textbox").first());
    await titleInput.first().fill(`Тестовый заказ Playwright ${unique}`);
  });

  await safeStep(page, "Заполняю описание заказа", async () => {
    const desc = page
      .locator("label")
      .filter({ hasText: "Описание" })
      .locator("textarea")
      .or(page.locator("textarea").first());
    await desc.first().fill(
      "Автоматически созданный заказ для проверки маркетплейса. Нужна вёрстка и базовая интеграция."
    );
  });

  await safeStep(page, "Указываю бюджет", async () => {
    const budget = page.locator('input[type="number"]').first();
    if (await isVisible(budget)) {
      await budget.fill("1500");
    }
  });

  await safeStep(page, "Указываю срок выполнения", async () => {
    const dateInput = page.locator('input[type="date"]').first();
    if (await isVisible(dateInput)) {
      await dateInput.fill(deadline);
    }
  });

  await safeStep(page, "Выбираю категорию в выпадающем списке", async () => {
    const categoryBtn = page
      .getByRole("button", { name: /Выберите категорию/i })
      .or(page.locator("button").filter({ hasText: /категор/i }));
    if (!(await isVisible(categoryBtn))) {
      throw new Error("кнопка выбора категории не найдена");
    }
    await categoryBtn.first().click();
    await page.waitForTimeout(500);
    const option = page
      .locator(".dropdown-item, button")
      .filter({ hasText: /Разработка|Веб|IT|Дизайн/i })
      .first();
    if (await isVisible(option, 3000)) {
      await option.click();
    } else {
      const anyOption = page.locator(".dropdown-item").first();
      if (await isVisible(anyOption, 2000)) {
        await anyOption.click();
      } else {
        throw new Error("нет пунктов категории в списке");
      }
    }
  });

  await safeStep(page, "Отправляю форму создания заказа", async () => {
    await page.getByRole("button", { name: /^Создать$/i }).click();
    await page.waitForTimeout(2500);
    if (page.url().includes("catalog") || page.url().includes("orders/")) {
      logDecision("Заказ создан или открыта страница после сохранения");
    }
  });
}

async function tryExploreCatalog(page: Page): Promise<void> {
  await safeStep(page, "Перехожу в каталог", async () => {
    await page.goto(hashRoute("/catalog"));
    await page.waitForLoadState("domcontentloaded");
  });

  if (!page.url().includes("catalog")) return;

  await safeStep(page, "Переключаю вид «Заказы» в каталоге", async () => {
    const ordersTab = page.getByRole("button", { name: "Заказы" });
    if (await isVisible(ordersTab)) {
      await ordersTab.click();
    }
  });

  await safeStep(page, "Пробую фильтр по цене в каталоге", async () => {
    const minPrice = page.getByPlaceholder("От");
    const maxPrice = page.getByPlaceholder("До");
    if (await isVisible(minPrice)) {
      await minPrice.fill("100");
    }
    if (await isVisible(maxPrice)) {
      await maxPrice.fill("5000");
    }
  });

  await safeStep(page, "Пробую сортировку в каталоге", async () => {
    const sortBtn = page
      .getByRole("button", { name: /Сортировка|Дата|Цена|Название/i })
      .first();
    if (await isVisible(sortBtn)) {
      await sortBtn.click();
      await page.waitForTimeout(400);
      const sortOption = page.locator(".dropdown-item").first();
      if (await isVisible(sortOption, 2000)) {
        await sortOption.click();
      }
    }
  });

  await safeStep(page, "Выбираю случайную категорию в боковой панели", async () => {
    const categoryButtons = page
      .locator("aside button, aside a")
      .filter({ hasText: /.+/ });
    const count = await categoryButtons.count();
    if (count === 0) {
      throw new Error("категории в сайдбаре не найдены");
    }
    const index = Math.min(count - 1, 1 + Math.floor(Math.random() * Math.min(count, 5)));
    const target = categoryButtons.nth(index);
    const name = (await target.textContent())?.trim() || `#${index}`;
    logDecision(`Кликаю категорию: «${name}»`);
    await target.click();
    await page.waitForTimeout(1500);
  });

  await safeStep(page, "Ищу карточки заказов в каталоге", async () => {
    const detailLinks = page.locator('a[href*="/orders/"]').filter({
      hasNot: page.locator('a[href*="/orders/new"]'),
    });
    const cards = page.locator(".catalog-card");
    const linkCount = await detailLinks.count();
    const cardCount = await cards.count();

    if (linkCount > 0) {
      logDecision(`Нашёл ${linkCount} ссылок на заказы — открою первую`);
      await detailLinks.first().click();
      await page.waitForURL(/orders\/\d+/, { timeout: 10_000 }).catch(() => {});
      await tryInteractOnOrderDetail(page);
    } else if (cardCount > 0) {
      logDecision(`Нашёл ${cardCount} карточек — открою «Подробнее»`);
      const more = page.getByRole("link", { name: "Подробнее" }).first();
      if (await isVisible(more)) {
        await more.click();
        await tryInteractOnOrderDetail(page);
      }
    } else {
      logSkip("В выбранной категории нет видимых заказов");
    }
  });
}

async function tryInteractOnOrderDetail(page: Page): Promise<void> {
  if (!/\/orders\/\d+/.test(page.url())) {
    logSkip("Не на странице заказа — пропускаю взаимодействие");
    return;
  }

  logDecision("На карточке заказа — сканирую доступные действия");

  await safeStep(page, "Читаю заголовок и описание заказа", async () => {
    const heading = page.locator("h1, h2, h3").first();
    await heading.waitFor({ state: "visible", timeout: 5000 });
  });

  const backBtn = page.getByRole("button", { name: /Назад|Каталог/i }).or(
    page.getByRole("link", { name: /Каталог/i })
  );
  if (await isVisible(backBtn)) {
    logDecision("На странице заказа есть возврат в каталог");
  }

  const editBtn = page.getByRole("link", { name: /Редактировать/i });
  if (await isVisible(editBtn)) {
    logDecision("Доступно редактирование заказа (не открываю, чтобы не менять чужие данные)");
  }
}

async function tryNotifications(page: Page): Promise<void> {
  await safeStep(page, "Открываю раздел уведомлений", async () => {
    const bell = page.locator('a[href*="/notifications"]').first();
    if (await isVisible(bell)) {
      await bell.click();
    } else {
      await page.goto(hashRoute("/notifications"));
    }
    await page.waitForURL(/notifications/, { timeout: 10_000 });
  });

  if (!page.url().includes("notifications")) return;

  await safeStep(page, "Переключаю фильтр «Непрочитанные»", async () => {
    const unread = page.getByRole("button", { name: "Непрочитанные" });
    if (await isVisible(unread)) {
      await unread.click();
    }
  });

  await safeStep(page, "Переключаю фильтр «Все» уведомления", async () => {
    const allBtn = page.getByRole("button", { name: "Все", exact: true });
    if (await isVisible(allBtn)) {
      await allBtn.click();
    }
  });

  await safeStep(page, "Открываю первое уведомление из списка", async () => {
    const items = page.locator("article, .chat-list-item, li").filter({
      has: page.locator("h3"),
    });
    const notificationCard = page.locator("article").first();
    if (await isVisible(notificationCard, 3000)) {
      const linkInside = notificationCard.locator("a").first();
      if (await isVisible(linkInside, 1000)) {
        await linkInside.click();
      } else {
        const readBtn = notificationCard.getByRole("button", { name: "Прочитано" });
        if (await isVisible(readBtn, 1000)) {
          await readBtn.click();
          logDecision("Отметил уведомление как прочитанное");
        }
      }
    } else if ((await items.count()) > 0) {
      await items.first().click();
    } else {
      logSkip("Список уведомлений пуст");
    }
  });
}

async function tryNavbarSearch(page: Page): Promise<void> {
  await safeStep(page, "Пробую поиск в шапке", async () => {
    const search = page
      .getByPlaceholder(/Поиск заказов|Поиск/i)
      .first();
    if (!(await isVisible(search))) {
      throw new Error("поле поиска в navbar не найдено");
    }
    await search.fill("лендинг");
    await search.press("Enter");
    await page.waitForTimeout(2000);
    if (page.url().includes("catalog")) {
      logDecision("Поиск перенаправил в каталог");
    }
  });
}

test.describe("Исследующий пользователь (заказчик)", () => {
  test("активное исследование функционала маркетплейса", async ({ page }) => {
    test.setTimeout(180_000);

    logDecision("Старт сессии: роль активного заказчика");

    await loginAsCustomer(page);
    const homeActions = await scanHomeActions(page);

    if (
      homeActions.some((a) => a.includes("Создать") || a.includes("Разместить"))
    ) {
      await tryCreateOrder(page);
    } else {
      logSkip("На главной нет явной кнопки заказа — пробую создать через URL");
      await tryCreateOrder(page);
    }

    await tryExploreCatalog(page);

    if (homeActions.includes("Уведомления (колокольчик)")) {
      await tryNotifications(page);
    } else {
      await tryNotifications(page);
    }

    await tryNavbarSearch(page);

    await safeStep(page, "Возвращаюсь на главную для завершения обхода", async () => {
      await page.goto(hashRoute("/"));
    });

    logDecision("Сессия исследования завершена");
  });
});
