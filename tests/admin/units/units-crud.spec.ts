import { test, expect } from "@playwright/test";
import {
  QA_UNIT_PROJECT,
  availabilityStatusInput,
  basePriceInput,
  builtUpAreaInput,
  cancelDeleteButton,
  cancelLink,
  carpetAreaInput,
  cleanupQaUnitByNumber,
  configurationInput,
  createUnit,
  createUnitButton,
  deleteButton,
  deleteDialog,
  expectUnitAbsentFromList,
  facingInput,
  floorNumberInput,
  formErrorBanner,
  newUnitHeading,
  openEditFromDetail,
  openNewUnit,
  openUnitDetail,
  openUnits,
  phaseSelect,
  projectSelect,
  requiredErrors,
  restoreButton,
  saveUnitChanges,
  softDeleteUnit,
  superBuiltUpAreaInput,
  towerSelect,
  uniqueQaUnitNumber,
  unitIdFromUrl,
  unitNumberInput,
  unitNumberLink,
} from "../../../pages/admin/unitsPage";

/**
 * Create / edit / soft-delete only disposable QA Autotest units.
 * Never mutate seeded units. Link to seeded project via select only.
 */
test.describe("Admin Units CRUD", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let unitNumber = "";

  test.afterEach(async ({ page }) => {
    if (unitNumber) {
      await cleanupQaUnitByNumber(page, unitNumber);
      unitNumber = "";
    }
  });

  test("ADMIN-UNITS-020 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewUnit(page);

    await expect(newUnitHeading(page)).toBeVisible();
    await expect(projectSelect(page)).toBeVisible();
    await expect(unitNumberInput(page)).toBeVisible();
    await expect(configurationInput(page)).toBeVisible();
    await expect(availabilityStatusInput(page)).toBeVisible();
    await expect(phaseSelect(page)).toBeVisible();
    await expect(towerSelect(page)).toBeVisible();
    await expect(floorNumberInput(page)).toBeVisible();
    await expect(facingInput(page)).toBeVisible();
    await expect(carpetAreaInput(page)).toBeVisible();
    await expect(builtUpAreaInput(page)).toBeVisible();
    await expect(superBuiltUpAreaInput(page)).toBeVisible();
    await expect(basePriceInput(page)).toBeVisible();
    await expect(createUnitButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
  });

  test("ADMIN-UNITS-021 — empty required fields show validation", async ({
    page,
  }) => {
    await openNewUnit(page);
    await page.getByRole("button", { name: "Create unit", exact: true }).click();

    await expect(page).toHaveURL(/\/units\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    expect(await requiredErrors(page).count()).toBeGreaterThanOrEqual(2);
  });

  test("ADMIN-UNITS-022 — Cancel returns to the units list", async ({
    page,
  }) => {
    await openNewUnit(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/units\/?$/);
    await expect(page.getByRole("heading", { name: "Units", exact: true })).toBeVisible();
  });

  test("ADMIN-UNITS-030 — can create a disposable QA unit @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();

    await createUnit(page, {
      unitNumber,
      project: QA_UNIT_PROJECT,
      configuration: "2 BHK",
      availabilityStatus: "available",
      floorNumber: "9",
      facing: "east",
      carpetArea: "950",
      basePrice: "1500000",
    });

    await expect(page.getByText("Units / Detail")).toBeVisible();
    await expect(page.getByText(QA_UNIT_PROJECT).first()).toBeVisible();
    await expect(page.getByText("2 BHK").first()).toBeVisible();
    await expect(page.getByText("Available").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
  });

  test("ADMIN-UNITS-031 — created QA unit appears on the list", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber });

    await openUnits(page);
    await expect(unitNumberLink(page, unitNumber)).toBeVisible();
  });

  test("ADMIN-UNITS-040 — can edit a QA unit number", async ({ page }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, {
      unitNumber,
      facing: "east",
    });

    await openEditFromDetail(page);
    const editedNumber = `${unitNumber} Edited`;
    await unitNumberInput(page).fill(editedNumber);
    await facingInput(page).fill("north");
    await saveUnitChanges(page);

    await expect(
      page.getByRole("heading", { name: `Unit ${editedNumber}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Units / Detail")).toBeVisible();
    await expect(page.getByText("north", { exact: true }).first()).toBeVisible();

    unitNumber = editedNumber;
  });

  test("ADMIN-UNITS-050 — soft-delete removes QA unit from list @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber });

    const unitId = unitIdFromUrl(page.url());
    await softDeleteUnit(page);
    await expectUnitAbsentFromList(page, unitNumber);

    await openUnitDetail(page, unitId);
    await expect(
      page.getByRole("heading", { name: `Unit ${unitNumber}`, exact: true }),
    ).toBeVisible();
    await expect(restoreButton(page)).toBeVisible();
    await expect(page.getByText("SOFT-DELETED")).toBeVisible();
    await expect(deleteButton(page)).toHaveCount(0);

    unitNumber = "";
  });

  test("ADMIN-UNITS-051 — delete dialog Cancel keeps the QA unit", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber });

    const unitId = unitIdFromUrl(page.url());

    await deleteButton(page).click();
    await expect(deleteDialog(page)).toBeVisible();
    await expect(deleteDialog(page)).toContainText(unitNumber);
    await cancelDeleteButton(page).click();
    await expect(deleteDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/units/${unitId}/?$`));
    await expect(
      page.getByRole("heading", { name: `Unit ${unitNumber}`, exact: true }),
    ).toBeVisible();
  });
});
