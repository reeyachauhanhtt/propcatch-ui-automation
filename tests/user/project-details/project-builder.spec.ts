import { test, expect } from "@playwright/test";
import { builderLink, openProject } from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — builder attribution and navigation. Only the navigation
 * from the details page to the builder page is verified here; the full builder
 * page is out of scope.
 */
test.describe("Project Details - Builder", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-020 - builder is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(builderLink(page)).toBeVisible();
    await expect(builderLink(page)).toHaveText(/^By .+/);
  });

  test("PROJECT-DETAIL-021 - builder link navigates to the builder page", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    // Read the builder name dynamically rather than hard-coding it.
    const label = await builderLink(page).innerText();
    const builder = label.replace(/^By\s+/, "").replace(/\s*→\s*$/, "").trim();

    await builderLink(page).click();

    await expect(page).toHaveURL(/\/b\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(builder);
    await expect(
      page.getByRole("heading", { name: `Projects by ${builder}` }),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-022 - builder page lists that builder's projects", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await builderLink(page).click();
    await expect(page).toHaveURL(/\/b\//);

    await expect(page.locator('a[href^="/p/"]').first()).toBeVisible();
  });
});
