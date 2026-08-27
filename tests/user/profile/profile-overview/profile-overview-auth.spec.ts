import { test, expect } from "@playwright/test";
import { anonymousStorageState, headerSignInLink, headerProfileLink, loginAsUser } from "../../../../pages/user/auth";
import { accountCard } from "../../../../pages/user/profilePage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Profile — authorization.
 *
 * The profile page is fully auth-gated: the header icon is hidden from
 * anonymous users, and /profile redirects to /login?next=%2Fprofile.
 */
test.describe("Profile - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROF-001 - the Profile link is hidden from logged-out users", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(headerSignInLink(page)).toBeVisible();
    await expect(headerProfileLink(page)).toHaveCount(0);
  });

  test("PROF-002 - an anonymous user is redirected to login from /profile", async ({
    page,
  }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("PROF-003 - a logged-in user sees the Profile link", async ({ page }) => {
    await loginAsUser(page);

    await expect(headerProfileLink(page)).toBeVisible();
    await expect(headerProfileLink(page)).toHaveAttribute("href", "/profile");
  });

  test("PROF-004 - a logged-in user can open the Profile page @smoke", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/profile");

    await expect(page).toHaveURL(/\/profile$/);
    await expect(accountCard(page)).toBeVisible();
  });
});
