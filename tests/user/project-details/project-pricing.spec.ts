import { test, expect } from "@playwright/test";
import {
  emiHeading,
  factValue,
  openProject,
} from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — pricing (price, range, starting-at CTA) and the EMI
 * calculator. Exact amounts are intentionally NOT asserted — only that a
 * price is shown, the range formatting is sane, and the calculator renders.
 */
test.describe("Project Details - Pricing", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-015 - price is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(factValue(page, "Price")).toBeVisible();
    await expect(factValue(page, "Price")).toHaveText(/₹/);
  });

  test("PROJECT-DETAIL-016 - price range is formatted as a range", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await expect(factValue(page, "Price")).toHaveText(/₹/);
    await expect(factValue(page, "Price")).toHaveText(/–/);
  });

  test("PROJECT-DETAIL-017 - starting-at price is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(page.getByText(/STARTING AT/i)).toBeVisible();
  });

  test("PROJECT-DETAIL-018 - EMI calculator is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(emiHeading(page)).toBeVisible();
    await expect(page.getByText("Loan amount")).toBeVisible();
    await expect(page.getByText(/Monthly EMI/i)).toBeVisible();
  });

  test("PROJECT-DETAIL-019 - EMI calculator exposes interactive inputs", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(sliders.nth(i)).toBeEnabled();
    }
  });
});
