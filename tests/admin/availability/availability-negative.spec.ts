import { test, expect } from "@playwright/test";
import {
  applyAvailabilityFilters,
  availabilityEmptyState,
  availabilityHeading,
  clearAvailabilityFilters,
  collectAvailabilityStatuses,
  filterAgingSelect,
  filterProjectSelect,
  filterStatusSelect,
  openAvailability,
} from "../../../pages/admin/availabilityPage";

/**
 * Edge-case coverage for the availability list. All read-only — the filters are
 * <select> controls, so there is no free-text/negative input on this page.
 */
test.describe("Admin Availability negative", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openAvailability(page);
  });

  test("ADMIN-AVAIL-040 — a status with no units yields the empty state", async ({
    page,
  }) => {
    // "blocked" has no seeded units.
    await applyAvailabilityFilters(page, { status: "blocked" });

    await expect(page).toHaveURL(/[?&]status=blocked/);
    await expect(availabilityEmptyState(page)).toBeVisible();
    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses).toHaveLength(0);
  });

  test("ADMIN-AVAIL-041 — filters default to All statuses / Any age / All projects", async ({
    page,
  }) => {
    await expect(filterStatusSelect(page)).toHaveValue("");
    await expect(filterAgingSelect(page)).toHaveValue("");
    await expect(filterProjectSelect(page)).toHaveValue("");
  });

  test("ADMIN-AVAIL-042 — Clear filters with no filters applied is idempotent", async ({
    page,
  }) => {
    await clearAvailabilityFilters(page);
    await expect(page).toHaveURL(/\/availability\/?$/);
    await expect(availabilityHeading(page)).toBeVisible();
  });

  test("ADMIN-AVAIL-043 — combined status and aging filters stay consistent", async ({
    page,
  }) => {
    await applyAvailabilityFilters(page, { status: "sold", aging: "90" });

    await expect(page).toHaveURL(/[?&]status=sold/);
    await expect(page).toHaveURL(/[?&]aging=90/);
    await expect(availabilityHeading(page)).toBeVisible();

    // Any rows still shown must honor the status filter (empty is also valid).
    const statuses = await collectAvailabilityStatuses(page);
    for (const status of statuses) {
      expect(status).toBe("Sold");
    }
  });
});
