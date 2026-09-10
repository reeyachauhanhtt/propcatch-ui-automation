import { expect, type Page } from "@playwright/test";

/**
 * Admin auth helpers for https://propcatch-admin.vercel.app
 *
 * Verified 2026-08-26 against the live Admin portal:
 * - Login form uses #email / #password, noValidate, server-side fieldErrors
 * - Successful login lands on /dashboard (or redirectTo)
 * - Non-admin accounts stay on /login with an amber access-denied banner
 * - Sign out uses data-testid="logout-button" (no confirm dialog on Admin)
 */

/** Empty storage for specs that must start logged out. */
export const anonymousStorageState = {
  cookies: [],
  origins: [],
};

const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

export function requireAdminCreds() {
  if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
    throw new Error("Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env");
  }
  if (TEST_ADMIN_EMAIL === "demo" || TEST_ADMIN_PASSWORD === "demo") {
    throw new Error(
      "Replace demo Admin credentials in .env with a real Admin account",
    );
  }
  return {
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  };
}

/** Non-admin User account (for access-denied assertions). */
export function requireUserCredsForDenial() {
  const email = process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL;
  const password = process.env.TEST_USER_PASSWORD || process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env");
  }
  return { email, password };
}

export function emailInput(page: Page) {
  return page.locator("#email");
}

export function passwordInput(page: Page) {
  return page.locator("#password");
}

export function signInButton(page: Page) {
  return page.getByRole("button", { name: /^Sign in$|^Signing in/ });
}

export function loginError(page: Page) {
  return page.getByTestId("login-error");
}

export function emailFieldError(page: Page) {
  return page.locator("#email-error");
}

export function passwordFieldError(page: Page) {
  return page.locator("#password-error");
}

export function logoutButton(page: Page) {
  return page.getByTestId("logout-button");
}

export function topbarUserLink(page: Page) {
  return page.getByTestId("topbar-user-link");
}

export function dashboardHeading(page: Page) {
  return page.getByRole("heading", { name: "Dashboard", exact: true });
}

/** Tagline under the Sign in heading on /login. */
export function loginTagline(page: Page) {
  return page.getByText(/listings, leads and verification/i);
}

export async function openLogin(page: Page, redirectTo?: string) {
  const path = redirectTo
    ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/login";
  await page.goto(path);
  await expectOnLoginPage(page);
}

export async function fillLogin(page: Page, email: string, password: string) {
  await emailInput(page).fill(email);
  await passwordInput(page).fill(password);
}

export async function expectOnLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/login/);
  await expect(emailInput(page)).toBeVisible();
  await expect(passwordInput(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sign in$|^Signing in/ })).toBeVisible();
}

export async function expectLoggedInAdmin(page: Page) {
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await expect(logoutButton(page)).toBeVisible();
  await expect(topbarUserLink(page)).toBeVisible();
}

/**
 * UI login for Admin. If a session already exists, /login may bounce to
 * /dashboard — treat that as success.
 */
export async function loginAsAdmin(page: Page) {
  const { email, password } = requireAdminCreds();
  await page.goto("/login");

  await Promise.race([
    emailInput(page).waitFor({ state: "visible", timeout: 15_000 }),
    logoutButton(page).waitFor({ state: "visible", timeout: 15_000 }),
  ]);

  if ((await logoutButton(page).count()) > 0) {
    return;
  }

  await fillLogin(page, email, password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectLoggedInAdmin(page);
  await expect(dashboardHeading(page)).toBeVisible();
}

export async function signOutAdmin(page: Page) {
  await logoutButton(page).click();
  await expectOnLoginPage(page);
  await expect(logoutButton(page)).toHaveCount(0);
}
