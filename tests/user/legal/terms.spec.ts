import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/user/auth";
import { footer } from "../../../pages/user/homePage";
import {
  expectLegalLoaded,
  openLegal,
} from "../../../pages/user/legalPage";
import { profileNavLink } from "../../../pages/user/profilePage";

/**
 * Terms of Service (/legal/terms) — public legal page.
 */
test.describe("Legal - Terms of Service", () => {
  test.describe.configure({ timeout: 45_000 });

  test.describe("anonymous", () => {
    test.use({ storageState: anonymousStorageState });

    test("LEGAL-006 - terms page loads with expected heading", async ({
      page,
    }) => {
      await openLegal(page, "terms");
      await expectLegalLoaded(page, "terms");
      await expect(
        page.getByRole("heading", { name: "Using EstateVue" }),
      ).toBeVisible();
    });

    test("LEGAL-007 - terms URL is /legal/terms", async ({ page }) => {
      await page.goto("/legal/terms");
      await expect(page).toHaveURL(/\/legal\/terms$/);
    });
  });

  test("LEGAL-008 - terms is reachable from homepage footer", async ({
    page,
  }) => {
    await page.goto("/");
    await footer(page).getByRole("link", { name: "Terms of Service" }).click();
    await expectLegalLoaded(page, "terms");
  });

  test("LEGAL-009 - terms is reachable from profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
    await profileNavLink(page, "Terms of Service").click();
    await expectLegalLoaded(page, "terms");
  });

  test("LEGAL-010 - terms page has no application error", async ({ page }) => {
    await openLegal(page, "terms");
    await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
      0,
    );
  });
});
