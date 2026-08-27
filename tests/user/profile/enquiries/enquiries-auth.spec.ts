import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser } from "../../../../pages/user/auth";
import { openProfile, profileNavLink } from "../../../../pages/user/profilePage";
import { enquiriesHeading } from "../../../../pages/user/enquiriesPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Enquiries — authorization.
 *
 * /enquiries is fully auth-gated: it is reached from the Profile overview and
 * the footer, and the route redirects to /login?next=%2Fenquiries. Footer and
 * profile-link navigation are covered in their own modules, so this spec only
 * covers the gate itself and direct access.
 */
test.describe("Enquiries - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("ENQ-001 - an anonymous user is redirected to login from /enquiries", async ({
    page,
  }) => {
    await page.goto("/enquiries");

    await expect(page).toHaveURL(/\/login\?next=%2Fenquiries/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("ENQ-002 - a logged-in user can open the Enquiries page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/enquiries");

    await expect(page).toHaveURL(/\/enquiries$/);
    await expect(enquiriesHeading(page)).toBeVisible();
  });

  test("ENQ-003 - the Enquiries page opens from the Profile overview link", async ({
    page,
  }) => {
    await openProfile(page);

    await profileNavLink(page, "My Enquiries").click();

    await expect(page).toHaveURL(/\/enquiries$/);
    await expect(enquiriesHeading(page)).toBeVisible();
  });
});
