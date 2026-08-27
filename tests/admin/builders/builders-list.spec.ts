import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  builderRows,
  buildersHeading,
  buildersSubtitle,
  buildersTable,
  expectBuildersListLoaded,
  newBuilderHeading,
  newBuilderLink,
  nextPageButton,
  openBuilders,
  previousPageButton,
} from "../../../pages/admin/buildersPage";

test.describe("Admin Builders list", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openBuilders(page);
  });

  test("ADMIN-BUILDERS-001 — builders list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expectBuildersListLoaded(page);
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expect(page.getByText("Module 3 — Builders")).toBeVisible();
    await expectSidebarItemActive(page, "Builders");
  });

  test("ADMIN-BUILDERS-002 — subtitle and New builder action are visible", async ({
    page,
  }) => {
    await expect(buildersSubtitle(page)).toBeVisible();
    await expect(newBuilderLink(page)).toBeVisible();
    await expect(newBuilderLink(page)).toHaveAttribute("href", "/builders/new");
  });

  test("ADMIN-BUILDERS-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = buildersTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "HQ City" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Projects" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Verified" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Active" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Created" })).toBeVisible();
    expect(await builderRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-BUILDERS-004 — pagination controls are present", async ({ page }) => {
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-BUILDERS-005 — + New builder opens the create form", async ({
    page,
  }) => {
    await newBuilderLink(page).click();
    await expect(page).toHaveURL(/\/builders\/new/);
    await expect(newBuilderHeading(page)).toBeVisible();
    await expect(page.getByText("Builders / New")).toBeVisible();
  });

  test("ADMIN-BUILDERS-006 — opening a seeded builder shows read-only detail chrome", async ({
    page,
  }) => {
    const first = builderRows(page).first().getByRole("link").first();
    const name = (await first.innerText()).trim();
    expect(name).not.toMatch(/^QA Autotest/);

    await first.click();
    await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Builders / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Profile", { exact: true })).toBeVisible();
    // Do not edit or delete seeded builders.
  });

  test("ADMIN-BUILDERS-007 — builders list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expectBuildersListLoaded(page);
    await expect(buildersHeading(page)).toBeVisible();
  });
});
