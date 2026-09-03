import { test, expect, type Page } from "@playwright/test";
import {
  cleanupQaProjectByName,
  createProject,
  uniqueQaProjectName,
} from "../../../pages/admin/projectsPage";
import {
  cleanupQaUnitByNumber,
  createUnit,
  uniqueQaUnitNumber,
} from "../../../pages/admin/unitsPage";
import {
  applyAvailabilityFilters,
  openAvailability,
  quickChangeSelect,
  statusCell,
} from "../../../pages/admin/availabilityPage";

/**
 * The "Quick change" inline select PATCHes a unit's availability status in
 * place (no save button). Tests operate only on disposable QA project + unit
 * records (soft-deleted after each test), never seeded units.
 */
test.describe("Admin Availability quick change", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  let projectName = "";
  let unitNumber = "";

  test.afterEach(async ({ page }) => {
    if (unitNumber) {
      await cleanupQaUnitByNumber(page, unitNumber);
      unitNumber = "";
    }
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
  });

  async function setupQaUnit(page: Page) {
    projectName = uniqueQaProjectName();
    unitNumber = uniqueQaUnitNumber();

    await createProject(page, {
      name: projectName,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    await createUnit(page, {
      unitNumber,
      project: projectName,
      availabilityStatus: "available",
    });
  }

  test("ADMIN-AVAIL-020 — quick change updates a unit's status @smoke", async ({
    page,
  }) => {
    await setupQaUnit(page);
    await openAvailability(page);
    await applyAvailabilityFilters(page, { project: projectName });

    const select = quickChangeSelect(page, unitNumber);
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("available");

    await select.selectOption("sold");
    await expect(statusCell(page, unitNumber)).toHaveText("Sold");
  });

  test("ADMIN-AVAIL-021 — quick change persists across reload", async ({
    page,
  }) => {
    await setupQaUnit(page);
    await openAvailability(page);
    await applyAvailabilityFilters(page, { project: projectName });

    await quickChangeSelect(page, unitNumber).selectOption("sold");
    await expect(statusCell(page, unitNumber)).toHaveText("Sold");

    await page.reload();
    await expect(statusCell(page, unitNumber)).toHaveText("Sold");
  });

  test("ADMIN-AVAIL-022 — quick change round-trips back to available", async ({
    page,
  }) => {
    await setupQaUnit(page);
    await openAvailability(page);
    await applyAvailabilityFilters(page, { project: projectName });

    await quickChangeSelect(page, unitNumber).selectOption("sold");
    await expect(statusCell(page, unitNumber)).toHaveText("Sold");

    await quickChangeSelect(page, unitNumber).selectOption("available");
    await expect(statusCell(page, unitNumber)).toHaveText("Available");
  });
});
