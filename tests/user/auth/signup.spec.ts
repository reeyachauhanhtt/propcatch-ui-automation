import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/user/auth";
import {
  confirmPasswordInput,
  createAccountButton,
  emailInput,
  fillSignupForm,
  fullNameInput,
  mobileInput,
  nativeValidity,
  openSignup,
  passwordInput,
  privacyLink,
  signInLink,
  signupHeading,
  termsCheckbox,
  termsLink,
} from "../../../pages/user/signupPage";

/**
 * Signup (/signup).
 *
 * Must run with anonymousStorageState — a signed-in session redirects /signup
 * to the homepage. Successful account creation is skipped: no disposable test
 * email harness, and the live app rate-limits / would pollute production data.
 */
test.use({ storageState: anonymousStorageState });

test.describe("Signup", () => {
  test.describe.configure({ timeout: 45_000 });

  test("SIGNUP-001 - signup page loads with Create account @smoke", async ({
    page,
  }) => {
    await openSignup(page);

    await expect(page).toHaveTitle(/Create your account/i);
    await expect(signupHeading(page)).toBeVisible();
    await expect(createAccountButton(page)).toBeVisible();
    await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
      0,
    );
  });

  test("SIGNUP-002 - required fields are visible", async ({ page }) => {
    await openSignup(page);

    await expect(fullNameInput(page)).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
    await expect(mobileInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(confirmPasswordInput(page)).toBeVisible();
    await expect(termsCheckbox(page)).toBeVisible();
    await expect(termsLink(page)).toBeVisible();
    await expect(privacyLink(page)).toBeVisible();
    await expect(signInLink(page)).toBeVisible();
  });

  test("SIGNUP-003 - empty submit is blocked (Create account disabled)", async ({
    page,
  }) => {
    await openSignup(page);

    // Observed UI: Create account stays disabled until fields + terms are set.
    await expect(createAccountButton(page)).toBeDisabled();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupHeading(page)).toBeVisible();
  });

  test("SIGNUP-004 - invalid email is rejected by HTML5 validation", async ({
    page,
  }) => {
    await openSignup(page);
    await fillSignupForm(page, { email: "not-an-email" });

    await expect(createAccountButton(page)).toBeEnabled();
    await createAccountButton(page).click();

    await expect(page).toHaveURL(/\/signup$/);
    const validity = await nativeValidity(emailInput(page));
    expect(validity.valid).toBe(false);
    expect(validity.typeMismatch).toBe(true);
  });

  test("SIGNUP-005 - short password is rejected (minLength 8)", async ({
    page,
  }) => {
    await openSignup(page);
    await fillSignupForm(page, {
      password: "short",
      confirmPassword: "short",
    });

    await expect(createAccountButton(page)).toBeEnabled();
    await createAccountButton(page).click();

    await expect(page).toHaveURL(/\/signup$/);
    const validity = await nativeValidity(passwordInput(page));
    expect(validity.valid).toBe(false);
    expect(validity.tooShort).toBe(true);
  });

  test("SIGNUP-006 - Login ↔ Signup navigation", async ({ page }) => {
    await openSignup(page);
    await signInLink(page).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Sign up" }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(signupHeading(page)).toBeVisible();
    await expect(createAccountButton(page)).toBeVisible();
  });

  test("SIGNUP-007 - successful signup skipped (no disposable test account)", async () => {
    test.skip(
      true,
      "No TEST_SIGNUP_* / disposable-email harness; live signup is rate-limited and would pollute production. UI + validation covered by SIGNUP-001–006.",
    );
  });
});
