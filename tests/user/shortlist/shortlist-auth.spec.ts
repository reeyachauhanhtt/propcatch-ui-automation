import { test, expect } from "@playwright/test";
import { anonymousStorageState, headerSignInLink, loginAsUser } from "../../../pages/user/auth";
import { headerShortlistLink } from "../../../pages/user/homePage";
import { openProject } from "../../../pages/user/projectDetailsPage";
import { shortlistHeading } from "../../../pages/user/shortlistPage";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Shortlist — authorization.
 *
 * Shortlisting is fully auth-gated: the header icon is hidden from anonymous
 * users, /shortlist redirects to /login?next=%2Fshortlist, and an anonymous
 * "Save to shortlist" click redirects to /login?next=/p/<uuid>.
 */
test.describe("Shortlist - authorization", () => {
  test.describe.configure({ timeout: 45_000 });

  test("SHORT-001 - the Shortlist link is hidden from logged-out users", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(headerSignInLink(page)).toBeVisible();
    await expect(headerShortlistLink(page)).toHaveCount(0);
  });

  test("SHORT-002 - an anonymous user is redirected to login from /shortlist", async ({
    page,
  }) => {
    await page.goto("/shortlist");

    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("SHORT-003 - an anonymous 'Save to shortlist' click redirects to login", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");
    await page.getByRole("button", { name: "Save to shortlist" }).click();

    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("SHORT-004 - a logged-in user can open the Shortlist page @smoke", async ({
    page,
  }) => {
    await loginAsUser(page);

    await expect(headerShortlistLink(page)).toBeVisible();
    await expect(headerShortlistLink(page)).toHaveAttribute(
      "href",
      "/shortlist",
    );

    await page.goto("/shortlist");
    await expect(page).toHaveURL(/\/shortlist$/);
    await expect(shortlistHeading(page)).toBeVisible();
  });
});
