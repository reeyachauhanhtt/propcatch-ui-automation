import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

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

export function requireUserEmail() {
  const email = process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL;
  if (!email) {
    throw new Error("Set TEST_USER_EMAIL in .env");
  }
  return email;
}

/** Look up public.users.id from the Admin Users table by email. */
export async function findAdminUserIdByEmail(page: Page, email: string) {
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Users", exact: true })).toBeVisible();
  const row = page.locator("tbody tr", { hasText: email });
  await expect(row).toBeVisible();
  const href = await row.locator('a[href^="/users/"]').first().getAttribute("href");
  const id = href?.match(/\/users\/([0-9a-f-]+)/i)?.[1];
  if (!id) {
    throw new Error(`No user id in Admin Users for ${email}`);
  }
  return id;
}
