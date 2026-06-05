import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseURL = process.env.BASE_URL || "http://localhost:5174";
/** В npm на Windows без пробела `set DEMO_VIDEO=1&&` даёт значение `1&&` — нормализуем. */
const isVideoDemo = /^1/.test((process.env.DEMO_VIDEO ?? "").trim());

/** Full HD для диплома; иначе Playwright сжимает кадр ~до 800×800. */
const demoVideoWidth = Number(process.env.DEMO_VIDEO_WIDTH) || 1920;
const demoVideoHeight = Number(process.env.DEMO_VIDEO_HEIGHT) || 1080;

export default defineConfig({
  testDir: __dirname,
  timeout: isVideoDemo ? 300_000 : 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  preserveOutput: isVideoDemo ? "always" : "failures-only",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    colorScheme: "dark",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: isVideoDemo
      ? { mode: "on", size: { width: demoVideoWidth, height: demoVideoHeight } }
      : "retain-on-failure",
    actionTimeout: 15_000,
    ...(isVideoDemo
      ? {
          ...devices["Desktop Chrome"],
          viewport: { width: demoVideoWidth, height: demoVideoHeight },
          deviceScaleFactor: 1,
        }
      : devices["Desktop Chrome"]),
  },
  projects: [
    {
      name: "demo-setup",
      testMatch: /demo\/global\.setup\.ts/,
    },
    {
      name: "demo",
      testMatch: /demo\/.*\.spec\.ts/,
      testIgnore: /global\.setup\.ts/,
      dependencies: ["demo-setup"],
    },
    {
      name: "setup-customer",
      testMatch: /setup\/auth\.customer\.setup\.ts/,
    },
    {
      name: "customer",
      testMatch: /customer-order-lifecycle\.spec\.ts/,
      use: {
        storageState: path.join(__dirname, "playwright/.auth/customer.json"),
      },
      dependencies: ["setup-customer"],
    },
    {
      name: "setup-executer",
      testMatch: /setup\/auth\.executer\.setup\.ts/,
    },
    {
      name: "executer",
      testMatch: /executer-resume-and-application\.spec\.ts/,
      use: {
        storageState: path.join(__dirname, "playwright/.auth/executer.json"),
      },
      dependencies: ["setup-executer"],
    },
    {
      name: "interaction",
      testMatch: /customer-executer-interaction\.spec\.ts/,
      dependencies: ["setup-customer", "setup-executer"],
    },
    {
      name: "setup-manager",
      testMatch: /setup\/auth\.manager\.setup\.ts/,
    },
    {
      name: "manager",
      testMatch: /manager-moderation\.spec\.ts/,
      use: {
        storageState: path.join(__dirname, "playwright/.auth/manager.json"),
      },
      dependencies: ["setup-manager"],
    },
    {
      name: "setup-admin",
      testMatch: /setup\/auth\.admin\.setup\.ts/,
    },
    {
      name: "admin",
      testMatch: /admin-dashboard\.spec\.ts/,
      use: {
        storageState: path.join(__dirname, "playwright/.auth/admin.json"),
      },
      dependencies: ["setup-admin", "setup-customer"],
    },
    {
      name: "explorer",
      testMatch: /explorer-user\.spec\.ts/,
    },
  ],
});
