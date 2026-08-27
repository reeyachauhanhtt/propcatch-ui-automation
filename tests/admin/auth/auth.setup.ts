import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import {
  dashboardHeading,
  loginAsAdmin,
  logoutButton,
} from "../../../pages/admin/auth";

const authFile = path.join(__dirname, "../../../playwright/.auth/admin.json");

/**
 * One-time Admin UI login. Saves cookies + localStorage for admin-* projects.
 */
setup("authenticate admin", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await loginAsAdmin(page);
  await expect(dashboardHeading(page)).toBeVisible();
  await expect(logoutButton(page)).toBeVisible();

  await page.context().storageState({ path: authFile });
});
