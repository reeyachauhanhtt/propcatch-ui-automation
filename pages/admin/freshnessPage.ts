import { expect, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Data Freshness helpers for /data-freshness.
 *
 * Verified 2026-09-08:
 * - Module 20 — Data freshness alerts.
 * - GET filters: #minAgeDays and #entityType; Reset is a link and Apply
 *   submits the form.
 * - Pagination links: ← Prev and Next →, preserving applied filters.
 */

export function main(page: Page) {
  return page.getByRole("main");
}

export function freshnessHeading(page: Page) {
  return page.getByRole("heading", { name: "Data freshness", exact: true });
}

export function freshnessModuleLabel(page: Page) {
  return main(page).getByText("Module 20 — Data freshness alerts", {
    exact: true,
  });
}

export function freshnessSubtitle(page: Page) {
  return main(page).getByText(
    "Records that haven't been touched in more than 30 days. Refresh cadence is driven by M2 updated_at triggers.",
  );
}

export function freshnessFilters(page: Page) {
  return page.getByTestId("freshness-filters");
}

export function minAgeDaysInput(page: Page) {
  return page.locator("#minAgeDays");
}

export function entityTypeSelect(page: Page) {
  return page.locator("#entityType");
}

export function resetFiltersLink(page: Page) {
  return freshnessFilters(page).getByRole("link", { name: "Reset", exact: true });
}

export function applyFiltersButton(page: Page) {
  return freshnessFilters(page).getByRole("button", { name: "Apply", exact: true });
}

export function freshnessCounts(page: Page) {
  return page.getByTestId("freshness-counts");
}

export function freshnessSummary(page: Page) {
  return page.getByTestId("freshness-summary");
}

export function freshnessTable(page: Page) {
  return page.getByTestId("freshness-table");
}

export function freshnessRows(page: Page) {
  return freshnessTable(page).locator("tbody tr");
}

export function previousPageLink(page: Page) {
  return main(page).getByRole("link", { name: "← Prev", exact: true }).last();
}

export function nextPageLink(page: Page) {
  return main(page).getByRole("link", { name: "Next →", exact: true }).last();
}

export function paginationLabel(page: Page) {
  return main(page).getByText(/Page \d+ of \d+/).last();
}

export async function openFreshness(page: Page) {
  await page.goto("/data-freshness");
  await expectFreshnessListLoaded(page);
}

export async function expectFreshnessListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/data-freshness\/?(\?.*)?$/);
  await expect(freshnessHeading(page)).toBeVisible();
  await expect(freshnessSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function applyFreshnessFilters(
  page: Page,
  filters: { minAgeDays?: string; entityType?: "builder" | "project" | "unit" },
) {
  if (filters.minAgeDays !== undefined) {
    await minAgeDaysInput(page).fill(filters.minAgeDays);
  }
  if (filters.entityType !== undefined) {
    await entityTypeSelect(page).selectOption(filters.entityType);
  }
  await applyFiltersButton(page).click();
  if (filters.minAgeDays !== undefined) {
    await expect(page).toHaveURL(
      new RegExp(`[?&]minAgeDays=${filters.minAgeDays}`),
    );
  }
  if (filters.entityType !== undefined) {
    await expect(page).toHaveURL(
      new RegExp(`[?&]entityType=${filters.entityType}`),
    );
  }
}

export async function resetFreshnessFilters(page: Page) {
  await resetFiltersLink(page).click();
  await expect(page).toHaveURL(/\/data-freshness\/?$/);
  await expect(minAgeDaysInput(page)).toHaveValue("30");
  await expect(entityTypeSelect(page)).toHaveValue("");
}

export async function collectFreshnessRowTypes(page: Page) {
  return freshnessRows(page).locator("td:nth-child(1)").allInnerTexts();
}

export async function collectFreshnessRowAges(page: Page) {
  const texts = await freshnessRows(page).locator("td:nth-child(5)").allInnerTexts();
  return texts.map((text) => Number.parseInt(text, 10));
}
