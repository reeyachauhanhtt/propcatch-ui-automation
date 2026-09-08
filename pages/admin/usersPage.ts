import { expect, type Page } from "@playwright/test";
import { mediaSection } from "./mediaPage";
import { expectAdminShellVisible } from "./shell";

export const USER_AVATAR_SLOT = "user.avatar";

export function main(page: Page) {
  return page.getByRole("main");
}

export function usersHeading(page: Page) {
  return page.getByRole("heading", { name: "Users", exact: true });
}

export function usersModuleLabel(page: Page) {
  return main(page).getByText("Module 1 — Authentication & Access", {
    exact: true,
  });
}

export function usersSubtitle(page: Page) {
  return main(page).getByText(
    "Internal team members and their roles. Read-only at MVP.",
  );
}

export function usersTable(page: Page) {
  return main(page).getByRole("table");
}

export function userRows(page: Page) {
  return usersTable(page).locator("tbody tr");
}

export function userRowByEmail(page: Page, email: string) {
  return userRows(page).filter({ hasText: email });
}

export function userNameLink(page: Page, name: string) {
  return usersTable(page).getByRole("link", { name, exact: true });
}

export function userLinkInRow(row: ReturnType<typeof userRows>) {
  return row.locator('a[href^="/users/"]').first();
}

export function avatarSection(page: Page) {
  return mediaSection(page, USER_AVATAR_SLOT);
}

export function userDetailHeading(page: Page, name: string) {
  return page.getByRole("heading", { name, exact: true });
}

export async function openUsers(page: Page) {
  await page.goto("/users");
  await expectUsersListLoaded(page);
}

export async function expectUsersListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/users\/?(\?.*)?$/);
  await expect(usersHeading(page)).toBeVisible();
  await expect(usersSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function openUserDetailByEmail(page: Page, email: string) {
  await openUsers(page);
  const row = userRowByEmail(page, email);
  await expect(row).toHaveCount(1);
  await userLinkInRow(row).click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/i);
}

export function userIdFromUrl(url: string) {
  const match = url.match(/\/users\/([0-9a-f-]+)/i);
  if (!match) {
    throw new Error(`No user id in URL: ${url}`);
  }
  return match[1];
}
