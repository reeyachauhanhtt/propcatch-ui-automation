import type { Browser, BrowserContext, Page } from "@playwright/test";

export const USER_BASE_URL =
  process.env.BASE_URL || "https://propcatchwebapp.vercel.app";

/** Anonymous user-site context (separate from admin storageState). */
export async function openUserContext(browser: Browser): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  const context = await browser.newContext({
    baseURL: USER_BASE_URL,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  return { context, page };
}
