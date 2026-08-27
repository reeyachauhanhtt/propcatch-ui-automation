import { test, expect } from "@playwright/test";
import { expectNoBrokenValues } from "../../../pages/user/homePage";
import {
  amenitiesHeading,
  amenitiesSection,
  openProject,
} from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — amenities. Every seeded project renders an "Amenities"
 * section; the set shown for "Montessa Heights" is stable seed data.
 */
test.describe("Project Details - Amenities", () => {
  test.describe.configure({ timeout: 45_000 });

  const MONTESSA_AMENITIES = [
    "Club House",
    "Power Backup",
    "Children Play Area",
    "Gym",
    "Security",
    "Parking",
    "Skating rink",
    "Garden",
    "Swimming Pool",
  ];

  test("PROJECT-DETAIL-023 - amenities section is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(amenitiesHeading(page)).toBeVisible();
  });

  test("PROJECT-DETAIL-024 - amenities are listed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    for (const amenity of MONTESSA_AMENITIES) {
      await expect(amenitiesSection(page).getByText(amenity, { exact: true })).toBeVisible();
    }
  });

  test("PROJECT-DETAIL-025 - amenities render without broken values", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await expect(amenitiesSection(page)).toBeVisible();
    await expectNoBrokenValues(page);
  });
});
