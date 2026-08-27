import { test, expect } from "@playwright/test";
import {
  PROJECT_AMENITY_LABELS,
  QA_PROJECT_BUILDER,
  cleanupQaProjectByName,
  createAmenitiesPicker,
  createAmenityCheckbox,
  createProject,
  expectSelectedAmenities,
  openProjectDetail,
  projectAmenitiesCount,
  projectAmenitiesSave,
  projectAmenitiesSection,
  projectIdFromUrl,
  setDetailAmenities,
  uniqueQaProjectName,
} from "../../../pages/admin/projectsPage";

/**
 * Amenities on create form + detail picker.
 * Only mutate disposable QA Autotest projects — never seeded projects.
 */
test.describe("Admin Projects amenities", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let projectName = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
  });

  test("ADMIN-PROJECTS-050 — create form lists amenity checkboxes @smoke", async ({
    page,
  }) => {
    await page.goto("/projects/new");
    await expect(createAmenitiesPicker(page)).toBeVisible();
    await expect(page.getByText("Amenities (optional)")).toBeVisible();

    for (const label of PROJECT_AMENITY_LABELS) {
      await expect(createAmenityCheckbox(page, label)).toBeVisible();
      await expect(createAmenityCheckbox(page, label)).not.toBeChecked();
    }
  });

  test("ADMIN-PROJECTS-051 — create with amenities persists selection on detail @smoke", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    const amenities = ["Gym", "Parking", "Swimming Pool"] as const;

    await createProject(page, {
      name: projectName,
      builder: QA_PROJECT_BUILDER,
      amenities,
    });

    await openProjectDetail(page, projectIdFromUrl(page.url()));
    await expect(projectAmenitiesSection(page)).toBeVisible();
    await expectSelectedAmenities(page, amenities);
  });

  test("ADMIN-PROJECTS-052 — detail amenity picker can update selection", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      amenities: ["Gym", "Parking"],
    });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    const updated = ["Garden", "Security", "Club House"] as const;
    await setDetailAmenities(page, updated);
    await expect(projectAmenitiesCount(page)).toContainText("3 selected");
    await expect(projectAmenitiesSave(page)).toBeDisabled();
  });

  test("ADMIN-PROJECTS-053 — detail amenity picker can clear all amenities", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      amenities: ["Gym", "Parking"],
    });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await setDetailAmenities(page, []);
    await expect(projectAmenitiesCount(page)).toContainText("0 selected");
  });
});
