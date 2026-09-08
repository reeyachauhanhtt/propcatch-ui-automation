import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  clearFiltersButton,
  filterFromInput,
  filterProjectSelect,
  filterToInput,
  openReports,
  reportsHeading,
  reportsModuleLabel,
  reportsRangeLabel,
  salesRepActivityHeading,
  salesRepActivityTable,
} from "../../../pages/admin/reportsPage";

test.describe("Admin Reports overview", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openReports(page);
  });

  test("ADMIN-REPORTS-001 — reports loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(reportsHeading(page)).toBeVisible();
    await expect(reportsModuleLabel(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Reports");
  });

  test("ADMIN-REPORTS-002 — defaults to the last-30-days overview", async ({
    page,
  }) => {
    await expect(reportsRangeLabel(page)).toHaveText(
      "Read-only overview. Range: Last 30 days (default).",
    );
  });

  test("ADMIN-REPORTS-003 — date/project filters and Clear are visible", async ({
    page,
  }) => {
    await expect(filterFromInput(page)).toBeVisible();
    await expect(filterToInput(page)).toBeVisible();
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      "All projects",
    );
    await expect(clearFiltersButton(page)).toBeVisible();
  });

  test("ADMIN-REPORTS-004 — sales-rep activity displays assignment metrics @smoke", async ({
    page,
  }) => {
    await expect(salesRepActivityHeading(page)).toBeVisible();
    const table = salesRepActivityTable(page);
    await expect(table).toBeVisible();
    for (const column of [
      "User",
      "Active assignments",
      "Total assignments",
      "Follow-ups (range)",
    ]) {
      await expect(table.getByRole("columnheader", { name: column })).toBeVisible();
    }
    expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);
  });
});
