import { test, expect } from "@playwright/test";
import { openProject, siteVisitButton } from "../../../../pages/user/projectDetailsPage";
import { anonymousStorageState } from "../../../../pages/user/auth";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Project Details — Site Visit action.
 *
 * Only the button's presence and its sign-in gate are verified here. The full
 * Site Visit workflow (schedule / edit / cancel / validation) is a separate
 * task and will live alongside this file under actions/.
 */
test.describe("Project Details - Actions - Site Visit", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-035 - Site Visit button is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(siteVisitButton(page)).toBeVisible();
  });

  test("PROJECT-DETAIL-036 - Site Visit opens the sign-in gate when unauthenticated", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await siteVisitButton(page).click();

    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
