import { expect, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Reports helpers for https://propcatch-admin.vercel.app/reports
 *
 * Verified 2026-09-08:
 * - Module 12 — Reports / Analytics, a read-only overview.
 * - Filters: #filter-from, #filter-to, #filter-project, and Clear.
 * - Sales-rep activity table: User, Active assignments, Total assignments,
 *   Follow-ups (range).
 */

export function main(page: Page) {
  return page.getByRole("main");
}

export function reportsHeading(page: Page) {
  return page.getByRole("heading", { name: "Reports", exact: true });
}

export function reportsModuleLabel(page: Page) {
  return main(page).getByText("Module 12 — Reports / Analytics", {
    exact: true,
  });
}

export function reportsRangeLabel(page: Page) {
  return main(page).getByText(/Read-only overview\. Range:/);
}

export function filterFromInput(page: Page) {
  return page.locator("#filter-from");
}

export function filterToInput(page: Page) {
  return page.locator("#filter-to");
}

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function clearFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Clear", exact: true });
}

export function salesRepActivityHeading(page: Page) {
  return page.getByRole("heading", {
    name: "Sales-rep activity",
    exact: true,
  });
}

export function salesRepActivityTable(page: Page) {
  return main(page).getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Active assignments" }),
  });
}

export function salesRepRow(page: Page, name: string) {
  return salesRepActivityTable(page).locator("tbody tr").filter({
    has: page.getByText(name, { exact: true }),
  });
}

export async function salesRepAssignmentCounts(page: Page, name: string) {
  const row = salesRepRow(page, name);
  await expect(row).toHaveCount(1);
  const cells = await row.locator("td").allInnerTexts();
  const activeAssignments = Number(cells[1]?.trim());
  const totalAssignments = Number(cells[2]?.trim());
  if (Number.isNaN(activeAssignments) || Number.isNaN(totalAssignments)) {
    throw new Error(`Invalid assignment counts for ${name}: ${cells.join(" | ")}`);
  }
  return { activeAssignments, totalAssignments };
}

export async function openReports(page: Page) {
  await page.goto("/reports");
  await expectReportsLoaded(page);
}

export async function expectReportsLoaded(page: Page) {
  await expect(page).toHaveURL(/\/reports\/?(\?.*)?$/);
  await expect(reportsHeading(page)).toBeVisible();
  await expect(reportsModuleLabel(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function applyReportFilters(
  page: Page,
  filters: { from?: string; to?: string; project?: string },
) {
  if (filters.from !== undefined) {
    await filterFromInput(page).fill(filters.from);
    await filterFromInput(page).press("Tab");
    await expect(filterFromInput(page)).toHaveValue(filters.from);
    await expect(reportsRangeLabel(page)).toHaveText(
      `Read-only overview. Range: ${filters.from} – today.`,
      { timeout: 15_000 },
    );
  }
  if (filters.to !== undefined) {
    await filterToInput(page).fill(filters.to);
    await filterToInput(page).press("Tab");
    await expect(filterToInput(page)).toHaveValue(filters.to);
    await expect(reportsRangeLabel(page)).toHaveText(
      `Read-only overview. Range: ${filters.from ?? "earliest"} – ${filters.to}.`,
      { timeout: 15_000 },
    );
  }
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      filters.project,
    );
  }
}

export async function clearReportFilters(page: Page) {
  await clearFiltersButton(page).click();
  await expect(filterFromInput(page)).toHaveValue("");
  await expect(filterToInput(page)).toHaveValue("");
  await expect(filterProjectSelect(page)).toHaveValue("");
  await expect(reportsRangeLabel(page)).toHaveText(
    "Read-only overview. Range: Last 30 days (default).",
  );
}
