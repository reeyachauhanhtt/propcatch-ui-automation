import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/user/auth";
import { footer } from "../../../pages/user/homePage";
import {
  deletionReasonField,
  expectLegalLoaded,
  openLegal,
  submitDeletionButton,
} from "../../../pages/user/legalPage";

/**
 * Data Deletion (/legal/data-deletion) — public legal page with a deletion
 * request form. Specs assert the CTA exists but do NOT submit it against the
 * shared authenticated test user.
 */
test.describe("Legal - Data Deletion", () => {
  test.describe.configure({ timeout: 45_000 });

  test.describe("anonymous", () => {
    test.use({ storageState: anonymousStorageState });

    test("LEGAL-011 - data-deletion page loads with expected heading", async ({
      page,
    }) => {
      await openLegal(page, "data-deletion");
      await expectLegalLoaded(page, "data-deletion");
    });

    test("LEGAL-012 - data-deletion URL is /legal/data-deletion", async ({
      page,
    }) => {
      await page.goto("/legal/data-deletion");
      await expect(page).toHaveURL(/\/legal\/data-deletion$/);
    });

    test("LEGAL-013 - deletion request form controls are present (no submit)", async ({
      page,
    }) => {
      await openLegal(page, "data-deletion");

      await expect(deletionReasonField(page)).toBeVisible();
      await expect(submitDeletionButton(page)).toBeVisible();
      await expect(submitDeletionButton(page)).toBeEnabled();
      // Intentionally do not click Submit — would request permanent deletion.
    });
  });

  test("LEGAL-014 - data-deletion is reachable from homepage footer", async ({
    page,
  }) => {
    await page.goto("/");
    await footer(page).getByRole("link", { name: "Data Deletion" }).click();
    await expectLegalLoaded(page, "data-deletion");
  });

  test("LEGAL-015 - data-deletion is reachable from profile", async ({
    page,
  }) => {
    await page.goto("/profile");
    await page
      .locator("main a", {
        has: page.getByText("Data Deletion Request", { exact: true }),
      })
      .click();
    await expectLegalLoaded(page, "data-deletion");
  });

  test("LEGAL-016 - data-deletion page has no application error", async ({
    page,
  }) => {
    await openLegal(page, "data-deletion");
    await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
      0,
    );
  });
});
