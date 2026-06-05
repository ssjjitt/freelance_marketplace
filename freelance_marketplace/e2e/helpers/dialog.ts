import { expect, type Page } from "@playwright/test";

/** Подтверждение в кастомном AppDialog (кнопка «Подтвердить»). */
export async function confirmAppDialog(page: Page): Promise<void> {
  const dialog = page.getByRole("alertdialog");
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  await dialog.getByRole("button", { name: "Подтвердить" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 10_000 });
}

/** Ввод текста в AppDialog prompt и подтверждение «ОК». */
export async function fillAppDialogPrompt(
  page: Page,
  text: string
): Promise<void> {
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  await dialog.locator("input").fill(text);
  await dialog.getByRole("button", { name: "ОК" }).click();
  await dialog.waitFor({ state: "hidden", timeout: 10_000 });
}

/** Закрытие success/error alert AppDialog. */
export async function dismissAppAlert(page: Page): Promise<void> {
  const dialog = page.getByRole("alertdialog");
  if (!(await dialog.isVisible().catch(() => false))) return;
  const ok = dialog.getByRole("button", { name: /ОК|Закрыть|Понятно/i });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
  }
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}
