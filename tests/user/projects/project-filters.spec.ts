import { test, expect } from "@playwright/test";
import {
  cityChip,
  clearAllFiltersButton,
  configChip,
  emptyStateMessage,
  filtersButton,
  filtersPanel,
  projectCards,
  readCountFromLabel,
  saveThisSearchButton,
  searchInput,
  statusChip,
} from "../../../pages/user/projectListingPage";

/**
 * Project filter behaviour on /projects (PUBLIC, no auth gate).
 */
test.describe("Project Listing - Filters", () => {
  test.describe.configure({ timeout: 45_000 });

  // ------------------------------------------------------------------
  // 5 & 6. Filters
  // ------------------------------------------------------------------

  test("PROJECT-014 - Filters control opens the filter panel", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(filtersButton(page)).toBeVisible();
    for (const city of ["All", "Ahmedabad", "Mumbai", "Surat"]) {
      await expect(cityChip(page, city)).toBeVisible();
    }

    await filtersButton(page).click();

    await expect(filtersPanel(page)).toBeVisible();
    await expect(page.locator("main").getByText("CONFIGURATION", { exact: true })).toBeVisible();
    for (const status of ["New Launch", "Under Construction", "Ready to Move"]) {
      await expect(statusChip(page, status)).toBeVisible();
    }
    for (const config of ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Penthouse"]) {
      await expect(configChip(page, config)).toBeVisible();
    }
  });

  test("PROJECT-015 - STATUS filter updates the results", async ({ page }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "Under Construction").click();

    await expect(page.getByText(/11 of 21 match your filters/)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(11);
    const badges = await projectCards(page).evaluateAll((els) =>
      els.map(
        (el) => el.querySelector("span.rounded-full")?.textContent?.trim() ?? "",
      ),
    );
    for (const badge of badges) {
      expect(badge).toMatch(/Under Construction/);
    }
  });

  test("PROJECT-016 - CONFIGURATION filter updates the results", async ({
    page,
  }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await configChip(page, "2 BHK").click();

    await expect(page.getByText(/10 of 21 match your filters/)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(10);
  });

  test("PROJECT-017 - an individual city filter can be cleared", async ({
    page,
  }) => {
    await page.goto("/projects");

    await cityChip(page, "Mumbai").click();
    await expect(page.getByText(/8 of 21 match your filters/)).toBeVisible();
    await expect(cityChip(page, "Mumbai")).toHaveClass(/bg-accent/);

    await cityChip(page, "All").click();
    await expect(page.getByText(/21 of 21 match your filters/)).toBeVisible();
    await expect(cityChip(page, "Mumbai")).not.toHaveClass(/bg-accent/);
  });

  test("PROJECT-018 - Clear all filters resets the results", async ({ page }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "Under Construction").click();
    await configChip(page, "2 BHK").click();
    await expect(page.getByText(/4 of 21 match your filters/)).toBeVisible();
    await expect(saveThisSearchButton(page)).toBeVisible();

    await clearAllFiltersButton(page).click();

    await expect(page.getByText(/21 of 21 match your filters/)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(21);
  });

  test("PROJECT-019 - applying two filters together narrows the results", async ({
    page,
  }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "Under Construction").click();
    await configChip(page, "2 BHK").click();

    await expect(page.getByText(/4 of 21 match your filters/)).toBeVisible();
    const badges = await projectCards(page).evaluateAll((els) =>
      els.map(
        (el) => el.querySelector("span.rounded-full")?.textContent?.trim() ?? "",
      ),
    );
    for (const badge of badges) {
      expect(badge).toMatch(/Under Construction/);
    }
  });

  test("PROJECT-020 - multiple filters clear cleanly", async ({ page }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "Under Construction").click();
    await configChip(page, "2 BHK").click();
    await expect(projectCards(page)).toHaveCount(4);

    await clearAllFiltersButton(page).click();

    await expect(projectCards(page)).toHaveCount(21);
    await expect(statusChip(page, "Under Construction")).not.toHaveClass(/bg-primary/);
    await expect(configChip(page, "2 BHK")).not.toHaveClass(/bg-primary/);
  });

  test("PROJECT-021 - changing one filter keeps the other active", async ({
    page,
  }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "Under Construction").click();
    await configChip(page, "2 BHK").click();
    await expect(page.getByText(/4 of 21 match your filters/)).toBeVisible();

    await statusChip(page, "Ready to Move").click();

    const { shown } = await readCountFromLabel(page);
    expect(shown).toBeGreaterThan(0);
    await expect(projectCards(page)).toHaveCount(shown);
    const badges = await projectCards(page).evaluateAll((els) =>
      els.map(
        (el) => el.querySelector("span.rounded-full")?.textContent?.trim() ?? "",
      ),
    );
    for (const badge of badges) {
      expect(badge).toMatch(/Ready to Move/);
    }
    await expect(configChip(page, "2 BHK")).toHaveClass(/bg-primary/);
  });

  // ------------------------------------------------------------------
  // 11. Empty states
  // ------------------------------------------------------------------

  test("PROJECT-029 - a filter with no matching results shows an empty state and recovers", async ({
    page,
  }) => {
    await page.goto("/projects");
    await filtersButton(page).click();

    await statusChip(page, "New Launch").click();
    await expect(page.getByText(/0 of 21 match your filters/)).toBeVisible();
    await expect(emptyStateMessage(page)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(0);

    await clearAllFiltersButton(page).click();
    await expect(projectCards(page)).toHaveCount(21);
  });

  // ------------------------------------------------------------------
  // 15. Filter / search state
  // ------------------------------------------------------------------

  test("PROJECT-033 - filter state resets after navigating away and back", async ({
    page,
  }) => {
    await page.goto("/projects");

    await cityChip(page, "Mumbai").click();
    await expect(page.getByText(/8 of 21 match your filters/)).toBeVisible();

    await projectCards(page).first().click();
    await expect(page).toHaveURL(/\/p\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText(/21 of 21 match your filters/)).toBeVisible();
  });

  test("PROJECT-034 - search and filter state resets after refresh", async ({
    page,
  }) => {
    await page.goto("/projects");

    await cityChip(page, "Mumbai").click();
    await searchInput(page).fill("Montessa");
    await expect(page.getByText(/1 of 21 match your filters/)).toBeVisible();

    await page.reload();

    await expect(searchInput(page)).toHaveValue("");
    await expect(page.getByText(/21 of 21 match your filters/)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(21);
  });
});
