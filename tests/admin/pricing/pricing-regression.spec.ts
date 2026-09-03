import { test, expect } from "@playwright/test";
import {
  applyPricingFilters,
  collectPricingPricePerSqft,
  collectPricingPrices,
  collectPricingProjects,
  filterMinPriceInput,
  openPricing,
  pricingHeading,
  resetPricingFilters,
  searchInput,
  searchPricing,
} from "../../../pages/admin/pricingPage";

/**
 * Regression guards for verified pricing-list behaviors that are not already
 * covered by the positive list/search/filter specs. All read-only.
 *
 * Note: a filtered view (deep-link or filter) replaces the static subtitle
 * with a "Filtered by …" notice, so filtered pages assert on the heading
 * rather than expectPricingListLoaded().
 */
test.describe("Admin Pricing regression", () => {
  test.describe.configure({ timeout: 60_000 });

  test("ADMIN-PRICING-040 — deep-link search query applies on load @smoke", async ({
    page,
  }) => {
    await page.goto("/pricing?q=Skyline");

    await expect(page).toHaveURL(/[?&]q=Skyline/);
    await expect(pricingHeading(page)).toBeVisible();
    await expect(searchInput(page)).toHaveValue("Skyline");
    const projects = await collectPricingProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toContain("Skyline");
    }
  });

  test("ADMIN-PRICING-041 — deep-link min-price query applies on load", async ({
    page,
  }) => {
    await page.goto("/pricing?minPrice=10000000");

    await expect(page).toHaveURL(/[?&]minPrice=10000000/);
    await expect(pricingHeading(page)).toBeVisible();
    // The input is populated (displays Indian grouping), even if it re-formats.
    await expect(filterMinPriceInput(page)).not.toHaveValue("");
    const prices = await collectPricingPrices(page);
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(10_000_000);
    }
  });

  test("ADMIN-PRICING-042 — search is case-insensitive", async ({ page }) => {
    await openPricing(page);
    await searchPricing(page, "skyline");

    await expect(page).toHaveURL(/[?&]q=skyline/);
    const projects = await collectPricingProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toContain("Skyline");
    }
  });

  test("ADMIN-PRICING-043 — search matches partial project names", async ({
    page,
  }) => {
    await openPricing(page);
    await searchPricing(page, "Sky");

    await expect(page).toHaveURL(/[?&]q=Sky/);
    const projects = await collectPricingProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project.toLowerCase()).toContain("sky");
    }
  });

  test("ADMIN-PRICING-044 — project and price filters combine @smoke", async ({
    page,
  }) => {
    await openPricing(page);
    await applyPricingFilters(page, {
      project: "Montessa Heights",
      minPrice: "1000000",
    });

    await expect(page).toHaveURL(/[?&]project=/);
    await expect(page).toHaveURL(/[?&]minPrice=1000000/);
    const projects = await collectPricingProjects(page);
    for (const project of projects) {
      expect(project).toBe("Montessa Heights");
    }
    const prices = await collectPricingPrices(page);
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(1_000_000);
    }
  });

  test("ADMIN-PRICING-045 — Reset clears combined filters", async ({ page }) => {
    await openPricing(page);
    const before = await collectPricingProjects(page);

    await applyPricingFilters(page, {
      project: "Montessa Heights",
      minPrice: "1000000",
    });
    await expect(page).toHaveURL(/[?&]project=/);

    await resetPricingFilters(page);

    await expect(page).toHaveURL(/\/pricing\/?$/);
    const after = await collectPricingProjects(page);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  test("ADMIN-PRICING-046 — Price and ₹/sqft columns are well-formed", async ({
    page,
  }) => {
    await openPricing(page);

    const prices = await collectPricingPrices(page);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBeGreaterThanOrEqual(0);
    }

    const perSqft = await collectPricingPricePerSqft(page);
    for (const value of perSqft) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
