import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  expectProjectsListLoaded,
  newProjectHeading,
  newProjectLink,
  nextPageButton,
  openProjects,
  previousPageButton,
  projectRows,
  projectsHeading,
  projectsSubtitle,
  projectsTable,
} from "../../../pages/admin/projectsPage";

test.describe("Admin Projects list", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openProjects(page);
  });

  test("ADMIN-PROJECTS-001 — projects list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expectProjectsListLoaded(page);
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expect(page.getByText("Module 4 — Projects")).toBeVisible();
    await expectSidebarItemActive(page, "Projects");
  });

  test("ADMIN-PROJECTS-002 — subtitle and New project action are visible", async ({
    page,
  }) => {
    await expect(projectsSubtitle(page)).toBeVisible();
    await expect(newProjectLink(page)).toBeVisible();
    await expect(newProjectLink(page)).toHaveAttribute("href", "/projects/new");
  });

  test("ADMIN-PROJECTS-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = projectsTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Project" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "City" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Units" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Possession" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Active" })).toBeVisible();
    expect(await projectRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-PROJECTS-004 — pagination controls are present", async ({ page }) => {
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-PROJECTS-005 — + New project opens the create form", async ({
    page,
  }) => {
    await newProjectLink(page).click();
    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(newProjectHeading(page)).toBeVisible();
    await expect(page.getByText("Projects / New")).toBeVisible();
  });

  test("ADMIN-PROJECTS-006 — opening a seeded project shows read-only detail chrome", async ({
    page,
  }) => {
    const rows = projectRows(page);
    const count = await rows.count();
    let name = "";
    let link = rows.first().getByRole("link").first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).getByRole("link").first();
      const text = (await candidate.innerText()).trim();
      if (!/^QA Autotest/.test(text)) {
        name = text;
        link = candidate;
        break;
      }
    }
    expect(name.length).toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Project", { exact: true })).toBeVisible();
    // Do not edit or delete seeded projects.
  });

  test("ADMIN-PROJECTS-007 — projects list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expectProjectsListLoaded(page);
    await expect(projectsHeading(page)).toBeVisible();
  });
});
