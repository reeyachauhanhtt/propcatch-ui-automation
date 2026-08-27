import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Locators and helpers for the PropCatch Signup page (/signup).
 *
 * PUBLIC route — use `anonymousStorageState`. A signed-in session redirects
 * `/signup` away to the homepage (observed 2026-08-26).
 *
 * Fields (verified 2026-08-26): Full name (required, minLength 2), Email
 * (required), Mobile (optional, +91), Password (required, minLength 8),
 * Confirm password (required), Terms checkbox, Create account submit.
 *
 * "Create account" stays disabled until name/email/password/confirm are filled
 * AND the Terms checkbox is checked. HTML5 validation still applies on submit
 * for typeMismatch / tooShort.
 *
 * Successful signup is NOT covered in this suite: no disposable/test signup
 * credentials, and the live app rate-limits / would pollute production data.
 */

export async function openSignup(page: Page) {
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(signupHeading(page)).toBeVisible();
}

export function signupHeading(page: Page) {
  return page.getByRole("heading", { name: "Create your account" });
}

export function fullNameInput(page: Page) {
  return page.getByLabel("Full name");
}

export function emailInput(page: Page) {
  return page.getByLabel("Email");
}

export function mobileInput(page: Page) {
  return page.getByPlaceholder("10-digit mobile");
}

export function passwordInput(page: Page) {
  return page.getByPlaceholder("At least 8 characters");
}

export function confirmPasswordInput(page: Page) {
  return page.getByPlaceholder("Re-enter password");
}

export function termsCheckbox(page: Page) {
  return page.getByRole("checkbox");
}

export function createAccountButton(page: Page) {
  return page.getByRole("button", { name: "Create account" });
}

export function signInLink(page: Page) {
  return page.getByRole("main").getByRole("link", { name: "Sign in" });
}

export function termsLink(page: Page) {
  return page.getByRole("main").getByRole("link", { name: "Terms of Service" });
}

export function privacyLink(page: Page) {
  return page.getByRole("main").getByRole("link", { name: "Privacy Policy" });
}

export async function nativeValidity(
  locator: Locator,
): Promise<
  Pick<ValidityState, "valid" | "valueMissing" | "typeMismatch" | "tooShort">
> {
  return locator.evaluate((el) => {
    const input = el as HTMLInputElement;
    return {
      valid: input.validity.valid,
      valueMissing: input.validity.valueMissing,
      typeMismatch: input.validity.typeMismatch,
      tooShort: input.validity.tooShort,
    };
  });
}

/** Fill the required fields and check Terms so Create account can enable. */
export async function fillSignupForm(
  page: Page,
  opts: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
  } = {},
) {
  const {
    name = "QA Tester",
    email = "qa@example.com",
    password = "password1",
    confirmPassword = password,
    acceptTerms = true,
  } = opts;

  await fullNameInput(page).fill(name);
  await emailInput(page).fill(email);
  await passwordInput(page).fill(password);
  await confirmPasswordInput(page).fill(confirmPassword);
  if (acceptTerms) {
    await termsCheckbox(page).check();
  }
}
