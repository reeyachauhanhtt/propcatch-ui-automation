import { test, expect } from "@playwright/test";
import { expectNoBrokenValues } from "../../../pages/user/homePage";
import { anonymousStorageState, headerProfileLink, loginAsUser } from "../../../pages/user/auth";
import {
  amenitiesHeading,
  emiHeading,
  locationText,
  openProject,
  projectName,
  statusBadge,
} from "../../../pages/user/projectDetailsPage";

/**
 * Project Details page — loading, identity and access control.
 *
 * The details page is PUBLIC (server-rendered, no auth gate): anonymous
 * visitors can view the full page; gated actions (site visit / contact /
 * shortlist) redirect to /login.
 */
test.describe("Project Details - Overview", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-001 - project details page loads", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(
      page.getByText(/Something broke|Application error/i),
    ).toHaveCount(0);
    await expectNoBrokenValues(page);
  });

  test("PROJECT-DETAIL-002 - project name is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(projectName(page)).toBeVisible();
    await expect(projectName(page)).toHaveText("Montessa Heights");
  });

  test("PROJECT-DETAIL-003 - project status is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(statusBadge(page)).toBeVisible();
    await expect(statusBadge(page)).toHaveText("Ready to Move");
  });

  test("PROJECT-DETAIL-004 - project location is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(locationText(page)).toBeVisible();
    await expect(locationText(page)).toHaveText(/,\s*(Mumbai|Ahmedabad|Surat)/);
  });

  test("PROJECT-DETAIL-005 - key sections render", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    for (const label of ["Configuration", "Area range", "Price", "Possession"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(amenitiesHeading(page)).toBeVisible();
    await expect(emiHeading(page)).toBeVisible();
    await expectNoBrokenValues(page);
  });

  test.describe("Unauthenticated access", () => {
    test.use({ storageState: anonymousStorageState });

    test("PROJECT-DETAIL-006 - unauthenticated user can access the public details page", async ({
      page,
    }) => {
      await openProject(page, "Montessa Heights");

      // Observed behaviour: the details page is public — no redirect to /login.
      await expect(page).toHaveURL(/\/p\//);
      await expect(projectName(page)).toBeVisible();
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Sign in" }),
      ).toBeVisible();
      await expect(page.getByRole("banner").locator('a[href="/profile"]')).toHaveCount(
        0,
      );
    });
  });

  test("PROJECT-DETAIL-007 - authenticated user can access the details page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await openProject(page, "Montessa Heights");

    await expect(projectName(page)).toBeVisible();
    await expect(headerProfileLink(page)).toBeVisible();
  });
});
