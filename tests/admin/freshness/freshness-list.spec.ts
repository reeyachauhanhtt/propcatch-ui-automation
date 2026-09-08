import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  entityTypeSelect,
  freshnessCounts,
  freshnessHeading,
  freshnessModuleLabel,
  freshnessRows,
  freshnessSubtitle,
  freshnessSummary,
  freshnessTable,
  minAgeDaysInput,
  nextPageLink,
  openFreshness,
  paginationLabel,
  previousPageLink,
} from "../../../pages/admin/freshnessPage";

test.describe("Admin Data freshness list and pagination", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openFreshness(page);
  });

  test("ADMIN-FRESHNESS-001 — data freshness loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(freshnessHeading(page)).toBeVisible();
    await expect(freshnessModuleLabel(page)).toBeVisible();
    await expect(freshnessSubtitle(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Freshness");
  });

  test("ADMIN-FRESHNESS-002 — filter controls and freshness counts are visible", async ({
    page,
  }) => {
    await expect(minAgeDaysInput(page)).toHaveValue("30");
    await expect(entityTypeSelect(page)).toHaveValue("");
    await expect(freshnessCounts(page)).toBeVisible();
    for (const label of ["Builders", "Projects", "Units", "Total"]) {
      await expect(freshnessCounts(page).getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("ADMIN-FRESHNESS-003 — table has stale-record columns and rows @smoke", async ({
    page,
  }) => {
    await expect(freshnessSummary(page)).toHaveText(/Showing \d+–\d+ of \d+/);
    await expect(freshnessTable(page)).toBeVisible();
    for (const column of ["Type", "Name", "Context", "Last updated", "Age"]) {
      await expect(
        freshnessTable(page).getByRole("columnheader", { name: column }),
      ).toBeVisible();
    }
    expect(await freshnessRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-FRESHNESS-004 — Next and Prev navigate between pages @smoke", async ({
    page,
  }) => {
    await expect(paginationLabel(page)).toHaveText(/Page 1 of \d+/);
    await expect(previousPageLink(page)).toHaveAttribute("aria-disabled", "true");
    await expect(nextPageLink(page)).toHaveAttribute("aria-disabled", "false");

    const firstPageFirstRow = await freshnessRows(page).first().innerText();
    await nextPageLink(page).click();
    await expect(page).toHaveURL(/[?&]page=2/);
    await expect(paginationLabel(page)).toHaveText(/Page 2 of \d+/);
    await expect(previousPageLink(page)).toHaveAttribute("aria-disabled", "false");
    await expect(freshnessRows(page).first()).not.toHaveText(firstPageFirstRow);

    await previousPageLink(page).click();
    await expect(page).toHaveURL(/[?&]page=1/);
    await expect(paginationLabel(page)).toHaveText(/Page 1 of \d+/);
  });
});
