import { test, expect } from "@playwright/test";
import {
  AVAILABILITY_OPTIONS,
  STATUS_LABELS,
  applyAvailabilityFilters,
  availabilityHeading,
  availabilityRows,
  availabilityTable,
  collectAvailabilityStatuses,
  filterAgingSelect,
  filterStatusSelect,
  openAvailability,
} from "../../../pages/admin/availabilityPage";

/**
 * Regression guards for verified availability-list behaviors not already
 * covered by the list/filter specs. All read-only.
 */
test.describe("Admin Availability regression", () => {
  test.describe.configure({ timeout: 60_000 });

  test("ADMIN-AVAIL-030 — deep-link status query applies on load @smoke", async ({
    page,
  }) => {
    await page.goto("/availability?status=sold");

    await expect(page).toHaveURL(/[?&]status=sold/);
    await expect(availabilityHeading(page)).toBeVisible();
    await expect(filterStatusSelect(page)).toHaveValue("sold");

    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Sold");
    }
  });

  test("ADMIN-AVAIL-031 — deep-link aging query applies on load", async ({
    page,
  }) => {
    await page.goto("/availability?aging=7");

    await expect(page).toHaveURL(/[?&]aging=7/);
    await expect(availabilityHeading(page)).toBeVisible();
    await expect(filterAgingSelect(page)).toHaveValue("7");
  });

  test("ADMIN-AVAIL-032 — status labels render title-case", async ({ page }) => {
    await openAvailability(page);

    const seeded = [
      ["available", STATUS_LABELS.available],
      ["booked", STATUS_LABELS.booked],
      ["sold", STATUS_LABELS.sold],
      ["rented", STATUS_LABELS.rented],
    ] as const;

    for (const [value, label] of seeded) {
      await applyAvailabilityFilters(page, { status: value });
      const statuses = await collectAvailabilityStatuses(page);
      expect(statuses.length).toBeGreaterThan(0);
      for (const status of statuses) {
        expect(status).toBe(label);
      }
    }
  });

  test("ADMIN-AVAIL-033 — each quick-change select lists all eight statuses", async ({
    page,
  }) => {
    await openAvailability(page);

    const first = availabilityTable(page)
      .locator('[data-testid="quick-status-select"]')
      .first();
    const values = await first
      .locator("option")
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    expect(values).toEqual([...AVAILABILITY_OPTIONS]);
  });

  test("ADMIN-AVAIL-034 — Last touched column shows aging badges", async ({
    page,
  }) => {
    await openAvailability(page);

    const rows = availabilityRows(page);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const badges: string[] = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator("td").nth(5);
      if ((await cell.count()) === 0) {
        continue;
      }
      const text = (await cell.innerText()).trim();
      if (text) {
        badges.push(text);
      }
    }

    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      expect(badge).toMatch(/(ago|just now)/i);
    }
  });
});
