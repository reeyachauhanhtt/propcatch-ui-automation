import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser } from "../../../../pages/user/auth";
import { openProfile, profileNavLink } from "../../../../pages/user/profilePage";
import { messagesHeading } from "../../../../pages/user/messagesPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Messages — authorization.
 *
 * /messages is fully auth-gated: there is no header link (it is reached from
 * the Profile overview), and the route redirects to /login?next=%2Fmessages.
 * Footer and profile-link navigation are covered in their own modules
 * (homepage navigation / profile overview), so this spec only covers the
 * gate itself and direct access.
 */
test.describe("Messages - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("MSG-001 - an anonymous user is redirected to login from /messages", async ({
    page,
  }) => {
    await page.goto("/messages");

    await expect(page).toHaveURL(/\/login\?next=%2Fmessages/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("MSG-002 - a logged-in user can open the Messages page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/messages");

    await expect(page).toHaveURL(/\/messages$/);
    await expect(messagesHeading(page)).toBeVisible();
  });

  test("MSG-003 - the Messages page opens from the Profile overview link", async ({
    page,
  }) => {
    await openProfile(page);

    await profileNavLink(page, "Messages").click();

    await expect(page).toHaveURL(/\/messages$/);
    await expect(messagesHeading(page)).toBeVisible();
  });
});
