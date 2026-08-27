import { test, expect } from "@playwright/test";
import { floorPlansHeading, openProject } from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — media (hero image gallery and floor plans).
 *
 * Media is OPTIONAL: "Aurelia Sky Residences" has a 7-image hero gallery;
 * "Azure Crest Residences" additionally has a floor-plans section. No project
 * currently exposes video. Only functional behaviour is asserted (image loads,
 * counter, next/previous), not visual appearance.
 */
test.describe("Project Details - Media", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-026 - hero image is displayed", async ({ page }) => {
    await openProject(page, "Aurelia Sky Residences");

    const hero = page.locator("main img").first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("alt", /Aurelia Sky Residences/);
  });

  test("PROJECT-DETAIL-027 - gallery counter is displayed", async ({ page }) => {
    await openProject(page, "Aurelia Sky Residences");

    await expect(page.getByText(/1\s*\/\s*7/)).toBeVisible();
  });

  test("PROJECT-DETAIL-028 - Next image advances the gallery", async ({ page }) => {
    await openProject(page, "Aurelia Sky Residences");

    const hero = page.locator("main img").first();
    await expect(hero).toHaveAttribute("alt", /1\/7/);

    await page.getByRole("button", { name: "Next image" }).click();

    await expect(hero).toHaveAttribute("alt", /2\/7/);
  });

  test("PROJECT-DETAIL-029 - Previous image control is available", async ({
    page,
  }) => {
    await openProject(page, "Aurelia Sky Residences");

    await expect(page.getByRole("button", { name: "Previous image" })).toBeVisible();
  });

  test("PROJECT-DETAIL-030 - floor plans are displayed and open in a new tab", async ({
    page,
  }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(floorPlansHeading(page)).toBeVisible();

    const floorPlanLink = page.locator('a[href*="floor_plan"]').first();
    await expect(floorPlanLink).toBeVisible();
    await expect(floorPlanLink).toHaveAttribute("target", "_blank");
  });
});
