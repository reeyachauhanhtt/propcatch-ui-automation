import { test, expect } from "@playwright/test";
import {
  QA_PROJECT_BUILDER,
  activeCheckbox,
  addressInput,
  builderSelect,
  cancelDeleteButton,
  cancelLink,
  citySelect,
  cleanupQaProjectByName,
  createProject,
  createProjectButton,
  deleteButton,
  deleteDialog,
  descriptionInput,
  expectProjectAbsentFromList,
  formErrorBanner,
  localitySelect,
  nameInput,
  newProjectHeading,
  openNewProject,
  openProjectDetail,
  openProjects,
  projectIdFromUrl,
  projectNameLink,
  propertyTypeInput,
  requiredErrors,
  restoreButton,
  saveProjectChanges,
  softDeleteProject,
  statusInput,
  uniqueQaProjectName,
} from "../../../pages/admin/projectsPage";

/**
 * Create / edit / soft-delete only disposable QA Autotest projects.
 * Never mutate seeded projects. Link to seeded builder via select only.
 */
test.describe("Admin Projects CRUD", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let projectName = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
  });

  test("ADMIN-PROJECTS-010 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewProject(page);

    await expect(newProjectHeading(page)).toBeVisible();
    await expect(nameInput(page)).toBeVisible();
    await expect(builderSelect(page)).toBeVisible();
    await expect(propertyTypeInput(page)).toBeVisible();
    await expect(statusInput(page)).toBeVisible();
    await expect(citySelect(page)).toBeVisible();
    await expect(localitySelect(page)).toBeVisible();
    await expect(addressInput(page)).toBeVisible();
    await expect(descriptionInput(page)).toBeVisible();
    await expect(activeCheckbox(page)).toBeVisible();
    await expect(createProjectButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
    await expect(page.getByText("Amenities (optional)")).toBeVisible();
  });

  test("ADMIN-PROJECTS-011 — empty required fields show validation", async ({
    page,
  }) => {
    await openNewProject(page);
    await page.getByRole("button", { name: "Create project", exact: true }).click();

    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    expect(await requiredErrors(page).count()).toBeGreaterThanOrEqual(3);
  });

  test("ADMIN-PROJECTS-012 — Cancel returns to the projects list", async ({
    page,
  }) => {
    await openNewProject(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  });

  test("ADMIN-PROJECTS-020 — can create a disposable QA project @smoke", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();

    await createProject(page, {
      name: projectName,
      builder: QA_PROJECT_BUILDER,
      propertyType: "Apartment",
      status: "under_construction",
      city: "Ahmedabad",
      locality: "SG Highway",
    });

    const projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);

    await expect(page.getByRole("heading", { name: projectName, exact: true })).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
    await expect(page.getByText(QA_PROJECT_BUILDER).first()).toBeVisible();
    await expect(page.getByText("Apartment").first()).toBeVisible();
    await expect(page.getByText("Under Construction").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
  });

  test("ADMIN-PROJECTS-021 — created QA project appears on the list", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });

    await openProjects(page);
    await expect(projectNameLink(page, projectName)).toBeVisible();
  });

  test("ADMIN-PROJECTS-030 — can edit a QA project name", async ({ page }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, {
      name: projectName,
      description: "Before edit",
    });

    const editedName = `${projectName} Edited`;
    await nameInput(page).fill(editedName);
    await descriptionInput(page).fill("After edit — QA Autotest");
    await saveProjectChanges(page);

    const projectId = projectIdFromUrl(page.url());
    if (page.url().includes("/edit")) {
      await expect(nameInput(page)).toHaveValue(editedName);
      await openProjectDetail(page, projectId);
    }

    await expect(page.getByRole("heading", { name: editedName, exact: true })).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
    await expect(page.getByText("After edit — QA Autotest")).toBeVisible();

    projectName = editedName;
  });

  test("ADMIN-PROJECTS-040 — soft-delete removes QA project from list @smoke", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });

    const projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);
    await softDeleteProject(page);
    await expectProjectAbsentFromList(page, projectName);

    await openProjectDetail(page, projectId);
    await expect(page.getByRole("heading", { name: projectName, exact: true })).toBeVisible();
    await expect(restoreButton(page)).toBeVisible();
    await expect(deleteButton(page)).toHaveCount(0);

    projectName = "";
  });

  test("ADMIN-PROJECTS-041 — delete dialog Cancel keeps the QA project", async ({
    page,
  }) => {
    projectName = uniqueQaProjectName();
    await createProject(page, { name: projectName });

    const projectId = projectIdFromUrl(page.url());
    await openProjectDetail(page, projectId);

    await deleteButton(page).click();
    await expect(deleteDialog(page)).toBeVisible();
    await expect(deleteDialog(page)).toContainText(projectName);
    await cancelDeleteButton(page).click();
    await expect(deleteDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/?$`));
    await expect(page.getByRole("heading", { name: projectName, exact: true })).toBeVisible();
  });
});
