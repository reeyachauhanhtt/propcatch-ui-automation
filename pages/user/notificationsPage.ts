import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";

/**
 * Locators and helpers for the PropCatch Notifications page (/notifications).
 *
 * Notifications are AUTH-GATED: the header icon is hidden from anonymous
 * users, and hitting /notifications while signed out redirects to
 * /login?next=%2Fnotifications. The page itself is a READ-ONLY, date-grouped
 * list of links to projects — there are no mark-read / delete / clear /
 * pagination controls.
 *
 * Verified 2026-08-19 against the live app.
 */

/** Sign in and open the Notifications page. */
export async function openNotifications(page: Page) {
  await loginAsUser(page);
  await page.goto("/notifications");
  await expect(
    page.getByRole("heading", { name: "Notifications", exact: true }),
  ).toBeVisible();
}

/** The "Notifications" h1. */
export function notificationsHeading(page: Page) {
  return page.getByRole("heading", { name: "Notifications", exact: true });
}

/** Subtitle under the heading. */
export function notificationsSubtitle(page: Page) {
  return page.getByText("Enquiry updates, saved-search matches, messages.");
}

/** Date-group headings, e.g. "Aug 12, 2026". */
export function dateGroups(page: Page) {
  return page.locator("main h2");
}

/** Each notification is a link to the referenced project's details page. */
export function notificationItems(page: Page) {
  return page.locator('main a[href^="/p/"]');
}
