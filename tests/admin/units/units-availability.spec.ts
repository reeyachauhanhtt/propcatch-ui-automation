import { test, expect } from "@playwright/test";
import { STATUS_LABELS } from "../../../pages/admin/availabilityPage";
import {
  AVAILABILITY_OPTIONS,
  QA_UNIT_PROJECT,
  applyUnitFilters,
  availabilityStatusInput,
  cleanupQaUnitByNumber,
  configurationInput,
  createUnit,
  expectFilteredRowsMatch,
  filterStatusSelect,
  openEditFromDetail,
  openNewUnit,
  openUnits,
  projectSelect,
  resetFiltersLink,
  saveUnitChanges,
  uniqueQaUnitNumber,
  unitNumberInput,
} from "../../../pages/admin/unitsPage";

/**
 * Deepens the units availability_status coverage beyond the available/booked
 * happy paths already in units-crud. Confirms title-case labels for every
 * status and that the status filter lists all eight values.
 */
test.describe("Admin Units availability", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let unitNumber = "";

  test.afterEach(async ({ page }) => {
    if (unitNumber) {
      await cleanupQaUnitByNumber(page, unitNumber);
      unitNumber = "";
    }
  });

  test("ADMIN-UNITS-060 — every availability status renders title-case @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber, availabilityStatus: "sold" });
    await expect(page.getByText("Sold", { exact: true }).first()).toBeVisible();

    const remaining = [
      "blocked",
      "hold",
      "resale",
      "rented",
      "not_released",
    ] as const;
    for (const status of remaining) {
      await openEditFromDetail(page);
      await availabilityStatusInput(page).fill(status);
      await saveUnitChanges(page);
      await expect(
        page.getByText(STATUS_LABELS[status], { exact: true }).first(),
      ).toBeVisible();
    }
  });

  test("ADMIN-UNITS-061 — status filter shows sold and rented labels", async ({
    page,
  }) => {
    await openUnits(page);

    for (const [value, label] of [
      ["sold", "Sold"],
      ["rented", "Rented"],
    ] as const) {
      await applyUnitFilters(page, { status: value });
      await expectFilteredRowsMatch(page, { statusLabel: label });
      await resetFiltersLink(page).click();
    }
  });

  test("ADMIN-UNITS-062 — availability defaults to Available when omitted @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await openNewUnit(page);
    await projectSelect(page).selectOption({ label: QA_UNIT_PROJECT });
    await unitNumberInput(page).fill(unitNumber);
    await configurationInput(page).fill("2 BHK");
    // availability left empty — the form defaults it to "available"

    await page.getByRole("button", { name: "Create unit", exact: true }).click();

    await expect(page).toHaveURL(/\/units\/[0-9a-f-]+$/i, { timeout: 25_000 });
    await expect(page.getByText("Available", { exact: true }).first()).toBeVisible();
  });

  test("ADMIN-UNITS-063 — status filter lists all eight statuses", async ({
    page,
  }) => {
    await openUnits(page);

    const values = await filterStatusSelect(page)
      .locator("option")
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    for (const status of AVAILABILITY_OPTIONS) {
      expect(values).toContain(status);
    }
  });
});
