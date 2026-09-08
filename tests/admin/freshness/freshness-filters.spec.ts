import { test, expect } from "@playwright/test";
import {
  applyFreshnessFilters,
  collectFreshnessRowAges,
  collectFreshnessRowTypes,
  entityTypeSelect,
  freshnessRows,
  minAgeDaysInput,
  nextPageLink,
  openFreshness,
  resetFreshnessFilters,
} from "../../../pages/admin/freshnessPage";

test.describe("Admin Data freshness filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openFreshness(page);
  });

  test("ADMIN-FRESHNESS-020 — Apply filters records by entity type @smoke", async ({
    page,
  }) => {
    await applyFreshnessFilters(page, { entityType: "project" });

    await expect(entityTypeSelect(page)).toHaveValue("project");
    expect(await freshnessRows(page).count()).toBeGreaterThan(0);
    for (const type of await collectFreshnessRowTypes(page)) {
      expect(type.trim()).toBe("project");
    }
  });

  test("ADMIN-FRESHNESS-021 — Apply respects the minimum stale age", async ({
    page,
  }) => {
    await applyFreshnessFilters(page, { minAgeDays: "90" });

    await expect(minAgeDaysInput(page)).toHaveValue("90");
    expect(await freshnessRows(page).count()).toBeGreaterThan(0);
    for (const age of await collectFreshnessRowAges(page)) {
      expect(age).toBeGreaterThan(90);
    }
  });

  test("ADMIN-FRESHNESS-022 — filters remain applied while paging", async ({
    page,
  }) => {
    await applyFreshnessFilters(page, { entityType: "unit", minAgeDays: "90" });
    await expect(nextPageLink(page)).toHaveAttribute(
      "href",
      /entityType=unit/,
    );
    await expect(nextPageLink(page)).toHaveAttribute(
      "href",
      /minAgeDays=90/,
    );

    await nextPageLink(page).click();
    await expect(page).toHaveURL(/[?&]page=2/);
    await expect(entityTypeSelect(page)).toHaveValue("unit");
    await expect(minAgeDaysInput(page)).toHaveValue("90");
    for (const type of await collectFreshnessRowTypes(page)) {
      expect(type.trim()).toBe("unit");
    }
  });

  test("ADMIN-FRESHNESS-023 — Reset clears filters and returns to defaults @smoke", async ({
    page,
  }) => {
    await applyFreshnessFilters(page, { entityType: "project", minAgeDays: "90" });
    await resetFreshnessFilters(page);

    await expect(minAgeDaysInput(page)).toHaveValue("30");
    await expect(entityTypeSelect(page).locator("option:checked")).toHaveText(
      "All types",
    );
  });
});
