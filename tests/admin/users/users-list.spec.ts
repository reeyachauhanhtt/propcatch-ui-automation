import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  openUsers,
  userLinkInRow,
  userRows,
  usersHeading,
  usersModuleLabel,
  usersSubtitle,
  usersTable,
} from "../../../pages/admin/usersPage";

test.describe("Admin Users list", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openUsers(page);
  });

  test("ADMIN-USERS-001 — users list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(usersHeading(page)).toBeVisible();
    await expect(usersModuleLabel(page)).toBeVisible();
    await expect(usersSubtitle(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Users");
  });

  test("ADMIN-USERS-002 — list shows user identity, role, status, and creation columns", async ({
    page,
  }) => {
    await expect(usersTable(page)).toBeVisible();
    for (const column of [
      "Name",
      "Email",
      "Primary role",
      "Roles",
      "Active",
      "Created",
    ]) {
      await expect(usersTable(page).getByRole("columnheader", { name: column })).toBeVisible();
    }
    expect(await userRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-USERS-003 — clicking a user name opens that user detail @smoke", async ({
    page,
  }) => {
    const row = userRows(page).first();
    const link = userLinkInRow(row);
    const name = (await link.innerText()).trim();
    const href = await link.getAttribute("href");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href ?? "")}/?$`));
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Users / Detail")).toBeVisible();
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
