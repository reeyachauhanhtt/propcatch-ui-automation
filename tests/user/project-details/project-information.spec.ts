import { test, expect } from "@playwright/test";
import { expectNoBrokenValues } from "../../../pages/user/homePage";
import {
  aboutHeading,
  factValue,
  openProject,
} from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — key project information (Configuration, Area range, Price,
 * Possession, RERA, About). Values must render without broken placeholders
 * (undefined / null / NaN); missing values render as an em-dash "—".
 */
test.describe("Project Details - Information", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-008 - configuration is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(factValue(page, "Configuration")).toBeVisible();
    await expect(factValue(page, "Configuration")).toHaveText(
      /BHK|Villa|Office|Penthouse/,
    );
  });

  test("PROJECT-DETAIL-009 - area range is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(factValue(page, "Area range")).toBeVisible();
    await expect(factValue(page, "Area range")).toHaveText(/\d+\s*sqft/i);
  });

  test("PROJECT-DETAIL-010 - price is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(factValue(page, "Price")).toBeVisible();
    await expect(factValue(page, "Price")).toHaveText(/₹/);
  });

  test("PROJECT-DETAIL-011 - possession date is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(factValue(page, "Possession")).toBeVisible();
    await expect(factValue(page, "Possession")).toHaveText(/\d{4}/);
  });

  test("PROJECT-DETAIL-012 - RERA number is displayed when present", async ({
    page,
  }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(page.getByText(/RERA/)).toBeVisible();
    await expect(page.getByText(/[A-Z]\d{8,}/)).toBeVisible();
  });

  test("PROJECT-DETAIL-013 - About description is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(aboutHeading(page)).toBeVisible();
    await expect(page.getByText(/Premium 2, 3 & 4 BHK residences/)).toBeVisible();
    await expectNoBrokenValues(page);
  });

  test("PROJECT-DETAIL-014 - missing values render as a placeholder, not broken", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    // Montessa Heights has no area range or possession date — the page renders
    // an em-dash placeholder rather than "undefined"/"null"/"NaN".
    await expect(factValue(page, "Area range")).toHaveText("—");
    await expect(factValue(page, "Possession")).toHaveText("—");
    await expectNoBrokenValues(page);
  });
});
