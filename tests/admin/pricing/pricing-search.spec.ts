import { test, expect } from "@playwright/test";
import {
  collectPricingProjects,
  openPricing,
  resetPricingFilters,
  searchInput,
  searchPricing,
} from "../../../pages/admin/pricingPage";

test.describe("Admin Pricing search", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openPricing(page);
  });

  test("ADMIN-PRICING-010 — searching by project name filters rows @smoke", async ({
    page,
  }) => {
    const before = await collectPricingProjects(page);
    expect(before.length).toBeGreaterThan(1);
    // The unfiltered first page is broader than just Skyline projects.
    expect(before.some((project) => !project.includes("Skyline"))).toBe(true);

    await searchPricing(page, "Skyline");

    await expect(page).toHaveURL(/[?&]q=Skyline/);
    const matches = await collectPricingProjects(page);
    expect(matches.length).toBeGreaterThan(0);
    for (const project of matches) {
      expect(project).toContain("Skyline");
    }
  });

  test("ADMIN-PRICING-011 — search with no matching project yields an empty list", async ({
    page,
  }) => {
    await searchPricing(page, "zzzz-no-such-project-qa");

    await expect(page).toHaveURL(/[?&]q=/);
    const matches = await collectPricingProjects(page);
    expect(matches).toHaveLength(0);
  });

  test("ADMIN-PRICING-012 — Reset clears the search back to the full list", async ({
    page,
  }) => {
    const before = await collectPricingProjects(page);

    await searchPricing(page, "Skyline");
    await expect(searchInput(page)).toHaveValue("Skyline");

    await resetPricingFilters(page);

    await expect(page).toHaveURL(/\/pricing\/?$/);
    const after = await collectPricingProjects(page);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });
});
