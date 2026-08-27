import { expect, type Page } from "@playwright/test";
import { addToCompareButton, compareTray, projectCards } from "./projectListingPage";

/**
 * Locators and helpers for the PropCatch Compare page (/compare).
 *
 * The compare page is PUBLIC (no auth gate) and URL-driven: the selected
 * projects live entirely in the query string (/compare?p=<uuid>&p=<uuid>).
 * There is NO localStorage / server-side persistence — reloading the URL
 * keeps the comparison, but navigating away to a fresh /compare resets it.
 * A maximum of 3 projects can be compared.
 *
 * Verified 2026-08-19 against the live app.
 */

/** Select `count` projects on /projects and open the compare page via the tray. */
export async function openCompareWithSelection(page: Page, count: number) {
  await page.goto("/projects");
  const cards = projectCards(page);
  for (let i = 0; i < count; i++) {
    await addToCompareButton(cards.nth(i)).click();
  }
  await compareTray(page).click();
  await expect(page).toHaveURL(/\/compare\?p=/, { timeout: 15_000 });
}

/** The "N of 3 slots used" subtitle on the compare page. */
export function slotsLabel(page: Page) {
  return page.getByText(/\d+ of 3 slots used/);
}

/** The "Compare" page heading (shown when at least one project is selected). */
export function compareHeading(page: Page) {
  return page.getByRole("heading", { name: "Compare", exact: true });
}

/** The "Compare projects" heading shown on the empty state (/compare). */
export function emptyStateHeading(page: Page) {
  return page.getByRole("heading", { name: "Compare projects" });
}

/** "Browse projects" link on the empty state. */
export function browseProjectsLink(page: Page) {
  return page.getByRole("link", { name: "Browse projects" });
}

/** The comparison <table>. */
export function compareTable(page: Page) {
  return page.getByRole("table");
}

/** Per-project remove control on the compare page (present but NON-FUNCTIONAL). */
export function removeFromCompareButton(page: Page, name: string) {
  return page.getByRole("button", { name: `Remove ${name} from compare` });
}

/** Project name link inside the compare page's header column. */
export function compareProjectNameLink(page: Page, name: string) {
  return compareTable(page).getByRole("link", { name });
}

/** Row labels rendered in the comparison table. */
export const COMPARE_FIELDS = [
  "Status",
  "Location",
  "Builder",
  "Price",
  "Configuration",
  "Area range",
  "Possession",
  "RERA",
  "Total units",
];
