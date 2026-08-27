import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser } from "../../../../pages/user/auth";
import { openProfile, profileNavLink } from "../../../../pages/user/profilePage";
import { savedSearchesHeading } from "../../../../pages/user/savedSearchesPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Saved Searches — authorization.
 *
 * /saved-searches is fully auth-gated: it is reached from the Profile overview
 * and the footer, and the route redirects to /login?next=%2Fsaved-searches.
 * Footer and profile-link navigation are covered in their own modules, so this
 * spec only covers the gate itself and direct access.
 */
test.describe("Saved Searches - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("SS-001 - an anonymous user is redirected to login from /saved-searches", async ({
    page,
  }) => {
    await page.goto("/saved-searches");

    await expect(page).toHaveURL(/\/login\?next=%2Fsaved-searches/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("SS-002 - a logged-in user can open the Saved Searches page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/saved-searches");

    await expect(page).toHaveURL(/\/saved-searches$/);
    await expect(savedSearchesHeading(page)).toBeVisible();
  });

  test("SS-003 - the Saved Searches page opens from the Profile overview link", async ({
    page,
  }) => {
    await openProfile(page);

    await profileNavLink(page, "Saved Searches").click();

    await expect(page).toHaveURL(/\/saved-searches$/);
    await expect(savedSearchesHeading(page)).toBeVisible();
  });
});
