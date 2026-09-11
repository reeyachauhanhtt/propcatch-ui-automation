import { test, expect } from "@playwright/test";
import { waitUntilPublicProjectExists } from "../api/supabase";
import { openUserContext } from "../../pages/crossProduct";
import {
  QA_PROJECT_BUILDER,
  cleanupQaProjectByName,
  createProject,
  projectIdFromUrl,
  uniqueQaProjectName,
} from "../../pages/admin/projectsPage";
import { projectName as userProjectHeading } from "../../pages/user/projectDetailsPage";
import {
  projectCardByName,
  searchInput,
} from "../../pages/user/projectListingPage";

/**
 * Admin create project → public API gate → user listing/detail.
 *
 * This file is only the API-gated path. Full project chrome (media, amenities,
 * delete, city filter) stays in admin-to-user-project-visibility.spec.ts.
 *
 * After Admin save, poll GET /rest/v1/projects (anon key, same surface the
 * user app can read). Only then open the user site. Does not make parallel
 * admin + cross-product suites safe — run those sequentially.
 */
test.describe("Admin → User project API gate", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let projectName = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
  });

  test("XAPP-PROJECT-API-001 — admin-created project is readable on public API then user listing @smoke", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();

    await createProject(page, {
      name: projectName,
      builder: QA_PROJECT_BUILDER,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    const projectId = projectIdFromUrl(page.url());

    const apiProject = await waitUntilPublicProjectExists({
      name: projectName,
      id: projectId,
    });
    expect(apiProject.id).toBe(projectId);
    expect(apiProject.name).toBe(projectName);
    expect(apiProject.builder_id).toBeTruthy();

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto("/projects");
      await searchInput(userPage).fill(projectName);
      const card = projectCardByName(userPage, projectName);
      await expect(card).toBeVisible({ timeout: 20_000 });

      await card.click();
      await expect(userPage).toHaveURL(new RegExp(`/p/${projectId}`));
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
    } finally {
      await context.close();
    }
  });
});
