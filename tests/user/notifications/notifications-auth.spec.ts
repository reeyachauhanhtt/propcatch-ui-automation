import { test, expect } from "@playwright/test";
import { anonymousStorageState, headerSignInLink, loginAsUser } from "../../../pages/user/auth";
import { headerNotificationsLink } from "../../../pages/user/homePage";
import { notificationsHeading } from "../../../pages/user/notificationsPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Notifications — authorization.
 *
 * Notifications are fully auth-gated: the header icon is hidden for anonymous
 * users, and the /notifications route redirects to /login?next=%2Fnotifications.
 */
test.describe("Notifications - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("NOTIF-001 - the Notifications link is hidden from logged-out users", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(headerSignInLink(page)).toBeVisible();
    await expect(headerNotificationsLink(page)).toHaveCount(0);
  });

  test("NOTIF-002 - an anonymous user is redirected to login from /notifications", async ({
    page,
  }) => {
    await page.goto("/notifications");

    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("NOTIF-003 - a logged-in user sees the Notifications link", async ({
    page,
  }) => {
    await loginAsUser(page);

    await expect(headerNotificationsLink(page)).toBeVisible();
    await expect(headerNotificationsLink(page)).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  test("NOTIF-004 - a logged-in user can open the Notifications page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/notifications");

    await expect(page).toHaveURL(/\/notifications$/);
    await expect(notificationsHeading(page)).toBeVisible();
  });
});
