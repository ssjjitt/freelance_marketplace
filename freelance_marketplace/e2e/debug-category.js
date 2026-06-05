import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const credentials = await import('./helpers/credentials.js');
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
try {
  await page.goto('http://localhost:5174/#/login');
  await page.getByPlaceholder('Логин').fill(credentials.USERS.customer.username);
  await page.getByPlaceholder('Пароль').fill(credentials.DEFAULT_PASSWORD);
  await page.getByRole('button', { name: /Войти/i }).click();
  await page.waitForURL('**/#/*', { timeout: 15000 });
  await page.goto('http://localhost:5174/#/orders/new');
  await page.waitForSelector('form');
  await page.getByRole('button', { name: 'Категория' }).click();
  await page.waitForSelector('.dropdown-panel', { state: 'visible', timeout: 15000 });
  const html = await page.$eval('.dropdown-panel', el => el.outerHTML);
  console.log(html);
  await page.screenshot({ path: 'debug-category.png', fullPage: true });
} catch (e) {
  console.error(e);
} finally {
  await browser.close();
}
