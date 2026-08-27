import { test, expect } from "@playwright/test";
import { requireCreds } from "../../../../pages/user/auth";
import {
  accountAvatar,
  accountEmail,
  accountName,
  openProfile,
  profileNavLink,
  signOutButton,
  PROFILE_LINKS,
} from "../../../../pages/user/profilePage";

/**
 * Profile — account overview (/profile).
 *
 * The page is a read-only account overview: an account card (avatar, display
 * name, email), a flat list of links to the other account sub-sections and
 * legal pages, and a Sign out button. There are no editable fields.
 */
test.describe("Profile - account overview", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROF-005 - the account card shows the signed-in user's name and email", async ({
    page,
  }) => {
    await openProfile(page);

    const { email } = requireCreds();

    await expect(accountName(page)).toBeVisible();
    const name = (await accountName(page).innerText()).trim();
    expect(name.length).toBeGreaterThan(0);
    expect(name).not.toMatch(/\b(undefined|null|NaN)\b/);

    await expect(accountEmail(page)).toBeVisible();
    await expect(accountEmail(page)).toHaveText(email);
  });

  test("PROF-006 - the account card shows an avatar image", async ({ page }) => {
    await openProfile(page);

    const avatar = accountAvatar(page);
    await expect(avatar).toBeVisible();

    const alt = (await avatar.getAttribute("alt")) ?? "";
    expect(alt.length).toBeGreaterThan(0);

    const src = (await avatar.getAttribute("src")) ?? "";
    expect(src.length).toBeGreaterThan(0);

    // The avatar's alt mirrors the display name.
    const name = (await accountName(page).innerText()).trim();
    expect(alt).toBe(name);
  });

  test("PROF-007 - the overview lists all account and legal links with correct destinations", async ({
    page,
  }) => {
    await openProfile(page);

    for (const item of PROFILE_LINKS) {
      const link = profileNavLink(page, item.title);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", item.href);
      await expect(link).toContainText(item.subtitle);
    }

    // Exactly these eight links, in order.
    await expect(page.locator("main a")).toHaveCount(PROFILE_LINKS.length);
  });

  test("PROF-008 - the Sign out button is present", async ({ page }) => {
    await openProfile(page);

    // Existence only: the sign-out flow is covered by its own module.
    await expect(signOutButton(page)).toBeVisible();
  });

  test("PROF-009 - the account overview is read-only (no forms; Sign out is the only control)", async ({
    page,
  }) => {
    await openProfile(page);

    await expect(
      page.locator("main input, main textarea, main select"),
    ).toHaveCount(0);
    await expect(page.locator("main button")).toHaveCount(1);
    await expect(signOutButton(page)).toBeVisible();
  });
});
