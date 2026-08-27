import { test, expect } from "@playwright/test";
import {
  PROJECT_MEDIA,
  cleanupQaProjectByName,
  createProject,
  expectProjectMediaSlots,
  openProjectDetail,
  projectIdFromUrl,
  uniqueQaProjectName,
  uploadProjectMedia,
} from "../../../pages/admin/projectsPage";
import {
  expectMediaUploaded,
  mediaSection,
} from "../../../pages/admin/mediaPage";

/**
 * Project media uploads on detail (hero / gallery / floor plan / brochure / RERA).
 * Only mutate disposable QA Autotest projects.
 */
test.describe("Admin Projects media", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  let projectName = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
  });

  test("ADMIN-PROJECTS-060 — detail exposes all media upload slots @smoke", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await expectProjectMediaSlots(page);
    await expect(page.getByText("Hero image", { exact: true })).toBeVisible();
    await expect(page.getByText("Gallery", { exact: true })).toBeVisible();
    await expect(page.getByText("Brochures", { exact: true })).toBeVisible();
    await expect(page.getByText("Floor plans", { exact: true })).toBeVisible();
    await expect(
      page.getByText("RERA / legal documents", { exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-PROJECTS-061 — can upload a hero image @smoke", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await expect(
      mediaSection(page, PROJECT_MEDIA.hero.slot).getByText("No file yet.", {
        exact: true,
      }),
    ).toBeVisible();

    await uploadProjectMedia(page, "hero");
    await expect(
      page.getByRole("button", { name: "Replace", exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-PROJECTS-062 — can upload a gallery image", async ({ page }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await uploadProjectMedia(page, "gallery");
  });

  test("ADMIN-PROJECTS-063 — can upload a floor plan image", async ({ page }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await uploadProjectMedia(page, "floorPlan");
  });

  test("ADMIN-PROJECTS-064 — can upload a brochure PDF", async ({ page }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await uploadProjectMedia(page, "brochure");
    await expectMediaUploaded(
      page,
      PROJECT_MEDIA.brochure.slot,
      PROJECT_MEDIA.brochure.fileName,
      { expectImage: false },
    );
  });

  test("ADMIN-PROJECTS-065 — can upload a RERA PDF document", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    await openProjectDetail(page, projectIdFromUrl(page.url()));

    await uploadProjectMedia(page, "reraDoc");
  });
});
