import { test, expect } from "@playwright/test";
import { openUserContext } from "../../pages/crossPlatform";
import {
  QA_PROJECT_BUILDER,
  cleanupQaProjectByName,
  createProject,
  deleteProjectMedia,
  openEditFromDetail,
  openProjectDetail,
  projectIdFromUrl,
  setDetailAmenities,
  setProjectActive,
  softDeleteProject,
  uniqueQaProjectName,
  uploadProjectMedia,
  nameInput,
  descriptionInput,
  statusInput,
  saveProjectChanges,
} from "../../pages/admin/projectsPage";
import {
  aboutHeading,
  amenitiesHeading,
  amenitiesSection,
  builderLink,
  downloadsHeading,
  floorPlansHeading,
  projectName as userProjectHeading,
} from "../../pages/user/projectDetailsPage";
import {
  cityChip,
  projectCardByName,
  searchInput,
} from "../../pages/user/projectListingPage";

/**
 * Admin create/edit/delete → public user visibility for projects.
 * Only disposable QA Autotest projects; always soft-delete afterwards.
 */
test.describe("Admin → User project visibility", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let projectName = "";
  let projectId = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
      projectId = "";
    }
  });

  test("XAPP-PROJECT-001 — admin project with builder, amenities, and media is visible on user site @smoke", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    const description = `QA Autotest cross-app description for ${projectName}`;
    const amenities = ["Gym", "Parking", "Swimming Pool", "Garden"] as const;

    await createProject(page, {
      name: projectName,
      builder: QA_PROJECT_BUILDER,
      propertyType: "Apartment",
      status: "under_construction",
      city: "Ahmedabad",
      locality: "SG Highway",
      address: "QA Autotest Address, SG Highway",
      description,
      amenities,
    });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);

    await uploadProjectMedia(page, "hero");
    await uploadProjectMedia(page, "gallery");
    await uploadProjectMedia(page, "floorPlan");
    await uploadProjectMedia(page, "brochure");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        projectCardByName(userPage, projectName).getByText(/Ahmedabad/i),
      ).toBeVisible();

      await projectCardByName(userPage, projectName).click();
      await expect(userPage).toHaveURL(new RegExp(`/p/${projectId}`));

      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(userPage.getByText("Under Construction")).toBeVisible();
      await expect(
        userPage.getByText(/SG Highway|Ahmedabad/i).first(),
      ).toBeVisible();
      await expect(builderLink(userPage)).toContainText(QA_PROJECT_BUILDER);
      await expect(aboutHeading(userPage)).toBeVisible();
      await expect(userPage.getByText(description)).toBeVisible();

      await expect(amenitiesHeading(userPage)).toBeVisible();
      for (const amenity of amenities) {
        await expect(
          amenitiesSection(userPage).getByText(amenity, { exact: true }),
        ).toBeVisible();
      }

      await expect(userPage.locator("main img").first()).toBeVisible();
      await expect(floorPlansHeading(userPage)).toBeVisible();
      await expect(downloadsHeading(userPage)).toBeVisible();
      await expect(
        userPage
          .getByRole("link", { name: /brochure|pdf|qa-brochure/i })
          .or(userPage.getByText(/brochure/i))
          .first(),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-002 — soft-deleted admin project disappears from user listing", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      amenities: ["Gym"],
    });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await uploadProjectMedia(page, "hero");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toBeVisible({
        timeout: 20_000,
      });

      await softDeleteProject(page);
      const deletedName = projectName;
      projectName = "";

      await userPage.goto("/projects");
      await searchInput(userPage).fill(deletedName);
      await expect(projectCardByName(userPage, deletedName)).toHaveCount(0, {
        timeout: 20_000,
      });
      await expect(userPage.getByText(deletedName, { exact: true })).toHaveCount(
        0,
      );
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-003 — user detail shows updated amenities after admin change", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      amenities: ["Gym"],
    });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);

    const updated = ["Club House", "Power Backup"] as const;
    await setDetailAmenities(page, updated);

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(amenitiesHeading(userPage)).toBeVisible();
      for (const amenity of updated) {
        await expect(
          amenitiesSection(userPage).getByText(amenity, { exact: true }),
        ).toBeVisible();
      }
      await expect(
        amenitiesSection(userPage).getByText("Gym", { exact: true }),
      ).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-004 — edited name, status, and description appear on user detail", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      status: "under_construction",
      description: "Before edit description",
    });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await openEditFromDetail(page);

    const editedName = `${projectName} Edited`;
    const editedDescription = `After edit description for ${editedName}`;
    await nameInput(page).fill(editedName);
    await statusInput(page).fill("ready_to_move");
    await descriptionInput(page).fill(editedDescription);
    await saveProjectChanges(page);
    projectName = editedName;

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await searchInput(userPage).fill(editedName);
      await expect(projectCardByName(userPage, editedName)).toBeVisible({
        timeout: 20_000,
      });
      await projectCardByName(userPage, editedName).click();
      await expect(userProjectHeading(userPage)).toHaveText(editedName);
      await expect(userPage.getByText("Ready to Move")).toBeVisible();
      await expect(userPage.getByText(editedDescription)).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-005 — inactive project is hidden from user listing", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await uploadProjectMedia(page, "hero");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toBeVisible({
        timeout: 20_000,
      });

      await setProjectActive(page, false);

      await userPage.goto("/projects");
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toHaveCount(0, {
        timeout: 20_000,
      });
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-006 — RERA PDF stays on admin; brochure publishes to user Downloads", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);

    // RERA / legal docs are uploaded on admin but are not rendered in the
    // public Downloads section (only brochures are).
    await uploadProjectMedia(page, "reraDoc");
    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(downloadsHeading(userPage)).toHaveCount(0);

      await openProjectDetail(page, projectId);
      await uploadProjectMedia(page, "brochure");

      await userPage.reload();
      await expect(downloadsHeading(userPage)).toBeVisible();
      await expect(
        userPage
          .getByRole("link", { name: /qa-brochure|brochure|pdf/i })
          .or(userPage.getByText(/qa-brochure\.pdf/i))
          .first(),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-007 — deleting hero media removes hero image on user detail", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await uploadProjectMedia(page, "hero");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userPage.locator("main img").first()).toBeVisible();
      const imgCountBefore = await userPage.locator("main img").count();
      expect(imgCountBefore).toBeGreaterThan(0);

      await openProjectDetail(page, projectId);
      await deleteProjectMedia(page, "hero");

      await userPage.reload();
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      // Hero slot empty — gallery/floor plan not uploaded, so no project media images.
      await expect(userPage.locator("main img")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-008 — builder link on user detail opens that builder page", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      builder: QA_PROJECT_BUILDER,
    });
    projectId = projectIdFromUrl(page.url());

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(builderLink(userPage)).toContainText(QA_PROJECT_BUILDER);
      await builderLink(userPage).click();
      await expect(userPage).toHaveURL(/\/b\//);
      await expect(
        userPage.getByRole("heading", { level: 1 }),
      ).toHaveText(QA_PROJECT_BUILDER);
      await expect(
        userPage.getByRole("heading", { name: /^Projects by / }),
      ).toBeVisible();
      await expect(
        userPage.locator('main a[href^="/p/"]').filter({
          has: userPage.getByText(projectName),
        }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-009 — newly created project is findable via city filter", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    projectId = projectIdFromUrl(page.url());

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await cityChip(userPage, "Ahmedabad").click();
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toBeVisible({
        timeout: 20_000,
      });

      await cityChip(userPage, "Mumbai").click();
      await searchInput(userPage).fill(projectName);
      await expect(projectCardByName(userPage, projectName)).toHaveCount(0, {
        timeout: 15_000,
      });
    } finally {
      await context.close();
    }
  });

  test("XAPP-PROJECT-010 — replacing hero media still shows an image on user detail", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });
    projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await uploadProjectMedia(page, "hero");

    await deleteProjectMedia(page, "hero");
    await uploadProjectMedia(page, "hero");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(userPage.locator("main img").first()).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
