import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/user/auth";
import { footer } from "../../../pages/user/homePage";
import {
  expectLegalLoaded,
  openLegal,
} from "../../../pages/user/legalPage";
import { profileNavLink } from "../../../pages/user/profilePage";

/**
 * Privacy Policy (/legal/privacy) — public legal page.
 */
test.describe("Legal - Privacy Policy", () => {
  test.describe.configure({ timeout: 45_000 });

  test.describe("anonymous", () => {
    test.use({ storageState: anonymousStorageState });

    test("LEGAL-001 - privacy page loads with expected heading", async ({
      page,
    }) => {
      await openLegal(page, "privacy");
      await expectLegalLoaded(page, "privacy");
      await expect(page.getByRole("heading", { name: "What we collect" })).toBeVisible();
    });

    test("LEGAL-002 - privacy URL is /legal/privacy", async ({ page }) => {
      await page.goto("/legal/privacy");
      await expect(page).toHaveURL(/\/legal\/privacy$/);
    });
  });

  test("LEGAL-003 - privacy is reachable from homepage footer", async ({
    page,
  }) => {
    await page.goto("/");
    await footer(page).getByRole("link", { name: "Privacy Policy" }).click();
    await expectLegalLoaded(page, "privacy");
  });

  test("LEGAL-004 - privacy is reachable from profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
    await profileNavLink(page, "Privacy Policy").click();
    await expectLegalLoaded(page, "privacy");
  });

  test("LEGAL-005 - privacy page has no application error", async ({ page }) => {
    await openLegal(page, "privacy");
    await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
      0,
    );
  });
});
