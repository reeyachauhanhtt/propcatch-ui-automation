import { test, expect } from "@playwright/test";
import {
  AVAILABILITY_OPTIONS,
  applyAvailabilityFilters,
  availabilityHeading,
  availabilityTable,
  clearAvailabilityFilters,
  collectAvailabilityStatuses,
  filterAgingSelect,
  filterStatusSelect,
  openAvailability,
} from "../../../pages/admin/availabilityPage";

test.describe("Admin Availability filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openAvailability(page);
  });

  test("ADMIN-AVAIL-010 — status filter lists all eight statuses @smoke", async ({
    page,
  }) => {
    const values = await filterStatusSelect(page)
      .locator("option")
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    expect(values).toEqual(["", ...AVAILABILITY_OPTIONS]);
  });

  test("ADMIN-AVAIL-011 — filtering by sold shows only Sold rows", async ({
    page,
  }) => {
    await applyAvailabilityFilters(page, { status: "sold" });

    await expect(page).toHaveURL(/[?&]status=sold/);
    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Sold");
    }
  });

  test("ADMIN-AVAIL-012 — filtering by available shows only Available rows", async ({
    page,
  }) => {
    await applyAvailabilityFilters(page, { status: "available" });

    await expect(page).toHaveURL(/[?&]status=available/);
    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Available");
    }
  });

  test("ADMIN-AVAIL-013 — project and status filters intersect @smoke", async ({
    page,
  }) => {
    await applyAvailabilityFilters(page, {
      project: "Montessa Heights",
      status: "available",
    });

    await expect(page).toHaveURL(/[?&]project=/);
    await expect(page).toHaveURL(/[?&]status=available/);

    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Available");
    }

    const projectLinks = availabilityTable(page).locator(
      'tbody tr a[href*="/projects/"]',
    );
    const count = await projectLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect(await projectLinks.nth(i).innerText()).toBe("Montessa Heights");
    }
  });

  test("ADMIN-AVAIL-014 — aging filter lists its buckets and applies cleanly", async ({
    page,
  }) => {
    const values = await filterAgingSelect(page)
      .locator("option")
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
    expect(values).toEqual(["", "7", "30", "90"]);

    await applyAvailabilityFilters(page, { aging: "7" });
    await expect(page).toHaveURL(/[?&]aging=7/);
    await expect(availabilityHeading(page)).toBeVisible();
  });

  test("ADMIN-AVAIL-015 — Clear filters returns to the unfiltered list", async ({
    page,
  }) => {
    await applyAvailabilityFilters(page, { status: "sold" });
    await expect(page).toHaveURL(/[?&]status=sold/);

    await clearAvailabilityFilters(page);

    await expect(page).toHaveURL(/\/availability\/?$/);
    await expect(availabilityHeading(page)).toBeVisible();
  });
});
