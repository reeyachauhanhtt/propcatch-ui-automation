import { test, expect } from "@playwright/test";
import { openHomepageLoggedIn } from "../../../pages/user/auth";
import {
  bottomNav,
  browseProjectsLink,
  exploreHeading,
  featuredHeading,
  footer,
  headerNav,
  headerNotificationsLink,
  headerProfileLink,
  headerSearchLink,
  headerShortlistLink,
  heroHeading,
  logoLink,
  openMapViewLink,
} from "../../../pages/user/homePage";

test.describe("Homepage navigation", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openHomepageLoggedIn(page);
  });

  test("HOMEPAGE-024 - logo returns the user to the homepage", async ({
    page,
  }) => {
    await headerNav(page).getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

    await logoLink(page).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(heroHeading(page)).toBeVisible();
  });

  test("HOMEPAGE-025 - user can navigate to Projects from the header", async ({
    page,
  }) => {
    await headerNav(page).getByRole("link", { name: "Projects" }).click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("HOMEPAGE-026 - user can navigate to Builders from the header", async ({
    page,
  }) => {
    await headerNav(page).getByRole("link", { name: "Builders" }).click();

    await expect(page).toHaveURL(/\/builders/);
    await expect(page.getByRole("heading", { name: "Builders" })).toBeVisible();
  });

  test("HOMEPAGE-027 - user can navigate to Map from the header", async ({
    page,
  }) => {
    await headerNav(page).getByRole("link", { name: "Map" }).click();

    await expect(page).toHaveURL(/\/map/);
    await expect(page.getByRole("heading", { name: "Map" })).toBeVisible();
  });

  test("HOMEPAGE-028 - user can navigate to Compare from the header", async ({
    page,
  }) => {
    await headerNav(page).getByRole("link", { name: "Compare" }).click();

    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByRole("heading", { name: "Compare projects" })).toBeVisible();
  });

  test("HOMEPAGE-029 - header Search opens the projects page", async ({
    page,
  }) => {
    await headerSearchLink(page).click();

    await expect(page).toHaveURL(/\/projects|\/city\//);
    await expect(page.getByRole("heading", { name: /Projects/ })).toBeVisible();
  });

  test("HOMEPAGE-030 - header Notifications opens the notifications page", async ({
    page,
  }) => {
    await headerNotificationsLink(page).click();

    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });

  test("HOMEPAGE-031 - header Shortlist opens the shortlist page", async ({
    page,
  }) => {
    await headerShortlistLink(page).click();

    await expect(page).toHaveURL(/\/shortlist/);
    await expect(page.getByRole("heading", { name: "Shortlist" })).toBeVisible();
  });

  test("HOMEPAGE-032 - header Profile opens the profile page", async ({
    page,
  }) => {
    await headerProfileLink(page).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: /My Enquiries/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: /Site Visits/ }),
    ).toBeVisible();
  });

  test("HOMEPAGE-033 - Browse projects CTA opens the projects page", async ({
    page,
  }) => {
    await browseProjectsLink(page).click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("HOMEPAGE-034 - Open map view CTA opens the map page", async ({
    page,
  }) => {
    await openMapViewLink(page).click();

    await expect(page).toHaveURL(/\/map/);
    await expect(page.getByRole("heading", { name: "Map" })).toBeVisible();
  });

  test("HOMEPAGE-035 - View all from featured opens the projects page", async ({
    page,
  }) => {
    await featuredHeading(page)
      .locator("xpath=ancestor::section[1]")
      .getByRole("link", { name: /View all/ })
      .click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("HOMEPAGE-036 - View all from explore opens the projects page", async ({
    page,
  }) => {
    await exploreHeading(page)
      .locator("xpath=ancestor::section[1]")
      .getByRole("link", { name: /View all/ })
      .click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("HOMEPAGE-037 - footer Site Visits opens the site visits page", async ({
    page,
  }) => {
    await footer(page).getByRole("link", { name: "Site Visits" }).click();

    await expect(page).toHaveURL(/\/visits/);
    await expect(page.getByRole("heading", { name: "Site Visits" })).toBeVisible();
  });

  test("HOMEPAGE-038 - footer My Enquiries opens the enquiries page", async ({
    page,
  }) => {
    await footer(page).getByRole("link", { name: "My Enquiries" }).click();

    await expect(page).toHaveURL(/\/enquiries/);
    await expect(page.getByRole("heading", { name: "My Enquiries" })).toBeVisible();
  });

  test("HOMEPAGE-039 - footer Saved Searches opens the saved searches page", async ({
    page,
  }) => {
    await footer(page).getByRole("link", { name: "Saved Searches" }).click();

    await expect(page).toHaveURL(/\/saved-searches/);
    await expect(page.getByRole("heading", { name: "Saved Searches" })).toBeVisible();
  });

  test("HOMEPAGE-040 - footer legal links open the legal pages", async ({
    page,
  }) => {
    await footer(page).getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL(/\/legal\/privacy/);
    await expect(page.locator("body")).not.toBeEmpty();

    await page.goto("/");
    await expect(heroHeading(page)).toBeVisible();
    await footer(page).getByRole("link", { name: "Terms of Service" }).click();
    await expect(page).toHaveURL(/\/legal\/terms/);

    await page.goto("/");
    await footer(page).getByRole("link", { name: "Data Deletion" }).click();
    await expect(page).toHaveURL(/\/legal\/data-deletion/);
  });

  test("HOMEPAGE-041 - footer Explore links navigate from the homepage", async ({
    page,
  }) => {
    await footer(page).getByRole("link", { name: "Builders" }).click();
    await expect(page).toHaveURL(/\/builders/);
    await expect(page.getByRole("heading", { name: "Builders" })).toBeVisible();
  });

  test("HOMEPAGE-042 - profile opened from the homepage shows account navigation and Sign out", async ({
    page,
  }) => {
    await headerProfileLink(page).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeEnabled();
    await expect(page.getByRole("link", { name: "Notifications" }).first()).toBeVisible();
  });
});

test.describe("Homepage mobile navigation", () => {
  test.describe.configure({ timeout: 45_000 });
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await openHomepageLoggedIn(page);
  });

  test("HOMEPAGE-043 - mobile Home is the active bottom navigation item", async ({
    page,
  }) => {
    const home = bottomNav(page).getByRole("link", { name: "Home" });
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute("href", "/");
    await expect(home).toHaveClass(/text-accent/);
    await expect(
      bottomNav(page).getByRole("link", { name: "Projects" }),
    ).not.toHaveClass(/text-accent/);
  });

  test("HOMEPAGE-044 - mobile bottom navigation opens Projects", async ({
    page,
  }) => {
    await bottomNav(page).getByRole("link", { name: "Projects" }).click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("HOMEPAGE-045 - mobile bottom navigation returns to the homepage", async ({
    page,
  }) => {
    await bottomNav(page).getByRole("link", { name: "Builders" }).click();
    await expect(page).toHaveURL(/\/builders/);

    await bottomNav(page).getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(heroHeading(page)).toBeVisible();
    await expect(bottomNav(page).getByRole("link", { name: "Home" })).toHaveClass(
      /text-accent/,
    );
  });

  test("HOMEPAGE-046 - mobile bottom navigation opens Profile", async ({
    page,
  }) => {
    await bottomNav(page).getByRole("link", { name: "Profile" }).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
