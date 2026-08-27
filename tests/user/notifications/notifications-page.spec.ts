import { test, expect } from "@playwright/test";
import {
  dateGroups,
  notificationItems,
  notificationsHeading,
  notificationsSubtitle,
  openNotifications,
} from "../../../pages/user/notificationsPage";

/**
 * Notifications — page content (/notifications).
 *
 * The page is a read-only, date-grouped list of "New match" notifications.
 * Each notification is a link to the referenced project's details page.
 * There are no mark-read / delete / clear / pagination controls.
 */
test.describe("Notifications - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("NOTIF-005 - the page shows its heading and subtitle", async ({
    page,
  }) => {
    await openNotifications(page);

    await expect(notificationsHeading(page)).toBeVisible();
    await expect(notificationsSubtitle(page)).toBeVisible();
  });

  test("NOTIF-006 - notifications are grouped by date", async ({ page }) => {
    await openNotifications(page);

    const groups = dateGroups(page);
    await expect(groups.first()).toBeVisible();

    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      // Each group is headed by a date label, e.g. "Aug 12, 2026".
      await expect(groups.nth(i)).toHaveText(/^[A-Za-z]{3} \d{1,2}, \d{4}$/);
    }
  });

  test("NOTIF-007 - each notification shows a title and body", async ({
    page,
  }) => {
    await openNotifications(page);

    const items = notificationItems(page);
    await expect(items.first()).toBeVisible();

    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText(/New match:/);
      await expect(items.nth(i)).toContainText(/matching your saved search/);
    }
  });

  test("NOTIF-008 - a notification links to the referenced project's details page", async ({
    page,
  }) => {
    await openNotifications(page);

    const first = notificationItems(page).first();
    const text = await first.innerText();
    const match = text.match(/New match:\s*(.+)/);
    expect(
      match,
      "notification should have a 'New match: <Project>' title",
    ).toBeTruthy();
    const projectName = match![1].trim();

    await first.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      projectName,
    );
  });

  test("NOTIF-009 - the notifications list is read-only (no action controls)", async ({
    page,
  }) => {
    await openNotifications(page);

    // No mark-as-read / delete / clear buttons anywhere on the page.
    await expect(page.locator("main button")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /mark|delete|clear/i }),
    ).toHaveCount(0);
  });
});
