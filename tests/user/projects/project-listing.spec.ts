import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser, expectLoggedInHeader } from "../../../pages/user/auth";
import { expectNoBrokenValues } from "../../../pages/user/homePage";
import {
  cardName,
  countLabel,
  expectCardCountMatchesLabel,
  mapViewLink,
  projectCards,
  projectsHeading,
} from "../../../pages/user/projectListingPage";

/**
 * Project Listing page (https://propcatchwebapp.vercel.app/projects).
 *
 * The listing page is PUBLIC (server-rendered, no auth gate), so the
 * listing tests run as an anonymous visitor. Authentication behaviour
 * is covered explicitly at the bottom.
 *
 * Search, filters, compare, and navigation coverage now live in their own
 * spec files under tests/projects/.
 */
test.describe("Project Listing page", () => {
  test.describe.configure({ timeout: 45_000 });

  // ------------------------------------------------------------------
  // 1. Projects page loading
  // ------------------------------------------------------------------

  test("PROJECT-001 - projects page loads successfully @smoke", async ({ page }) => {
    await page.goto("/projects");

    await expect(page).toHaveURL(/\/projects$/);
    await expect(projectsHeading(page)).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(countLabel(page)).toBeVisible();
    await expect(mapViewLink(page)).toBeVisible();
    await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(0);
    await expectNoBrokenValues(page);
  });

  // ------------------------------------------------------------------
  // 2. Project listing
  // ------------------------------------------------------------------

  test("PROJECT-002 - projects are displayed with name, location, and price", async ({
    page,
  }) => {
    await page.goto("/projects");

    const first = projectCards(page).first();
    await expect(first).toBeVisible();
    await expect(cardName(first)).toBeVisible();
    await expect(first.getByText(/₹|Price on request/)).toBeVisible();
    await expect(first.getByText(/Mumbai|Ahmedabad|Surat/)).toBeVisible();
    await expectNoBrokenValues(page);
  });

  test("PROJECT-003 - multiple projects can be displayed", async ({ page }) => {
    await page.goto("/projects");

    await expect(projectCards(page).first()).toBeVisible();
    const count = await projectCards(page).count();
    expect(count).toBeGreaterThan(1);
    await expectCardCountMatchesLabel(page);
  });

  test("PROJECT-004 - project information is consistent across project cards", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    const total = await cards.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      const name = await cardName(card).innerText();
      expect(name.trim().length).toBeGreaterThan(0);
      await expect(card.getByText(/₹|Price on request/)).toBeVisible();
      await expect(card.getByText(/,\s*(Mumbai|Ahmedabad|Surat)/)).toBeVisible();
      await expect(card.locator("span.rounded-full").first()).toHaveText(
        /Ready to Move|Under Construction|New Launch|upcoming/i,
      );
    }
  });

  // ------------------------------------------------------------------
  // 16. Authentication
  // ------------------------------------------------------------------

  test("PROJECT-035 - an authenticated user can access the projects page", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/projects");

    await expect(projectsHeading(page)).toBeVisible();
    await expect(projectCards(page).first()).toBeVisible();
    await expectLoggedInHeader(page);
  });

  test.describe("Unauthenticated access", () => {
    test.use({ storageState: anonymousStorageState });

    test("PROJECT-036 - an unauthenticated user can access the public projects page", async ({
      page,
    }) => {
      await page.goto("/projects");

      // Observed behaviour: /projects is public (server-rendered). No redirect
      // to /login; the anonymous header shows "Sign in" instead of a profile.
      await expect(page).toHaveURL(/\/projects$/);
      await expect(projectsHeading(page)).toBeVisible();
      await expect(projectCards(page).first()).toBeVisible();
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Sign in" }),
      ).toBeVisible();
      await expect(page.getByRole("banner").locator('a[href="/profile"]')).toHaveCount(0);
    });
  });
});
