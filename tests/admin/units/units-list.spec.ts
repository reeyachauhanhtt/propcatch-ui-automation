import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  applyFiltersButton,
  applyUnitFilters,
  expectUnitsListLoaded,
  filterConfigInput,
  filterProjectSelect,
  filterStatusSelect,
  newUnitHeading,
  newUnitLink,
  nextPageButton,
  openUnits,
  previousPageButton,
  resetFiltersLink,
  unitRows,
  unitsHeading,
  unitsSubtitle,
  unitsTable,
} from "../../../pages/admin/unitsPage";

test.describe("Admin Units list", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openUnits(page);
  });

  test("ADMIN-UNITS-001 — units list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expectUnitsListLoaded(page);
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expect(page.getByText("Module 5 — Units & Inventory")).toBeVisible();
    await expectSidebarItemActive(page, "Units");
  });

  test("ADMIN-UNITS-002 — subtitle and New unit action are visible", async ({
    page,
  }) => {
    await expect(unitsSubtitle(page)).toBeVisible();
    await expect(newUnitLink(page)).toBeVisible();
    await expect(newUnitLink(page)).toHaveAttribute("href", "/units/new");
  });

  test("ADMIN-UNITS-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = unitsTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Unit #" })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Project / Builder" }),
    ).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Config" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Floor" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Carpet" })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Base price" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Availability" }),
    ).toBeVisible();
    expect(await unitRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-UNITS-004 — pagination controls are present", async ({ page }) => {
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-UNITS-005 — filter controls and Apply / Reset are visible", async ({
    page,
  }) => {
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterStatusSelect(page)).toBeVisible();
    await expect(filterConfigInput(page)).toBeVisible();
    await expect(applyFiltersButton(page)).toBeVisible();
    await expect(resetFiltersLink(page)).toBeVisible();
    await expect(resetFiltersLink(page)).toHaveAttribute("href", "/units");
  });

  test("ADMIN-UNITS-006 — Apply filters by project and availability", async ({
    page,
  }) => {
    await applyUnitFilters(page, {
      project: "Montessa Heights",
      status: "available",
    });

    await expect(page).toHaveURL(/project=/);
    await expect(page).toHaveURL(/status=available/);
    expect(await unitRows(page).count()).toBeGreaterThan(0);

    const firstRow = unitRows(page).first();
    await expect(firstRow.getByRole("link", { name: "Montessa Heights" })).toBeVisible();
    await expect(firstRow.getByText("Available")).toBeVisible();
  });

  test("ADMIN-UNITS-007 — Reset clears filters back to the full list", async ({
    page,
  }) => {
    await applyUnitFilters(page, {
      project: "Montessa Heights",
      status: "available",
      configuration: "2 BHK",
    });
    await expect(page).toHaveURL(/\/units\?/);

    await resetFiltersLink(page).click();
    await expect(page).toHaveURL(/\/units\/?$/);
    await expectUnitsListLoaded(page);
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test("ADMIN-UNITS-008 — + New unit opens the create form", async ({
    page,
  }) => {
    await newUnitLink(page).click();
    await expect(page).toHaveURL(/\/units\/new/);
    await expect(newUnitHeading(page)).toBeVisible();
    await expect(page.getByText("Units / New")).toBeVisible();
  });

  test("ADMIN-UNITS-009 — opening a seeded unit shows read-only detail chrome", async ({
    page,
  }) => {
    const rows = unitRows(page);
    const count = await rows.count();
    let unitNumber = "";
    let link = rows.first().getByRole("link").first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).getByRole("link").first();
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
    await expect(page.getByRole("main").getByText("Unit", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("main").getByText("Availability", { exact: true }),
    ).toBeVisible();
    // Do not edit or delete seeded units.
  });

  test("ADMIN-UNITS-010 — units list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expectUnitsListLoaded(page);
    await expect(unitsHeading(page)).toBeVisible();
  });
});
