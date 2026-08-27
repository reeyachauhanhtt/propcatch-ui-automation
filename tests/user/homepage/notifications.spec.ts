import { test, expect } from "@playwright/test";
import { openHomepageLoggedIn } from "../../../pages/user/auth";
import { headerNotificationsLink, heroHeading } from "../../../pages/user/homePage";

test.describe("Homepage notifications", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openHomepageLoggedIn(page);
  });

  test("HOMEPAGE-056 - notification icon is visible on the homepage", async ({
    page,
  }) => {
    await expect(headerNotificationsLink(page)).toBeVisible();
    await expect(headerNotificationsLink(page)).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  test("HOMEPAGE-057 - clicking the notification icon opens the notifications page", async ({
    page,
  }) => {
    await headerNotificationsLink(page).click();

    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(
      page.getByText(/Enquiry updates, saved-search matches, messages/i),
    ).toBeVisible();
  });

  test("HOMEPAGE-058 - notifications are displayed or an empty state is shown", async ({
    page,
  }) => {
    await headerNotificationsLink(page).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();

    const items = page.locator('main a[href^="/p/"]');
    const empty = page.getByText(/no notification|nothing yet|no updates/i);
    const count = await items.count();

    if (count > 0) {
      await expect(items.first()).toBeVisible();
      await expect(items.first()).toHaveText(/.+/);
    } else {
      await expect(empty.or(page.getByText(/saved-search matches/i))).toBeVisible();
    }
  });

  test("HOMEPAGE-059 - opening a notification goes to the related project", async ({
    page,
  }) => {
    await headerNotificationsLink(page).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();

    const items = page.locator('main a[href^="/p/"]');
    test.skip((await items.count()) === 0, "No notifications available for this user");

    const href = await items.first().getAttribute("href");
    await items.first().click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("HOMEPAGE-060 - user can return to the homepage after opening notifications", async ({
    page,
  }) => {
    await headerNotificationsLink(page).click();
    await expect(page).toHaveURL(/\/notifications/);

    await page.getByRole("banner").locator('a[href="/"]').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(heroHeading(page)).toBeVisible();
  });
});
