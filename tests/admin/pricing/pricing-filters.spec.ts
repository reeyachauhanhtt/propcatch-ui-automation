import { test, expect } from "@playwright/test";
import {
  applyPricingFilters,
  collectPricingPricePerSqft,
  collectPricingPrices,
  collectPricingProjects,
  openPricing,
  resetPricingFilters,
} from "../../../pages/admin/pricingPage";

test.describe("Admin Pricing filters", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await openPricing(page);
  });

  test("ADMIN-PRICING-020 — project filter narrows to that project @smoke", async ({
    page,
  }) => {
    await applyPricingFilters(page, { project: "Montessa Heights" });

    await expect(page).toHaveURL(/[?&]project=/);
    const projects = await collectPricingProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toBe("Montessa Heights");
    }
  });

  test("ADMIN-PRICING-021 — min and max price filter narrow the price range", async ({
    page,
  }) => {
    await applyPricingFilters(page, {
      minPrice: "5000000",
      maxPrice: "15000000",
    });

    await expect(page).toHaveURL(/[?&]minPrice=5000000/);
    await expect(page).toHaveURL(/[?&]maxPrice=15000000/);
    const prices = await collectPricingPrices(page);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(5_000_000);
      expect(price).toBeLessThanOrEqual(15_000_000);
    }
  });

  test("ADMIN-PRICING-022 — min and max price-per-sqft filter narrow the ₹/sqft range", async ({
    page,
  }) => {
    await applyPricingFilters(page, {
      minPricePerSqft: "8000",
      maxPricePerSqft: "10000",
    });

    await expect(page).toHaveURL(/[?&]minPricePerSqft=8000/);
    await expect(page).toHaveURL(/[?&]maxPricePerSqft=10000/);
    const values = await collectPricingPricePerSqft(page);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(8_000);
      expect(value).toBeLessThanOrEqual(10_000);
    }
  });

  test("ADMIN-PRICING-023 — Reset clears filters back to the full list", async ({
    page,
  }) => {
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

  test("ADMIN-PRICING-024 — different project filters return different lists", async ({
    page,
  }) => {
    const unfiltered = await collectPricingProjects(page);
    expect(unfiltered.length).toBeGreaterThan(1);

    await applyPricingFilters(page, { project: "Montessa Heights" });
    const montessa = await collectPricingProjects(page);
    expect(montessa.length).toBeGreaterThan(0);

    await resetPricingFilters(page);

    await applyPricingFilters(page, { project: "Skyline Grand" });
    const skylineGrand = await collectPricingProjects(page);
    expect(skylineGrand.length).toBeGreaterThan(0);

    const overlap = montessa.filter((name) => skylineGrand.includes(name));
    expect(overlap).toHaveLength(0);
    expect(unfiltered.length).toBeGreaterThan(montessa.length);
  });
});
