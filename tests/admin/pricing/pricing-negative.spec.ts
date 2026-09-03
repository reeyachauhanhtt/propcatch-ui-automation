import { test, expect } from "@playwright/test";
import {
  QA_PRICING_PROJECT,
  effectiveFromInput,
  filterMinPriceInput,
  main,
  openNewPricing,
  openPricing,
  priceInput,
  pricePerSqftInput,
  pricingEmptyState,
  projectSelect,
  recordPriceButton,
  searchPricing,
} from "../../../pages/admin/pricingPage";

/**
 * Negative / edge-case coverage.
 *
 * Create-form cases are write-safe by construction:
 * - Negative price / price-per-sqft are NOT rejected — the controlled inputs
 *   normalize them to "0". We assert that normalization read-only (no submit),
 *   so nothing is written.
 * - A missing required field triggers native HTML5 validation (type=number
 *   min=0 required / type=date required), which blocks the submit event before
 *   any request, so the empty-price case never writes a row.
 *
 * Search / filter cases are read-only.
 */
test.describe("Admin Pricing negative", () => {
  test.describe.configure({ timeout: 60_000 });

  test("ADMIN-PRICING-050 — negative price is normalized to zero @smoke", async ({
    page,
  }) => {
    await openNewPricing(page);
    await priceInput(page).fill("-100");

    // The controlled input clamps negatives to 0 rather than accepting them.
    await expect(priceInput(page)).toHaveValue("0");
  });

  test("ADMIN-PRICING-051 — negative price-per-sqft is normalized to zero", async ({
    page,
  }) => {
    await openNewPricing(page);
    await pricePerSqftInput(page).fill("-500");

    await expect(pricePerSqftInput(page)).toHaveValue("0");
  });

  test("ADMIN-PRICING-052 — price is required even with project and dates set", async ({
    page,
  }) => {
    await openNewPricing(page);
    await projectSelect(page).selectOption({ label: QA_PRICING_PROJECT });
    await effectiveFromInput(page).fill("2028-06-15");
    // price left empty

    const validity = await priceInput(page).evaluate((el) => ({
      valid: (el as HTMLInputElement).validity.valid,
      valueMissing: (el as HTMLInputElement).validity.valueMissing,
    }));
    expect(validity.valid).toBe(false);
    expect(validity.valueMissing).toBe(true);

    await recordPriceButton(page).click();
    await expect(page).toHaveURL(/\/pricing\/new/); // no redirect → no write
  });

  test("ADMIN-PRICING-053 — special characters in search yield the empty state", async ({
    page,
  }) => {
    await openPricing(page);
    await searchPricing(page, "!!!@@@###");

    await expect(page).toHaveURL(/[?&]q=/);
    await expect(pricingEmptyState(page)).toBeVisible();
  });

  test("ADMIN-PRICING-054 — no-match search shows the empty-state hint", async ({
    page,
  }) => {
    await openPricing(page);
    await searchPricing(page, "zzzz-no-such-project-qa");

    await expect(pricingEmptyState(page)).toBeVisible();
    await expect(
      main(page).getByText("Add the first price entry"),
    ).toBeVisible();
  });

  test("ADMIN-PRICING-055 — negative min-price filter is normalized to positive", async ({
    page,
  }) => {
    await openPricing(page);
    await filterMinPriceInput(page).fill("-100");

    await expect(page).toHaveURL(/[?&]minPrice=100/, { timeout: 15_000 });
    expect(page.url()).not.toContain("minPrice=-");
  });
});
