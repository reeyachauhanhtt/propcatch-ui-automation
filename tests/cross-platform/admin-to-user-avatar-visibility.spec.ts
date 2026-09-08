import { test, expect } from "@playwright/test";
import {
  QA_BUILDER_LOGO,
  mediaUploaderButton,
  uploadMediaFile,
} from "../../pages/admin/mediaPage";
import {
  avatarSection,
  openUserDetailByEmail,
  userIdFromUrl,
} from "../../pages/admin/usersPage";
import { USER_BASE_URL, openUserContext, requireUserEmail } from "../../pages/crossPlatform";
import { loginAsUser } from "../../pages/user/auth";
import { accountAvatar } from "../../pages/user/profilePage";

/**
 * The configured TEST_USER is a disposable QA account used to prove that an
 * avatar set from Admin is served on the user-facing Profile page.
 */
test.describe("Cross-platform Admin avatar → user Profile", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test("CROSS-AVATAR-001 — Admin avatar upload appears on the user Profile @smoke", async ({
    page,
    browser,
  }) => {
    const email = requireUserEmail();
    await openUserDetailByEmail(page, email);
    const userId = userIdFromUrl(page.url());
    const previousAvatarSrc = await avatarSection(page)
      .locator("img")
      .first()
      .getAttribute("src");

    await uploadMediaFile(page, "user.avatar", QA_BUILDER_LOGO);
    await expect(mediaUploaderButton(page, "user.avatar")).toHaveText(
      /Upload|Replace/,
      { timeout: 30_000 },
    );
    await expect
      .poll(
        async () =>
          avatarSection(page).locator("img").first().getAttribute("src"),
        { timeout: 30_000 },
      )
      .not.toBe(previousAvatarSrc);
    const adminAvatarSrc = await avatarSection(page)
      .locator("img")
      .first()
      .getAttribute("src");
    expect(adminAvatarSrc).toMatch(new RegExp(`/users/${userId}/avatar/`));

    const { context: userContext, page: userPage } = await openUserContext(browser);
    try {
      await loginAsUser(userPage);
      await userPage.goto(`${USER_BASE_URL}/profile`);
      await expect
        .poll(
          async () => {
            await userPage.reload();
            return accountAvatar(userPage).getAttribute("src");
          },
          { timeout: 45_000, intervals: [1_000, 2_000, 5_000] },
        )
        .toBe(adminAvatarSrc);
    } finally {
      await userContext.close();
    }
  });
});
