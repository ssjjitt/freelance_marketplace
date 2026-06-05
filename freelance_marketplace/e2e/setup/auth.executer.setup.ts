import { test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { login } from "../helpers/auth.js";
import { USERS } from "../helpers/credentials.js";

const AUTH_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "playwright",
  ".auth"
);

setup("authenticate as executer", async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const { username, password, storageState } = USERS.executer;
  await login(page, username, password);
  await page.context().storageState({ path: storageState });
});
