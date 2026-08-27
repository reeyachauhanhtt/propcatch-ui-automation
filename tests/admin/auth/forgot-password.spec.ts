import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/admin/auth";

test.use({ storageState: anonymousStorageState });

test.describe("Admin Forgot password", () => {
  test.describe.configure({ timeout: 45_000 });

  test("ADMIN-FORGOT-001 — forgot-password page loads @smoke", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page).toHaveTitle(/Reset your PropCatch Admin password/i);
    await expect(page.getByText("Reset your password")).toBeVisible();
    await expect(
      page.getByText(
        "Enter your admin email and we'll send a link to set a new password.",
      ),
    ).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
  });

  test("ADMIN-FORGOT-002 — Send reset link stays disabled when email is empty", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await expect(page.locator("#email")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeDisabled();
  });

  test("ADMIN-FORGOT-003 — valid email shows Check your inbox confirmation", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.locator("#email").fill("qa-admin-reset@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByTestId("forgot-password-sent")).toBeVisible();
    await expect(page.getByText("Check your inbox")).toBeVisible();
    await expect(
      page.getByText(/If an admin account exists for/),
    ).toBeVisible();
    await expect(page.getByText(/qa-admin-reset@example.com/)).toBeVisible();
    await expect(page.getByText(/expires in 1 hour/i)).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("ADMIN-FORGOT-004 — try a different address returns to the form", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.locator("#email").fill("qa-admin-reset@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByTestId("forgot-password-sent")).toBeVisible();

    await page.getByRole("button", { name: "try a different address" }).click();

    await expect(page.getByTestId("forgot-password-sent")).toHaveCount(0);
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  });

  test("ADMIN-FORGOT-005 — Back to sign in opens the login page", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: "Back to sign in" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Internal portal sign-in")).toBeVisible();
  });

  test("ADMIN-FORGOT-006 — Forgot password? from login opens the reset request page", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText("Reset your password")).toBeVisible();
  });
});
