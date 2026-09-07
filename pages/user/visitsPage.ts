import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";

/**
 * Locators and helpers for the PropCatch Site Visits page (/visits).
 *
 * /visits is AUTH-GATED: hitting it while signed out redirects to
 * /login?next=%2Fvisits. It is reached from the Profile overview ("Site Visits",
 * subtitle "Upcoming + past bookings").
 *
 * The page is READ-ONLY. It renders an "Upcoming" section only while the signed-in
 * user has future-dated visits, and always a "Past" section listing every recorded
 * visit. Each visit card shows the project name, a date/time line, the project
 * locality, and a status badge; the whole card is a link to that project's
 * details page.
 *
 * LIVE-APP STATE (verified 2026-08-25): the seeded account currently has no
 * future-dated visits, so the "Upcoming" section is not rendered and cannot be
 * asserted. Status values in seed data include both styled ("Scheduled",
 * "Completed", "Confirmed") and raw/unstyled ("no_show") values, so tests assert
 * the badge is non-empty, never a fixed set. The empty state ("no visits yet") is
 * not reachable with the seeded account (signup is rate-limited), so it is not
 * covered here either. There are no buttons, inputs, or selects on the page.
 */

/** The "Site Visits" h1. */
export function visitsHeading(page: Page) {
  return page.getByRole("heading", { name: "Site Visits", exact: true });
}

/** Subtitle under the heading. */
export function visitsSubtitle(page: Page) {
  return page.getByText("Upcoming + past bookings.", { exact: true });
}

/** The "Upcoming" section heading (uppercased by CSS). Only rendered when the user has future-dated visits. */
export function upcomingSectionHeading(page: Page) {
  return page.getByRole("heading", { name: "Upcoming" });
}

/** The "Past" section heading (uppercased by CSS). */
export function pastSectionHeading(page: Page) {
  return page.getByRole("heading", { name: "Past" });
}

/** Visit cards whose project name matches. */
export function visitCardByProject(page: Page, project: string) {
  return visitCards(page).filter({ hasText: project });
}

/** Every visit card (a list item whose only child is the project link). */
export function visitCards(page: Page) {
  return page.locator("main ul li");
}

/** The project link that makes up the whole card. */
export function visitLink(card: ReturnType<typeof visitCards>) {
  return card.locator("a").first();
}

/** The project name, e.g. "Prime Habitat". */
export function visitProjectName(card: ReturnType<typeof visitCards>) {
  return card.locator("div.truncate.font-semibold");
}

/** The date/time line, e.g. "Aug 20, 2026, 3:30 AM". */
export function visitDateLine(card: ReturnType<typeof visitCards>) {
  return card.locator("div.mt-1 span").first();
}

/** The project locality, e.g. "Prahlad Nagar". */
export function visitLocality(card: ReturnType<typeof visitCards>) {
  return card.locator("div.mt-1 span").nth(1);
}

/** The status badge (e.g. "Scheduled", "Completed", "no_show"). */
export function visitStatusBadge(card: ReturnType<typeof visitCards>) {
  return card.locator("span.rounded-full");
}

/** Sign in and open the Site Visits page. */
export async function openVisits(page: Page) {
  await loginAsUser(page);
  await page.goto("/visits");
  await expect(page).toHaveURL(/\/visits$/);
  await expect(visitsHeading(page)).toBeVisible();
}
