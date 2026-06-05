import { expect, type Page } from "@playwright/test";
import { hashRoute } from "./routes.js";
import { USERS } from "./credentials.js";
import { demoPause } from "./demo-ui.js";

const API_BASE = process.env.API_URL || "http://localhost:8080";

/** Создание тикета от имени залогиненного пользователя (UI формы в приложении пока нет). */
export async function createSupportTicketInBrowser(
  page: Page,
  subject: string,
  description: string
): Promise<{ id: number }> {
  await page.goto(hashRoute("/profile"));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });

  const created = await page.evaluate(
    async ({ apiBase, subject, description }) => {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      const token = user?.accessToken;
      if (!token) throw new Error("Пользователь не авторизован");
      const res = await fetch(`${apiBase}/manager/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, description, category: "technical" }),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as { id: number };
    },
    { apiBase: API_BASE, subject, description }
  );

  await page.evaluate(({ subject: title }) => {
    const banner = document.createElement("p");
    banner.setAttribute("data-e2e", "ticket-created");
    banner.className = "message-box success";
    banner.textContent = `Обращение в поддержку отправлено: «${title}»`;
    const host = document.querySelector("section") ?? document.body;
    host.prepend(banner);
  }, { subject });

  await expect(page.locator("[data-e2e=ticket-created]")).toBeVisible({ timeout: 10_000 });
  await demoPause(page);
  return created;
}

export async function pickTicketStatus(page: Page, optionLabel: string): Promise<void> {
  await page.locator("button.ui-select").first().click();
  const option = page
    .locator(".dropdown-panel button.dropdown-item")
    .filter({ hasText: optionLabel });
  await expect(option).toBeVisible({ timeout: 5_000 });
  await option.evaluate((node) => (node as HTMLButtonElement).click());
}

export async function saveTicketStatus(page: Page, statusLabel: string): Promise<void> {
  const statusSelect = page.locator("button.ui-select").first();
  const current = (await statusSelect.innerText()).trim();
  if (current === statusLabel) {
    await demoPause(page);
    return;
  }

  await pickTicketStatus(page, statusLabel);
  const saveBtn = page.getByRole("button", { name: "Сохранить" });
  await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
  const save = page.waitForResponse(
    (r) =>
      r.url().includes("/manager/tickets/") &&
      r.url().includes("/status") &&
      r.request().method() === "PATCH" &&
      r.ok()
  );
  await saveBtn.click();
  await save;
  await expect(statusSelect.filter({ hasText: statusLabel })).toBeVisible({
    timeout: 15_000,
  });
  await demoPause(page);
}

export async function resolveDisputeAsManager(
  page: Page,
  disputeId: string,
  resolution: "executer_wins" | "customer_wins",
  comment: string
): Promise<void> {
  await page.locator("select").selectOption(resolution);
  await page.getByPlaceholder("Объясните решение...").fill(comment);
  const resolveReq = page.waitForResponse(
    (r) =>
      r.url().includes(`/manager/disputes/${disputeId}/resolve`) &&
      r.request().method() === "PATCH" &&
      r.ok()
  );
  await page.getByRole("button", { name: "Разрешить спор" }).click();
  await resolveReq;
  await expect(page.getByText("Спор успешно разрешен")).toBeVisible({ timeout: 15_000 });
  await demoPause(page);
}
