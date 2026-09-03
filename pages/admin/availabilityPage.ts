import { expect, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";
import { AVAILABILITY_OPTIONS } from "./unitsPage";

/**
 * Admin Availability helpers for https://propcatch-admin.vercel.app/availability
 *
 * Verified 2026-09-03 against the live Admin portal:
 * - "Module 7 — Availability" — a status-focused view of all units.
 * - Filters (all auto-apply via URL query params, no Apply button):
 *   project (#filter-project, value = project UUID), status (#filter-status,
 *   snake_case value), aging (#filter-aging, value "7" | "30" | "90").
 *   Query keys: project, status, aging. "Clear filters" resets to /availability.
 * - Table: Unit (link → /units/:id) · Project / Builder (link → /projects/:id) ·
 *   Status (title-case label) · Quick change (per-row inline select) ·
 *   Base price · Last touched ("Nd ago" aging badge).
 * - Quick change is a per-row <select name="availability_status"
 *   data-testid="quick-status-select"> whose selected option reflects the unit's
 *   current status. Changing it PATCHes the unit in place (no save button).
 * - Empty state: single row "No units match" / "Adjust filters or add inventory
 *   in the Units module."
 */

/** snake_case availability value → title-case display label. */
export const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  booked: "Booked",
  sold: "Sold",
  blocked: "Blocked",
  hold: "Hold",
  resale: "Resale",
  rented: "Rented",
  not_released: "Not Released",
};

export { AVAILABILITY_OPTIONS };

export function main(page: Page) {
  return page.getByRole("main");
}

export function availabilityHeading(page: Page) {
  return page.getByRole("heading", { name: "Availability", exact: true });
}

export function availabilityModuleLabel(page: Page) {
  return main(page).getByText("Module 7 — Availability", { exact: true });
}

export function availabilitySubtitle(page: Page) {
  return main(page).getByText(/Status-focused view of all units/);
}

/* ---- List filters ---- */

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function filterStatusSelect(page: Page) {
  return page.locator("#filter-status");
}

export function filterAgingSelect(page: Page) {
  return page.locator("#filter-aging");
}

export function clearFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Clear filters", exact: true });
}

/* ---- Table ---- */

export function availabilityTable(page: Page) {
  return main(page).getByRole("table");
}

export function availabilityRows(page: Page) {
  return availabilityTable(page).locator("tbody tr");
}

/** A row scoped by its unit-number link (Unit cell). */
export function availabilityRow(page: Page, unitNumber: string) {
  return availabilityTable(page).locator("tbody tr", {
    has: page.getByRole("link", { name: unitNumber, exact: true }),
  });
}

/** Title-case status label cell (3rd column). */
export function statusCell(page: Page, unitNumber: string) {
  return availabilityRow(page, unitNumber).locator("td").nth(2);
}

/** Per-row inline status <select>. */
export function quickChangeSelect(page: Page, unitNumber: string) {
  return availabilityRow(page, unitNumber).getByTestId("quick-status-select");
}

/** "Last touched" aging badge cell (6th column). */
export function lastTouchedCell(page: Page, unitNumber: string) {
  return availabilityRow(page, unitNumber).locator("td").nth(5);
}

/** Empty-state message shown when no units match the current filters. */
export function availabilityEmptyState(page: Page) {
  return main(page).getByText("No units match", { exact: true });
}

/* ---- Navigation / action helpers ---- */

export async function openAvailability(page: Page) {
  await page.goto("/availability");
  await expectAvailabilityLoaded(page);
}

export async function expectAvailabilityLoaded(page: Page) {
  await expect(page).toHaveURL(/\/availability\/?(\?.*)?$/);
  await expect(availabilityHeading(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

/**
 * Applies availability filters. All three auto-apply via URL query params on
 * change. `project` is selected by label (value is a UUID), `status` and
 * `aging` by their raw value ("sold", "7").
 */
export async function applyAvailabilityFilters(
  page: Page,
  filters: {
    project?: string;
    status?: string;
    aging?: string;
  },
) {
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
    await expect(page).toHaveURL(/[?&]project=/, { timeout: 15_000 });
  }
  if (filters.status !== undefined) {
    await filterStatusSelect(page).selectOption(filters.status);
    await expect(page).toHaveURL(
      new RegExp(`[?&]status=${filters.status}`),
      { timeout: 15_000 },
    );
  }
  if (filters.aging !== undefined) {
    await filterAgingSelect(page).selectOption(filters.aging);
    await expect(page).toHaveURL(
      new RegExp(`[?&]aging=${filters.aging}`),
      { timeout: 15_000 },
    );
  }
  await expect(availabilityHeading(page)).toBeVisible();
}

/** Clear filters returns to the unfiltered list (no query params). */
export async function clearAvailabilityFilters(page: Page) {
  await clearFiltersButton(page).click();
  await expect(page).toHaveURL(/\/availability\/?$/, { timeout: 15_000 });
  await expectAvailabilityLoaded(page);
}

/* ---- Row collection ---- */

/** Unit numbers for each visible row (skips the empty-state row). */
export async function collectAvailabilityUnits(page: Page) {
  const rows = availabilityRows(page);
  const count = await rows.count();
  const units: string[] = [];

  for (let i = 0; i < count; i++) {
    const link = rows.nth(i).locator('a[href*="/units/"]').first();
    if ((await link.count()) === 0) {
      continue;
    }
    units.push((await link.innerText()).trim());
  }

  return units;
}

/** Title-case status labels for each visible row (skips the empty-state row). */
export async function collectAvailabilityStatuses(page: Page) {
  const rows = availabilityRows(page);
  const count = await rows.count();
  const statuses: string[] = [];

  for (let i = 0; i < count; i++) {
    const cell = rows.nth(i).locator("td").nth(2);
    if ((await cell.count()) === 0) {
      continue;
    }
    const text = (await cell.innerText()).trim();
    if (text) {
      statuses.push(text);
    }
  }

  return statuses;
}
