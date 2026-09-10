import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Locators and helpers for the PropCatch Project Listing (/projects) page.
 * All locators are based on the actual live UI (stable roles / text / hrefs).
 */

export function projectsHeading(page: Page) {
  return page.getByRole("heading", { name: "Projects" });
}

/** "N of TOTAL match your filters" summary line. */
export function countLabel(page: Page) {
  return page.getByText(/\d+ of \d+ match your filters/);
}

export function searchInput(page: Page) {
  return page.getByPlaceholder(/Search project, locality, builder/);
}

export function filtersButton(page: Page) {
  return page.getByRole("button", { name: "Filters", exact: true });
}

export function mapViewLink(page: Page) {
  return page
    .locator("main")
    .getByRole("link", { name: /Map view/i })
    .or(page.locator('main a[href="/map"]'));
}

/** City chips in the listing toolbar (All / Ahmedabad / Mumbai / Surat). */
export function cityChip(page: Page, city: string) {
  return page.getByRole("button", { name: city, exact: true }).first();
}

/** STATUS chip inside the filters panel. */
export function statusChip(page: Page, status: string) {
  return page.getByRole("button", { name: status, exact: true }).first();
}

/** CONFIGURATION chip inside the filters panel. */
export function configChip(page: Page, config: string) {
  return page.getByRole("button", { name: config, exact: true }).first();
}

export function clearAllFiltersButton(page: Page) {
  return page.getByRole("button", { name: "Clear all filters" });
}

export function saveThisSearchButton(page: Page) {
  return page.getByRole("button", { name: "Save this search" });
}

/** Section labels shown once the filters panel is open. */
export function filtersPanel(page: Page) {
  return page.locator("main").getByText("STATUS", { exact: true });
}

export function emptyStateMessage(page: Page) {
  return page.getByText("No projects match your filters.");
}

/** Project card links, e.g. <a href="/p/<uuid>">. */
export function projectCards(page: Page) {
  return page.locator('a[href^="/p/"]');
}

export function projectCardByName(page: Page, name: string) {
  return projectCards(page).filter({
    has: page.getByRole("heading", { name, exact: true }),
  });
}

export function cardName(card: Locator) {
  return card.getByRole("heading", { level: 3 });
}

export function addToCompareButton(card: Locator) {
  return card.locator('button[aria-label="Add to compare"]');
}

export function removeFromCompareButton(card: Locator) {
  return card.locator('button[aria-label="Remove from compare"]');
}

/** Fixed bottom tray, e.g. "Compare 2 projects →". */
export function compareTray(page: Page) {
  return page.getByRole("link", { name: /Compare \d+ projects? →/ });
}

export function headerCityButton(page: Page) {
  return page.getByRole("button", { name: "All India" });
}

/** Read the "N of TOTAL match your filters" numbers. */
export async function readCountFromLabel(page: Page): Promise<{
  shown: number;
  total: number;
}> {
  const text = await countLabel(page).innerText();
  const m = text.match(/(\d+) of (\d+)/);
  if (!m) return { shown: -1, total: -1 };
  return { shown: Number(m[1]), total: Number(m[2]) };
}

/** Assert that the rendered card count equals the number shown in the label. */
export async function expectCardCountMatchesLabel(page: Page) {
  const { shown } = await readCountFromLabel(page);
  await expect(projectCards(page)).toHaveCount(shown);
}

/** Wait until the listing shows every project (shown === total). */
export async function expectFullListing(page: Page, total?: number) {
  await expect(countLabel(page)).toBeVisible();
  const expectedTotal = total ?? (await readCountFromLabel(page)).total;
  expect(expectedTotal).toBeGreaterThan(0);
  await expect(countLabel(page)).toHaveText(
    new RegExp(`${expectedTotal} of ${expectedTotal} match your filters`),
  );
  await expect(projectCards(page)).toHaveCount(expectedTotal);
}

/** Wait until the visible result count is `shown` of the known inventory total. */
export async function expectShownOfTotal(page: Page, shown: number, total: number) {
  await expect(countLabel(page)).toHaveText(
    new RegExp(`${shown} of ${total} match your filters`),
  );
  await expect(projectCards(page)).toHaveCount(shown);
}
