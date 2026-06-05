import { expect, type Page } from "@playwright/test";
import { hashRoute } from "./routes.js";
import { DEFAULT_PASSWORD, USERS } from "./credentials.js";
import { registrationPreviewPayload } from "./demo-data.js";

const PAUSE_MS = Number(
  process.env.DEMO_PAUSE_MS || (process.env.DEMO_VIDEO ? 1400 : 0)
);

/** Пауза для записи видео (DEMO_VIDEO=1 или DEMO_PAUSE_MS). */
export async function demoPause(page: Page, extra = 0): Promise<void> {
  if (PAUSE_MS + extra <= 0) return;
  const jitter = Math.floor(Math.random() * 250);
  await page.waitForTimeout(PAUSE_MS + extra + jitter);
}

export async function openSidebar(page: Page): Promise<void> {
  const toggle = page.locator("header.navbar button").first();
  await toggle.click();
  await demoPause(page, 200);
}

export { openSidebarLink } from "./demo-navigation.js";

export async function logoutViaUI(page: Page): Promise<void> {
  await page.goto(hashRoute("/"));
  const loginLink = page.getByRole("link", { name: "Войти" });
  if (await loginLink.isVisible().catch(() => false)) return;

  await openSidebar(page);
  await page.getByRole("button", { name: "Выйти" }).click();
  await page.waitForURL(/login/, { timeout: 15_000 });
  await demoPause(page);
}

type RoleKey = keyof typeof USERS;

/** Вход через страницу «Логин» с главной (для записи видео). */
export async function loginViaUI(
  page: Page,
  role: RoleKey,
  options?: { fromHome?: boolean }
): Promise<void> {
  const { username, password } = USERS[role];
  const fromHome = options?.fromHome !== false;

  if (fromHome) {
    await page.goto(hashRoute("/"));
    await demoPause(page);
    await page.getByRole("link", { name: "Войти" }).click();
  } else {
    await page.goto(hashRoute("/login"));
  }

  await expect(page.getByRole("heading", { name: "Логин" })).toBeVisible();
  await page.getByPlaceholder("Логин").fill(username);
  await demoPause(page, 300);
  await page.getByPlaceholder("Пароль").fill(password);
  await demoPause(page, 300);
  await page.getByRole("button", { name: "Войти" }).click();

  await page.waitForFunction(
    () => localStorage.getItem("user") !== null,
    { timeout: 15_000 }
  );
  await page.waitForURL(/\/profile/, { timeout: 15_000 });
  await page.goto(hashRoute("/"));
  await demoPause(page);
}

/** Показ шагов регистрации (шаг 1–2). Полное завершение — только с E2E_VERIFY_CODE. */
export async function demonstrateRegistration(page: Page): Promise<void> {
  const data = registrationPreviewPayload();

  await page.goto(hashRoute("/"));
  await demoPause(page);
  await page.getByRole("link", { name: "Регистрация" }).click();
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();

  await page.getByPlaceholder("Логин").fill(data.username);
  await page.getByPlaceholder("Почта").fill(data.email);
  await page.getByPlaceholder("Пароль").first().fill(data.password);
  await page.getByPlaceholder("Повторите пароль").fill(data.password);
  await demoPause(page);
  await page.getByRole("button", { name: "Продолжить" }).click();

  await expect(page.getByText("Выберите роль")).toBeVisible();
  await page.getByRole("button", { name: "Заказчик" }).click();
  await demoPause(page);

  const verifyCode = process.env.E2E_VERIFY_CODE?.trim();
  if (verifyCode?.length === 4) {
    await page.getByRole("button", { name: /Отправить код на почту/i }).click();
    await demoPause(page, 800);
    const otpInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 4; i++) {
      await otpInputs.nth(i).fill(verifyCode[i]);
    }
    await page.getByRole("button", { name: "Проверить" }).click();
    await page.getByRole("button", { name: "Далее" }).click();
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();
    await demoPause(page);
    return;
  }

  await page.getByRole("link", { name: "Войти" }).click().catch(async () => {
    await page.goto(hashRoute("/login"));
  });
}
