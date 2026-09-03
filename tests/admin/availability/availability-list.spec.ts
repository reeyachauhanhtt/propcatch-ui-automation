import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  STATUS_LABELS,
  availabilityHeading,
  availabilityModuleLabel,
  availabilityRows,
  availabilitySubtitle,
  availabilityTable,
  clearFiltersButton,
  collectAvailabilityStatuses,
  filterAgingSelect,
  filterProjectSelect,
  filterStatusSelect,
  main,
  openAvailability,
} from "../../../pages/admin/availabilityPage";

test.describe("Admin Availability list", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openAvailability(page);
  });

  test("ADMIN-AVAIL-001 — availability page loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(availabilityHeading(page)).toBeVisible();
    await expect(availabilityModuleLabel(page)).toBeVisible();
    await expect(availabilitySubtitle(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Availability");
  });

  test("ADMIN-AVAIL-002 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = availabilityTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Unit" })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Project / Builder" }),
    ).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Quick change" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Base price" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Last touched" }),
    ).toBeVisible();
    expect(await availabilityRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-AVAIL-003 — filter controls and Clear filters are visible", async ({
    page,
  }) => {
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterStatusSelect(page)).toBeVisible();
    await expect(filterAgingSelect(page)).toBeVisible();
    await expect(clearFiltersButton(page)).toBeVisible();
  });

  test("ADMIN-AVAIL-004 — Status column shows only title-case labels", async ({
    page,
  }) => {
    const statuses = await collectAvailabilityStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);

    const labels = Object.values(STATUS_LABELS);
    for (const status of statuses) {
      expect(labels).toContain(status);
    }
  });

  test("ADMIN-AVAIL-005 — pagination controls are present", async ({ page }) => {
    await expect(
      main(page).getByRole("button", { name: "Previous", exact: true }),
    ).toBeVisible();
    await expect(
      main(page).getByRole("button", { name: "Next", exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-AVAIL-006 — list remains loaded after refresh", async ({ page }) => {
    await page.reload();
    await expect(availabilityHeading(page)).toBeVisible();
    await expect(availabilityModuleLabel(page)).toBeVisible();
  });

  test("ADMIN-AVAIL-007 — Unit link opens the unit detail page @smoke", async ({
    page,
  }) => {
    const rows = availabilityRows(page);
    const count = await rows.count();
    let unitNumber = "";
    let link = rows.first().locator('a[href*="/units/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/units/"]').first();
      if ((await candidate.count()) === 0) {
        continue;
      }
      const text = (await candidate.innerText()).trim();
      if (!/^QA Autotest/.test(text)) {
        unitNumber = text;
        link = candidate;
        break;
      }
    }
    expect(unitNumber.length).toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/units\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: `Unit ${unitNumber}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Units / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    // Do not edit or delete seeded units.
  });
});
