import { test, expect } from "@playwright/test";
import { openUserContext } from "../../pages/crossPlatform";
import {
  builderIdFromUrl,
  cleanupQaBuilderByName,
  createBuilder,
  uniqueQaBuilderName,
  uploadBuilderLogo,
} from "../../pages/admin/buildersPage";
import {
  cleanupQaProjectByName,
  createProject,
  projectIdFromUrl,
  uniqueQaProjectName,
} from "../../pages/admin/projectsPage";
import {
  builderCardByName,
  builderCardLogo,
  builderH1,
  builderLogo,
  builderProjectCards,
  openBuilders as openUserBuilders,
  projectsHeading,
  websiteLink,
} from "../../pages/user/buildersPage";

/**
 * Admin builder create (+ logo) → public /builders and /b/:id visibility.
 * When linked to a QA project, that project appears under "Projects by …".
 */
test.describe("Admin → User builder visibility", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let builderName = "";
  let projectName = "";
  let builderId = "";

  test.afterEach(async ({ page }) => {
    // Projects first (FK), then builder.
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
    if (builderName) {
      await cleanupQaBuilderByName(page, builderName);
      builderName = "";
      builderId = "";
    }
  });

  test("XAPP-BUILDER-001 — new QA builder with logo appears on user builders @smoke", async ({
    page,
    browser,
  }) => {
    builderName = uniqueQaBuilderName();
    const description = `QA Autotest builder tagline for ${builderName}`;

    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      websiteUrl: "https://example.com/qa-autotest",
      hqCity: "Ahmedabad",
      description,
    });
    builderId = builderIdFromUrl(page.url());
    await uploadBuilderLogo(page);

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await openUserBuilders(userPage);
      const card = builderCardByName(userPage, builderName);
      await expect(card).toBeVisible({ timeout: 20_000 });
      await expect(builderCardLogo(card)).toBeVisible();

      await card.click();
      await expect(userPage).toHaveURL(new RegExp(`/b/${builderId}`));
      await expect(builderH1(userPage)).toHaveText(builderName);
      await expect(builderLogo(userPage)).toBeVisible();
      await expect(userPage.getByText(description)).toBeVisible();
      await expect(websiteLink(userPage)).toHaveAttribute(
        "href",
        "https://example.com/qa-autotest",
      );
    } finally {
      await context.close();
    }
  });

  test("XAPP-BUILDER-002 — QA builder linked project appears on user builder detail", async ({
    page,
    browser,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Ahmedabad",
      description: "QA Autotest builder with linked project.",
    });
    builderId = builderIdFromUrl(page.url());
    await uploadBuilderLogo(page);

    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      builder: builderName,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    const projectId = projectIdFromUrl(page.url());

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/b/${builderId}`);
      await expect(builderH1(userPage)).toHaveText(builderName);
      await expect(projectsHeading(userPage)).toContainText(builderName);
      await expect(
        builderProjectCards(userPage).filter({ hasText: projectName }),
      ).toBeVisible();
      await builderProjectCards(userPage)
        .filter({ hasText: projectName })
        .click();
      await expect(userPage).toHaveURL(new RegExp(`/p/${projectId}`));
      await expect(
        userPage.getByRole("heading", { level: 1 }),
      ).toHaveText(projectName);
    } finally {
      await context.close();
    }
  });

  test("XAPP-BUILDER-003 — soft-deleted builder disappears from user builders listing", async ({
    page,
    browser,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Surat",
    });
    builderId = builderIdFromUrl(page.url());

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await openUserBuilders(userPage);
      await expect(builderCardByName(userPage, builderName)).toBeVisible({
        timeout: 20_000,
      });

      await cleanupQaBuilderByName(page, builderName);
      const deleted = builderName;
      builderName = "";

      await openUserBuilders(userPage);
      await expect(builderCardByName(userPage, deleted)).toHaveCount(0, {
        timeout: 20_000,
      });
    } finally {
      await context.close();
    }
  });
});
