import { test, expect } from "@playwright/test";
import { mediaSection } from "../../../pages/admin/mediaPage";
import {
  UNIT_MEDIA,
  cleanupQaUnitByNumber,
  createUnit,
  expectUnitMediaSlots,
  openUnitDetail,
  uniqueQaUnitNumber,
  unitIdFromUrl,
  uploadUnitMedia,
} from "../../../pages/admin/unitsPage";

/**
 * Unit detail media uploads (floor plan + photos).
 * Only mutate disposable QA Autotest units.
 */
test.describe("Admin Units media", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  let unitNumber = "";

  test.afterEach(async ({ page }) => {
    if (unitNumber) {
      await cleanupQaUnitByNumber(page, unitNumber);
      unitNumber = "";
    }
  });

  test("ADMIN-UNITS-060 — detail exposes floor plan and photo upload slots @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber });
    await expectUnitMediaSlots(page);
    await expect(
      mediaSection(page, UNIT_MEDIA.floorPlan.slot).getByText("No file yet.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      mediaSection(page, UNIT_MEDIA.photo.slot).getByText(
        "No files uploaded yet.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("ADMIN-UNITS-061 — can upload a floor plan and photo on unit detail @smoke", async ({
    page,
  }) => {
    unitNumber = uniqueQaUnitNumber();
    await createUnit(page, { unitNumber });
    const unitId = unitIdFromUrl(page.url());

    await uploadUnitMedia(page, "floorPlan");
    await uploadUnitMedia(page, "photo");

    await openUnitDetail(page, unitId);
    await expect(
      mediaSection(page, UNIT_MEDIA.floorPlan.slot).locator("img").first(),
    ).toBeVisible();
    await expect(
      mediaSection(page, UNIT_MEDIA.photo.slot).locator("img").first(),
    ).toBeVisible();
  });
});
