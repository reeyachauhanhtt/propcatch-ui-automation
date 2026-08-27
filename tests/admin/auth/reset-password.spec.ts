import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/admin/auth";

test.use({ storageState: anonymousStorageState });

test.describe("Admin Reset password", () => {
  test.describe.configure({ timeout: 45_000 });

  test("ADMIN-RESET-001 — reset page without token shows a link error @smoke", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    await expect(page.getByTestId("reset-password-link-error")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Reset link problem")).toBeVisible();
    await expect(
      page.getByText(
        "This reset link is missing its recovery token. Request a new one.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request a new link" }),
    ).toBeVisible();
  });

  test("ADMIN-RESET-002 — invalid code shows expired/invalid link error", async ({
    page,
  }) => {
    await page.goto("/reset-password?code=bogus-invalid-code");

    await expect(page.getByTestId("reset-password-link-error")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("This reset link is invalid or has expired. Request a new one."),
    ).toBeVisible();
  });

  test("ADMIN-RESET-003 — Request a new link opens forgot-password", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(page.getByTestId("reset-password-link-error")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("link", { name: "Request a new link" }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByText("Reset your password")).toBeVisible();
  });

  // Full happy-path update requires a live recovery token from email.
  test("ADMIN-RESET-010 — successful password update is blocked without recovery harness", async () => {
    test.skip(
      true,
      "No Admin recovery-token harness (mailbox or seeded link). Cover link-error UI above; add update flow when TEST_ADMIN_RESET_CODE is available.",
    );
  });
});
