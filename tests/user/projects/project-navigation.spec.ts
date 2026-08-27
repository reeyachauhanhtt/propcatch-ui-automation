import { test, expect } from "@playwright/test";
import { openHomepageLoggedIn } from "../../../pages/user/auth";
import { headerNav } from "../../../pages/user/homePage";
import {
  cardName,
  headerCityButton,
  projectCardByName,
  projectCards,
  projectsHeading,
} from "../../../pages/user/projectListingPage";

/**
 * Navigation to/from the Project Listing page.
 *
 * Project Details is only touched to verify navigation; full Details
 * coverage lives in tests/projects/project-details.spec.ts.
 */
test.describe("Project Listing - Navigation", () => {
  test.describe.configure({ timeout: 45_000 });

  // ------------------------------------------------------------------
  // 3. Project card interaction
  // ------------------------------------------------------------------

  test("PROJECT-005 - clicking a project card opens the project details page", async ({
    page,
  }) => {
    await page.goto("/projects");

    const card = projectCards(page).first();
    const name = await cardName(card).innerText();
    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });

  // ------------------------------------------------------------------
  // 14. Navigation
  // ------------------------------------------------------------------

  test("PROJECT-030 - navigate from the homepage to the projects page", async ({
    page,
  }) => {
    await openHomepageLoggedIn(page);

    await headerNav(page).getByRole("link", { name: "Projects" }).click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(projectsHeading(page)).toBeVisible();
    await expect(projectCards(page).first()).toBeVisible();
  });

  test("PROJECT-031 - navigate from the projects page to project details", async ({
    page,
  }) => {
    await page.goto("/projects");

    await projectCardByName(page, "Montessa Heights").first().click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { name: "Montessa Heights" })).toBeVisible();
  });

  test("PROJECT-032 - browser Back from project details returns to the projects page", async ({
    page,
  }) => {
    await page.goto("/projects");

    await projectCardByName(page, "Montessa Heights").first().click();
    await expect(page).toHaveURL(/\/p\//);

    await page.goBack();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(projectsHeading(page)).toBeVisible();
    await expect(projectCards(page).first()).toBeVisible();
  });

  test("PROJECT-037 - header city selector navigates to the city projects page", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(headerCityButton(page)).toBeVisible();
    await headerCityButton(page).click();

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    for (const city of ["All India", "Ahmedabad", "Mumbai", "Surat"]) {
      await expect(listbox.getByRole("link", { name: city, exact: true })).toBeVisible();
    }

    await listbox.getByRole("link", { name: "Ahmedabad", exact: true }).click();

    await expect(page).toHaveURL(/\/city\/ahmedabad/);
    await expect(
      page.getByRole("heading", { name: "Projects in Ahmedabad" }),
    ).toBeVisible();
    await expect(projectCards(page).first()).toBeVisible();
  });
});
