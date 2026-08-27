import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";

/**
 * Locators and helpers for the PropCatch Saved Searches page (/saved-searches).
 *
 * /saved-searches is AUTH-GATED: hitting it while signed out redirects to
 * /login?next=%2Fsaved-searches. It is reached from the Profile overview and
 * the footer.
 *
 * The page lists the signed-in user's saved searches. Each card shows a name
 * (derived from the filter, e.g. "2bhk"), a criteria line (e.g. "2 BHK" or
 * "Ready to Move · Penthouse"), a "Notify on new matches" toggle, and a Delete
 * button. Cards are plain list items — they do NOT link anywhere.
 *
 * LIVE-APP STATE (verified 2026-08-21): the "Notify on new matches" toggle
 * WORKS (POSTs /saved-searches and persists). The "Save this search" action on
 * /projects and the per-card Delete button are currently NO-OPS in the live
 * app — they are rendered but fire no request and change nothing — so this
 * module only asserts their presence, not their behaviour.
 */

/** The "Saved Searches" h1. */
export function savedSearchesHeading(page: Page) {
  return page.getByRole("heading", { name: "Saved Searches", exact: true });
}

/** Subtitle under the heading. */
export function savedSearchesSubtitle(page: Page) {
  return page.getByText("Get notified when new projects match your criteria.");
}

/** Every saved-search card (a plain list item, not a link). */
export function savedSearchCards(page: Page) {
  return page.locator("main ul li");
}

/** The search name, e.g. "2bhk". */
export function savedSearchName(card: ReturnType<typeof savedSearchCards>) {
  return card.locator("div.truncate.font-semibold");
}

/** The criteria line, e.g. "2 BHK" / "Ready to Move · Penthouse". */
export function savedSearchCriteria(card: ReturnType<typeof savedSearchCards>) {
  return card.locator("div.mt-1.text-xs");
}

/** The "Notify on new matches" checkbox toggle. */
export function savedSearchNotifyToggle(card: ReturnType<typeof savedSearchCards>) {
  return card.locator('input[type="checkbox"]');
}

/** The label wrapping the toggle (clicking it flips the checkbox). */
export function savedSearchNotifyLabel(card: ReturnType<typeof savedSearchCards>) {
  return card.locator("label");
}

/** The "Delete" icon button. */
export function savedSearchDeleteButton(card: ReturnType<typeof savedSearchCards>) {
  return card.getByRole("button", { name: "Delete" });
}

/** Sign in and open the Saved Searches page. */
export async function openSavedSearches(page: Page) {
  await loginAsUser(page);
  await page.goto("/saved-searches");
  await expect(page).toHaveURL(/\/saved-searches$/);
  await expect(savedSearchesHeading(page)).toBeVisible();
}
