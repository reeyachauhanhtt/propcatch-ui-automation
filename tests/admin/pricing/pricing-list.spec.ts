import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  expectPricingListLoaded,
  filterMaxPriceInput,
  filterMaxPricePerSqftInput,
  filterMinPriceInput,
  filterMinPricePerSqftInput,
  filterProjectSelect,
  nextPageButton,
  openPricing,
  previousPageButton,
  pricingHeading,
  pricingRows,
  pricingSubtitle,
  pricingTable,
  recordPriceHeading,
  recordPriceLink,
  resetFiltersButton,
  searchInput,
} from "../../../pages/admin/pricingPage";

test.describe("Admin Pricing list", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openPricing(page);
  });

  test("ADMIN-PRICING-001 — pricing list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expectPricingListLoaded(page);
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expect(page.getByText("Module 6 — Pricing")).toBeVisible();
    await expectSidebarItemActive(page, "Pricing");
  });

  test("ADMIN-PRICING-002 — subtitle and Record price action are visible", async ({
    page,
  }) => {
    await expect(pricingSubtitle(page)).toBeVisible();
    await expect(recordPriceLink(page)).toBeVisible();
    await expect(recordPriceLink(page)).toHaveAttribute("href", "/pricing/new");
  });

  test("ADMIN-PRICING-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = pricingTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "From" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "To" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Scope" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Project" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Price" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "₹/sqft" })).toBeVisible();
    expect(await pricingRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-PRICING-004 — pagination controls are present", async ({ page }) => {
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-PRICING-005 — search and filter controls plus Reset are visible", async ({
    page,
  }) => {
    await expect(searchInput(page)).toBeVisible();
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterMinPriceInput(page)).toBeVisible();
    await expect(filterMaxPriceInput(page)).toBeVisible();
    await expect(filterMinPricePerSqftInput(page)).toBeVisible();
    await expect(filterMaxPricePerSqftInput(page)).toBeVisible();
    await expect(resetFiltersButton(page)).toBeVisible();
  });

  test("ADMIN-PRICING-006 — + Record price opens the create form", async ({
    page,
  }) => {
    await recordPriceLink(page).click();
    await expect(page).toHaveURL(/\/pricing\/new/);
    await expect(recordPriceHeading(page)).toBeVisible();
    await expect(page.getByText("Pricing / New")).toBeVisible();
  });

  test("ADMIN-PRICING-007 — pricing list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expectPricingListLoaded(page);
    await expect(pricingHeading(page)).toBeVisible();
  });

  test("ADMIN-PRICING-008 — Project link opens the project detail page @smoke", async ({
    page,
  }) => {
    const rows = pricingRows(page);
    const count = await rows.count();
    let projectName = "";
    let link = rows.first().locator('a[href*="/projects/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/projects/"]').first();
      if ((await candidate.count()) === 0) {
        continue;
      }
      const text = (await candidate.innerText()).trim();
      if (!/^QA Autotest/.test(text)) {
        projectName = text;
        link = candidate;
        break;
      }
    }
    expect(projectName.length).toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: projectName, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    // Do not edit or delete seeded projects.
  });
});
