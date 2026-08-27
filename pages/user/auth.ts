import { expect, type Page } from "@playwright/test";

/**
 * Empty storage state for specs that must start logged out (login UI,
 * anonymous redirects, public "Sign in" assertions).
 *
 * Authenticated browser projects load `playwright/.auth/user.json` by default
 * (see playwright.config.ts + tests/user/auth/auth.setup.ts).
 */
export const anonymousStorageState = {
  cookies: [],
  origins: [],
};

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL;
const TEST_USER_PASSWORD =
  process.env.TEST_USER_PASSWORD || process.env.TEST_PASSWORD;

export function requireCreds() {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error("Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env");
  }
  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
}

export function headerSignInLink(page: Page) {
  return page.getByRole("banner").getByRole("link", { name: "Sign in" });
}

export function headerProfileLink(page: Page) {
  return page.getByRole("banner").locator('a[href="/profile"]');
}

export async function loginAsUser(page: Page) {
  const { email, password } = requireCreds();
  await page.goto("/login");

  // The app redirects /login away when a session already exists in this
  // context (observed 2026-08-21: /login landed on the signed-in homepage).
  // Race the login heading against the signed-in header, then handle either.
  const heading = page.getByRole("heading", { name: "Welcome back" });
  await Promise.race([
    heading.waitFor({ state: "visible", timeout: 15_000 }),
    headerProfileLink(page).waitFor({ state: "visible", timeout: 15_000 }),
  ]);

  if ((await headerProfileLink(page).count()) > 0) {
    return; // Already signed in.
  }

  await expect(heading).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("At least 8 characters").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await expect(headerProfileLink(page)).toBeVisible();
}

export async function openHomepageLoggedIn(page: Page) {
  await loginAsUser(page);
  if (new URL(page.url()).pathname !== "/") {
    await page.goto("/");
  }
  await expect(
    page.getByRole("heading", { name: "Discover your next home, verified." }),
  ).toBeVisible();
}

export async function expectLoggedInHeader(page: Page) {
  await expect(headerSignInLink(page)).toHaveCount(0);
  await expect(headerProfileLink(page)).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Search", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Notifications" }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Shortlist" }),
  ).toBeVisible();
}

/** Sign out can land on the homepage or the app error boundary. */
export async function waitForSignOutSettled(page: Page) {
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0, {
    timeout: 15_000,
  });
}

/**
 * Sign out through the app's confirmation dialog.
 *
 * Clicking Sign out on /profile now opens a "Sign out?" dialog; the user must
 * confirm to actually end the session. This helper performs the full flow and
 * waits until the session is cleared.
 *
 * Verified 2026-08-21: the dialog reads "Sign out? / You'll need to sign in
 * again to see your enquiries, messages, and saved projects." with Cancel and
 * Sign out actions.
 */
export async function signOut(page: Page) {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Sign out", exact: true }).click();
  await waitForSignOutSettled(page);
}
