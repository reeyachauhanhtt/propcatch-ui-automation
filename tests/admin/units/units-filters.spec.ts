import { test, expect } from "@playwright/test";
import {
  cleanupQaProjectByName,
  createProject,
  uniqueQaProjectName,
} from "../../../pages/admin/projectsPage";
import {
  applyUnitFilters,
  cleanupQaUnitByNumber,
  collectUnitNumbers,
  createUnit,
  expectFilteredRowsMatch,
  openUnits,
  uniqueQaUnitNumber,
} from "../../../pages/admin/unitsPage";

/**
 * Filter precision using disposable QA project + unit records.
 */
test.describe("Admin Units filters", () => {
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

  test("ADMIN-UNITS-012 — simultaneous project, status, config, price, and carpet filters narrow to QA unit @smoke", async ({
    page,
  }) => {
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
      configuration: "3 BHK",
      availabilityStatus: "available",
      carpetArea: "1200",
      basePrice: "2500000",
    });

    await openUnits(page);
    const before = await collectUnitNumbers(page);
    expect(before).toContain(unitNumber);

    await applyUnitFilters(page, {
      project: projectName,
      status: "available",
      configuration: "3 BHK",
      minPrice: "2000000",
      maxPrice: "3000000",
      minCarpet: "1000",
      maxCarpet: "1300",
    });

    await expect(page).toHaveURL(/project=/);
    await expect(page).toHaveURL(/status=available/);
    await expect(page).toHaveURL(/configuration=3\+BHK/);
    await expect(page).toHaveURL(/minPrice=2000000|min_price=2000000/);
    await expect(page).toHaveURL(/maxPrice=3000000|max_price=3000000/);
    await expect(page).toHaveURL(/minCarpet=1000|min_carpet=1000/);
    await expect(page).toHaveURL(/maxCarpet=1300|max_carpet=1300/);

    const filtered = await collectUnitNumbers(page);
    expect(filtered).toEqual([unitNumber]);
    await expectFilteredRowsMatch(page, {
      project: projectName,
      statusLabel: "Available",
      configuration: "3 BHK",
    });
  });
});
