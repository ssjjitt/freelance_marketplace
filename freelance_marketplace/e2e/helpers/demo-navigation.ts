import type { Page } from "@playwright/test";
import { demoPause } from "./demo-ui.js";

export async function openSidebarLink(page: Page, linkName: string): Promise<void> {
  await page.locator("header.navbar button").first().click();
  await demoPause(page, 200);
  await page.getByRole("link", { name: linkName }).click();
  await demoPause(page, 200);
}
