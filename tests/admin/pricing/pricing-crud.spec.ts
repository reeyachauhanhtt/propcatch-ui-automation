import { test, expect } from "@playwright/test";
import {
  QA_PRICING_PROJECT,
  appendOnlyNotice,
  cancelLink,
  effectiveFromInput,
  effectiveToInput,
  formatPrice,
  formErrorBanner,
  openNewPricing,
  openPricing,
  priceInput,
  pricePerSqftInput,
  pricingHeading,
  projectSelect,
  recordPrice,
  recordPriceButton,
  recordPriceHeading,
  uniqueQaPrice,
  unitSelect,
} from "../../../pages/admin/pricingPage";

/**
 * Pricing is append-only: records cannot be edited or deleted through the
 * portal. The create happy-path tests (030-036) submit "Record price" and
 * write permanent rows to the live DB — there is no cleanup by design.
 */
test.describe("Admin Pricing CRUD", () => {
  test.describe.configure({ timeout: 60_000 });

  test("ADMIN-PRICING-030 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewPricing(page);

    await expect(recordPriceHeading(page)).toBeVisible();
    await expect(projectSelect(page)).toBeVisible();
    await expect(unitSelect(page)).toBeVisible();
    await expect(priceInput(page)).toBeVisible();
    await expect(pricePerSqftInput(page)).toBeVisible();
    await expect(effectiveFromInput(page)).toBeVisible();
    await expect(effectiveToInput(page)).toBeVisible();
    await expect(recordPriceButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
  });

  test("ADMIN-PRICING-031 — empty required fields show validation", async ({
    page,
  }) => {
    await openNewPricing(page);
    await recordPriceButton(page).click();

    await expect(page).toHaveURL(/\/pricing\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    await expect(recordPriceHeading(page)).toBeVisible();
  });

  test("ADMIN-PRICING-032 — Cancel returns to the pricing list", async ({
    page,
  }) => {
    await openNewPricing(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/pricing\/?$/);
    await expect(pricingHeading(page)).toBeVisible();
  });

  test("ADMIN-PRICING-033 — form states the append-only contract", async ({
    page,
  }) => {
    await openNewPricing(page);
    await expect(appendOnlyNotice(page)).toBeVisible();
  });

  test("ADMIN-PRICING-034 — list exposes no edit or delete actions @smoke", async ({
    page,
  }) => {
    await openPricing(page);
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
  });

  test("ADMIN-PRICING-035 — can record a project-level price @smoke", async ({
    page,
  }) => {
    const price = uniqueQaPrice();

    await recordPrice(page, {
      project: QA_PRICING_PROJECT,
      price: String(price),
      effectiveFrom: "2028-06-15",
    });

    await expect(page).toHaveURL(/[?&]project=/);
    await expect(page.getByText("Filtered by project.")).toBeVisible();
    await expect(page.getByText(formatPrice(price), { exact: true })).toBeVisible();
  });

  test("ADMIN-PRICING-036 — can record a unit-level price", async ({
    page,
  }) => {
    const price = uniqueQaPrice();

    await recordPrice(page, {
      project: QA_PRICING_PROJECT,
      unit: "U-101",
      price: String(price),
      effectiveFrom: "2028-06-15",
    });

    await expect(page).toHaveURL(/[?&]unit=/);
    await expect(page.getByText("Filtered by unit.")).toBeVisible();
    await expect(page.getByText(formatPrice(price), { exact: true })).toBeVisible();
  });
});
