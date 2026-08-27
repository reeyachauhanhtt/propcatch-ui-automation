import { test, expect } from "@playwright/test";
import {
  anonymousStorageState,
  expectLoggedInHeader,
  headerSignInLink,
  loginAsUser,
  openHomepageLoggedIn,
  signOut,
} from "../../../pages/user/auth";
import {
  banner,
  bottomNav,
  cityButton,
  cityListbox,
  expectHomepageLoaded,
  expectNoBrokenValues,
  expectNoHorizontalOverflow,
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
  projectCards,
} from "../../../pages/user/homePage";

test.describe("Homepage UI", () => {
  test.describe.configure({ timeout: 45_000 });

  test.describe("Authenticated homepage", () => {
    test.beforeEach(async ({ page }) => {
      await openHomepageLoggedIn(page);
    });

    test("HOMEPAGE-001 - homepage loads successfully after login @smoke", async ({
      page,
    }) => {
      await expectHomepageLoaded(page);
      await expectLoggedInHeader(page);
    });

    test("HOMEPAGE-002 - homepage URL and title are correct", async ({
      page,
    }) => {
      await expect(page).toHaveURL(/\/$/);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page).toHaveTitle(/EstateVue/i);
    });

    test("HOMEPAGE-003 - hero and main homepage sections are visible", async ({
      page,
    }) => {
      await expect(heroHeading(page)).toBeVisible();
      await expect(
        page.getByText(
          "Browse curated residential projects, connect with builders, and book site visits",
        ),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Browse projects" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Open map view" })).toBeVisible();
      await expect(featuredHeading(page)).toBeVisible();
      await expect(exploreHeading(page)).toBeVisible();
      await expect(page.getByText(/projects available/i)).toBeVisible();
    });

    test("HOMEPAGE-004 - header is displayed with logo, city, nav, and account controls", async ({
      page,
    }) => {
      await expect(banner(page)).toBeVisible();
      await expect(logoLink(page)).toBeVisible();
      await expect(logoLink(page)).toContainText("Estate");
      await expect(logoLink(page)).toContainText("Vue");
      await expect(cityButton(page)).toBeVisible();
      await expect(headerNav(page).getByRole("link", { name: "Projects" })).toBeVisible();
      await expect(headerNav(page).getByRole("link", { name: "Builders" })).toBeVisible();
      await expect(headerNav(page).getByRole("link", { name: "Map" })).toBeVisible();
      await expect(headerNav(page).getByRole("link", { name: "Compare" })).toBeVisible();
      await expect(headerSearchLink(page)).toBeVisible();
      await expect(headerNotificationsLink(page)).toBeVisible();
      await expect(headerShortlistLink(page)).toBeVisible();
      await expect(headerProfileLink(page)).toBeVisible();
      await expect(headerSignInLink(page)).toHaveCount(0);
    });

    test("HOMEPAGE-005 - featured under construction section is displayed", async ({
      page,
    }) => {
      await expect(featuredHeading(page)).toBeVisible();
      await expect(page.getByText("Curated picks in progress")).toBeVisible();
      await expect(
        featuredHeading(page)
          .locator("xpath=ancestor::section[1]")
          .getByRole("link", { name: /View all/ }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Go to slide 1" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Go to slide 2" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Go to slide 3" })).toBeVisible();
    });

    test("HOMEPAGE-006 - explore projects section lists project cards", async ({
      page,
    }) => {
      await expect(exploreHeading(page)).toBeVisible();
      await expect(page.getByText(/\d+ projects available/)).toBeVisible();
      await expect(projectCards(page).first()).toBeVisible();
      expect(await projectCards(page).count()).toBeGreaterThan(2);
    });

    test("HOMEPAGE-007 - value proposition sections are displayed", async ({
      page,
    }) => {
      await expect(page.getByRole("heading", { name: "Verified builders" })).toBeVisible();
      await expect(
        page.getByText(/vetted for RERA compliance/i),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Locality intelligence" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Direct to builder" }),
      ).toBeVisible();
    });

    test("HOMEPAGE-008 - footer is displayed with explore, account, and legal links", async ({
      page,
    }) => {
      await expect(footer(page)).toBeVisible();
      await expect(footer(page).getByRole("heading", { name: "Explore" })).toBeVisible();
      await expect(footer(page).getByRole("heading", { name: "Account" })).toBeVisible();
      await expect(footer(page).getByRole("heading", { name: "Legal" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Projects" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Shortlist" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "My Enquiries" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Site Visits" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Saved Searches" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Privacy Policy" })).toBeVisible();
      await expect(footer(page).getByRole("link", { name: "Terms of Service" })).toBeVisible();
      await expect(footer(page).getByText(/PropCatch/i)).toBeVisible();
    });

    test("HOMEPAGE-009 - page does not show broken undefined, null, or NaN values", async ({
      page,
    }) => {
      await expectNoBrokenValues(page);
    });

    test("HOMEPAGE-010 - city selector lists All India and available cities", async ({
      page,
    }) => {
      await cityButton(page).click();
      await expect(cityListbox(page)).toBeVisible();
      await expect(cityListbox(page).getByRole("link", { name: "All India" })).toBeVisible();
      await expect(cityListbox(page).getByRole("link", { name: "Ahmedabad" })).toBeVisible();
      await expect(cityListbox(page).getByRole("link", { name: "Mumbai" })).toBeVisible();
      await expect(cityListbox(page).getByRole("link", { name: "Surat" })).toBeVisible();
    });

    test("HOMEPAGE-011 - selecting a city updates the header city label", async ({
      page,
    }) => {
      await cityButton(page).click();
      await cityListbox(page).getByRole("link", { name: "Mumbai" }).click();

      await expect(banner(page).getByRole("button", { name: "Mumbai" })).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await expect(heroHeading(page)).toBeVisible();
    });

    test("HOMEPAGE-012 - city dropdown closes after clicking outside", async ({
      page,
    }) => {
      await cityButton(page).click();
      await expect(cityListbox(page)).toBeVisible();

      await heroHeading(page).click();

      await expect(cityListbox(page)).toHaveCount(0);
      await expect(cityButton(page)).toBeVisible();
    });

    test("HOMEPAGE-013 - selecting All India restores the All India label", async ({
      page,
    }) => {
      await cityButton(page).click();
      await cityListbox(page).getByRole("link", { name: "Surat" }).click();
      await expect(banner(page).getByRole("button", { name: "Surat" })).toBeVisible();

      await cityButton(page).click();
      await cityListbox(page).getByRole("link", { name: "All India" }).click();

      await expect(banner(page).getByRole("button", { name: "All India" })).toBeVisible();
    });

    test("HOMEPAGE-014 - city selection is retained after opening another page", async ({
      page,
    }) => {
      await cityButton(page).click();
      await cityListbox(page).getByRole("link", { name: "Ahmedabad" }).click();
      await expect(banner(page).getByRole("button", { name: "Ahmedabad" })).toBeVisible();

      await headerNav(page).getByRole("link", { name: "Projects" }).click();
      await expect(page).toHaveURL(/\/projects|\/city\/ahmedabad/);

      await page.goto("/");
      await expect(heroHeading(page)).toBeVisible();
      await expect(banner(page).getByRole("button", { name: "Ahmedabad" })).toBeVisible();
    });

    test("HOMEPAGE-015 - authenticated session remains after homepage refresh", async ({
      page,
    }) => {
      await page.reload();
      await expectHomepageLoaded(page);
      await expectLoggedInHeader(page);
    });

    test("HOMEPAGE-016 - homepage has no desktop sidebar", async ({ page }) => {
      await expect(page.getByRole("complementary")).toHaveCount(0);
      await expect(bottomNav(page)).toHaveCount(0);
      await expect(headerNav(page)).toBeVisible();
    });

    test("HOMEPAGE-017 - desktop homepage does not overflow horizontally", async ({
      page,
    }) => {
      await expectNoHorizontalOverflow(page);
      await expect(headerNav(page).getByRole("link", { name: "Projects" })).toBeVisible();
      await expect(headerSearchLink(page)).toBeVisible();
    });
  });

  test.describe("Session and public access", () => {
    // Must start logged out to assert Sign in / anonymous redirects.
    test.use({ storageState: anonymousStorageState });

    test("HOMEPAGE-018 - unauthenticated user can still open the public homepage", async ({
      page,
    }) => {
      await page.goto("/");
      await expectHomepageLoaded(page);
      await expect(headerSignInLink(page)).toBeVisible();
      await expect(headerProfileLink(page)).toHaveCount(0);
      await expect(headerNotificationsLink(page)).toHaveCount(0);
    });

    test("HOMEPAGE-019 - unauthenticated user is redirected from notifications", async ({
      page,
    }) => {
      await page.goto("/notifications");
      await expect(page).toHaveURL(/\/login\?next=/);
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });

    test("HOMEPAGE-020 - after logout the homepage shows Sign in", async ({
      page,
    }) => {
      await loginAsUser(page);
      await signOut(page);

      await page.goto("/");
      await expectHomepageLoaded(page);
      await expect(headerSignInLink(page)).toBeVisible();
      await expect(headerProfileLink(page)).toHaveCount(0);
    });

    test("HOMEPAGE-021 - after logout protected homepage controls redirect to login", async ({
      page,
    }) => {
      await loginAsUser(page);
      await signOut(page);

      await page.goto("/notifications");
      await expect(page).toHaveURL(/\/login\?next=%2Fnotifications/);
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });
  });

  test.describe("Laptop viewport", () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test("HOMEPAGE-022 - laptop viewport keeps header navigation usable", async ({
      page,
    }) => {
      await openHomepageLoggedIn(page);
      await expectNoHorizontalOverflow(page);
      await expect(headerNav(page).getByRole("link", { name: "Projects" })).toBeVisible();
      await expect(headerSearchLink(page)).toBeVisible();
      await expect(cityButton(page)).toBeVisible();
      await expect(bottomNav(page)).toHaveCount(0);
    });
  });

  test.describe("Mobile viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("HOMEPAGE-023 - mobile homepage shows bottom navigation without overflow", async ({
      page,
    }) => {
      await openHomepageLoggedIn(page);
      await expectHomepageLoaded(page);
      await expectNoHorizontalOverflow(page);
      await expect(bottomNav(page)).toBeVisible();
      await expect(bottomNav(page).getByRole("link", { name: "Home" })).toBeVisible();
      await expect(bottomNav(page).getByRole("link", { name: "Projects" })).toBeVisible();
      await expect(bottomNav(page).getByRole("link", { name: "Builders" })).toBeVisible();
      await expect(bottomNav(page).getByRole("link", { name: "Shortlist" })).toBeVisible();
      await expect(bottomNav(page).getByRole("link", { name: "Profile" })).toBeVisible();
      await expect(headerSearchLink(page)).toBeVisible();
      await expect(cityButton(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "Browse projects" })).toBeVisible();
    });
  });
});
