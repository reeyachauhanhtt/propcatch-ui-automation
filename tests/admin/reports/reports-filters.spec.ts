import { test, expect } from "@playwright/test";
import {
  applyReportFilters,
  clearReportFilters,
  filterFromInput,
  filterProjectSelect,
  filterToInput,
  openReports,
  reportsRangeLabel,
} from "../../../pages/admin/reportsPage";

test.describe("Admin Reports filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openReports(page);
  });

  test("ADMIN-REPORTS-020 — project filter applies a selected project", async ({
    page,
  }) => {
    await applyReportFilters(page, { project: "Montessa Heights" });

    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      "Montessa Heights",
    );
  });

  test("ADMIN-REPORTS-021 — date filters update the report range", async ({
    page,
  }) => {
    await applyReportFilters(page, {
      from: "2026-08-01",
      to: "2026-08-31",
    });

    await expect(filterFromInput(page)).toHaveValue("2026-08-01");
    await expect(filterToInput(page)).toHaveValue("2026-08-31");
    await expect(reportsRangeLabel(page)).toHaveText(
      "Read-only overview. Range: 2026-08-01 – 2026-08-31.",
    );
  });

  test("ADMIN-REPORTS-022 — Clear resets date and project filters @smoke", async ({
    page,
  }) => {
    await applyReportFilters(page, {
      from: "2026-08-01",
      to: "2026-08-31",
      project: "Montessa Heights",
    });

    await clearReportFilters(page);

    await expect(filterFromInput(page)).toHaveValue("");
    await expect(filterToInput(page)).toHaveValue("");
    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      "All projects",
    );
  });
});
