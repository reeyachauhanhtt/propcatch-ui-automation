import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser } from "../../../../pages/user/auth";
import { openProfile, profileNavLink } from "../../../../pages/user/profilePage";
import { visitsHeading } from "../../../../pages/user/visitsPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Site Visits — authorization.
 *
 * /visits is fully auth-gated: it is reached from the Profile overview and the
 * route redirects to /login?next=%2Fvisits. Profile-link navigation is covered
 * here (the "Site Visits" entry is a Profile overview link), and the footer /
 * homepage entry points are covered in their own modules, so this spec only
 * covers the gate itself and direct access.
 */
test.describe("Site Visits - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("VISIT-001 - an anonymous user is redirected to login from /visits", async ({
    page,
  }) => {
    await page.goto("/visits");

    await expect(page).toHaveURL(/\/login\?next=%2Fvisits/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("VISIT-002 - a logged-in user can open the Site Visits page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/visits");

    await expect(page).toHaveURL(/\/visits$/);
    await expect(visitsHeading(page)).toBeVisible();
  });

  test("VISIT-003 - the Site Visits page opens from the Profile overview link", async ({
    page,
  }) => {
    await openProfile(page);

    await profileNavLink(page, "Site Visits").click();

    await expect(page).toHaveURL(/\/visits$/);
    await expect(visitsHeading(page)).toBeVisible();
  });
});
