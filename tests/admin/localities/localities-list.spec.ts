import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  addLocalityButton,
  createCitySelect,
  filterCitySelect,
  filterNameInput,
  hideInactiveCheckbox,
  localitiesHeading,
  localitiesModuleLabel,
  localitiesSummary,
  localitiesTable,
  localityNameInput,
  localityRows,
  openLocalities,
} from "../../../pages/admin/localitiesPage";

test.describe("Admin Localities list", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openLocalities(page);
  });

  test("ADMIN-LOCALITIES-001 — localities loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(localitiesHeading(page)).toBeVisible();
    await expect(localitiesModuleLabel(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Localities");
  });

  test("ADMIN-LOCALITIES-002 — list has locality columns and records", async ({
    page,
  }) => {
    await expect(localitiesSummary(page)).toHaveText(/Showing \d+–\d+ of \d+/);
    await expect(localitiesTable(page)).toBeVisible();
    for (const column of ["Name", "City", "State", "Slug", "Status", "Actions"]) {
      await expect(
        localitiesTable(page).getByRole("columnheader", { name: column }),
      ).toBeVisible();
    }
    expect(await localityRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-LOCALITIES-003 — filter and inline-create controls are visible", async ({
    page,
  }) => {
    await expect(filterCitySelect(page)).toBeVisible();
    await expect(filterNameInput(page)).toBeVisible();
    await expect(hideInactiveCheckbox(page)).toBeVisible();
    await expect(createCitySelect(page)).toBeVisible();
    await expect(localityNameInput(page)).toBeVisible();
    await expect(addLocalityButton(page)).toBeVisible();
  });
});
