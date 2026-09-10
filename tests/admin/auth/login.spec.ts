import { test, expect } from "@playwright/test";
import {
  anonymousStorageState,
  dashboardHeading,
  emailFieldError,
  emailInput,
  fillLogin,
  loginError,
  openLogin,
  passwordFieldError,
  passwordInput,
  requireAdminCreds,
  requireUserCredsForDenial,
  expectLoggedInAdmin,
  expectOnLoginPage,
  loginTagline,
  signOutAdmin,
} from "../../../pages/admin/auth";

test.use({ storageState: anonymousStorageState });

test.describe("Admin Login", () => {
  test.describe.configure({ timeout: 45_000, mode: "serial" });

  test.describe("Login page / UI", () => {
    test("ADMIN-LOGIN-UI — login page loads with email, password, and sign-in controls @smoke", async ({
      page,
    }) => {
      await openLogin(page);

      await expect(page).toHaveTitle(/PropCatch Admin/i);
      await expect(page.getByText("PropCatch Admin").first()).toBeVisible();
      await expect(loginTagline(page)).toBeVisible();
      await expect(emailInput(page)).toBeVisible();
      await expect(passwordInput(page)).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign up" })).toHaveCount(0);
    });

    test("ADMIN-LOGIN-UI — email and password fields accept input", async ({ page }) => {
      await openLogin(page);

      await emailInput(page).fill("buyer@example.com");
      await passwordInput(page).fill("sample-pass");

      await expect(emailInput(page)).toHaveValue("buyer@example.com");
      await expect(passwordInput(page)).toHaveValue("sample-pass");
    });

    test("ADMIN-LOGIN-UI — password characters are masked", async ({ page }) => {
      await openLogin(page);

      await passwordInput(page).fill("sample-pass");
      await expect(passwordInput(page)).toHaveAttribute("type", "password");
    });
  });

  test.describe("Successful login", () => {
    test("ADMIN-LOGIN-001 — admin can login with valid credentials @smoke", async ({
      page,
    }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectLoggedInAdmin(page);
      await expect(dashboardHeading(page)).toBeVisible();
      await expect(loginError(page)).toHaveCount(0);
    });

    test("ADMIN-LOGIN-002 — admin can submit login using Enter", async ({ page }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await passwordInput(page).press("Enter");

      await expectLoggedInAdmin(page);
      await expect(dashboardHeading(page)).toBeVisible();
    });

    test("ADMIN-LOGIN-003 — redirectTo sends admin to the requested page after login", async ({
      page,
    }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page, "/projects");
      await fillLogin(page, email, password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expect(page).toHaveURL(/\/projects/, { timeout: 20_000 });
      await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
      await expectLoggedInAdmin(page);
    });
  });

  test.describe("Validation", () => {
    test("ADMIN-LOGIN-010 — empty submit shows email and password field errors", async ({
      page,
    }) => {
      await openLogin(page);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();
      await expect(emailFieldError(page)).toHaveText("Invalid email");
      await expect(passwordFieldError(page)).toHaveText("Password is too short");
      await expect(emailInput(page)).toHaveAttribute("aria-invalid", "true");
      await expect(passwordInput(page)).toHaveAttribute("aria-invalid", "true");
    });

    test("ADMIN-LOGIN-011 — invalid email format is rejected", async ({ page }) => {
      await openLogin(page);
      await fillLogin(page, "not-an-email", "longenough");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(emailFieldError(page)).toHaveText("Invalid email");
      await expect(emailInput(page)).toHaveAttribute("aria-invalid", "true");
    });

    test("ADMIN-LOGIN-012 — password shorter than 8 characters is rejected", async ({
      page,
    }) => {
      const { email } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, "short");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(passwordFieldError(page)).toHaveText("Password is too short");
      await expect(passwordInput(page)).toHaveAttribute("aria-invalid", "true");
    });
  });

  test.describe("Negative / authorization", () => {
    test("ADMIN-LOGIN-020 — incorrect password stays on login with error", async ({
      page,
    }) => {
      const { email } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, "WrongPass123!");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(loginError(page)).toHaveText("Invalid login credentials");
      await expect(dashboardHeading(page)).toHaveCount(0);
    });

    test("ADMIN-LOGIN-021 — unknown email stays on login with error", async ({
      page,
    }) => {
      await openLogin(page);
      await fillLogin(page, "nobody-qa-admin@example.com", "SomePass1234");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(loginError(page)).toHaveText("Invalid login credentials");
    });

    test("ADMIN-LOGIN-022 — non-admin user cannot access the Admin portal", async ({
      page,
    }) => {
      const { email, password } = requireUserCredsForDenial();
      await openLogin(page);
      await fillLogin(page, email, password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();

      await expectOnLoginPage(page);
      await expect(
        page.getByText(
          "This account does not have access to the Admin Portal. Please contact your administrator.",
        ),
      ).toBeVisible();
      await expect(dashboardHeading(page)).toHaveCount(0);
    });
  });

  test.describe("Button / loading behavior", () => {
    test("ADMIN-LOGIN-030 — Sign in shows Signing in… while authenticating", async ({
      page,
    }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, password);

      await page.getByRole("button", { name: "Sign in", exact: true }).click({
        noWaitAfter: true,
      });

      await expect(
        page.getByRole("button", { name: "Signing in…" }),
      ).toBeVisible({ timeout: 5_000 });
      await expectLoggedInAdmin(page);
    });
  });

  test.describe("Session", () => {
    test("ADMIN-LOGIN-040 — session remains after refresh @smoke", async ({ page }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expectLoggedInAdmin(page);

      await page.reload();

      await expectLoggedInAdmin(page);
      await expect(dashboardHeading(page)).toBeVisible();
    });

    test("ADMIN-LOGIN-041 — Sign out returns to the login page @smoke", async ({
      page,
    }) => {
      const { email, password } = requireAdminCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expectLoggedInAdmin(page);

      await signOutAdmin(page);

      await expectOnLoginPage(page);
      await expect(dashboardHeading(page)).toHaveCount(0);
    });
  });
});
