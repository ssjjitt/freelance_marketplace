import path from "node:path";
import type { Browser, BrowserContext, TestInfo } from "@playwright/test";

export function isDemoVideoEnabled(): boolean {
  return /^1/.test((process.env.DEMO_VIDEO ?? "").trim());
}

export function demoVideoSize(): { width: number; height: number } {
  return {
    width: Number(process.env.DEMO_VIDEO_WIDTH) || 1920,
    height: Number(process.env.DEMO_VIDEO_HEIGHT) || 1080,
  };
}

/**
 * Контекст для `browser.newContext()` — настройка `video` из playwright.config
 * на ручные контексты не распространяется, нужен `recordVideo`.
 */
export async function createDemoBrowserContext(
  browser: Browser,
  testInfo: TestInfo,
  label: string
): Promise<BrowserContext> {
  const size = demoVideoSize();
  const viewport = isDemoVideoEnabled() ? size : { width: 1280, height: 720 };

  return browser.newContext({
    viewport,
    ...(isDemoVideoEnabled()
      ? {
          recordVideo: {
            dir: path.join(testInfo.outputDir, label),
            size,
          },
        }
      : {}),
  });
}
