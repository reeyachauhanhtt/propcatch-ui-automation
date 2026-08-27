import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { headerProfileLink, loginAsUser } from "../../../pages/user/auth";

const authFile = path.join(__dirname, "../../../playwright/.auth/user.json");

/**
 * One-time UI login. Saves cookies + localStorage so authenticated projects can
 * reuse the session via storageState instead of signing in on every test.
 */
setup("authenticate", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await loginAsUser(page);
  await expect(headerProfileLink(page)).toBeVisible();

  await page.context().storageState({ path: authFile });
});
