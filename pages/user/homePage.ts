import { expect, type Page } from "@playwright/test";

export function banner(page: Page) {
  return page.getByRole("banner");
}

export function logoLink(page: Page) {
  return banner(page).locator('a[href="/"]');
}

export function cityButton(page: Page) {
  return banner(page).getByRole("button", {
    name: /All India|All cities|Ahmedabad|Mumbai|Surat/,
  });
}

export function cityListbox(page: Page) {
  return page.getByRole("listbox");
}

export function headerNav(page: Page) {
  return banner(page).getByRole("navigation");
}

export function headerSearchLink(page: Page) {
  return banner(page).getByRole("link", { name: "Search", exact: true });
}

export function headerNotificationsLink(page: Page) {
  return banner(page).getByRole("link", { name: "Notifications" });
}

export function headerShortlistLink(page: Page) {
  return banner(page).getByRole("link", { name: "Shortlist" });
}

export function headerProfileLink(page: Page) {
  return banner(page).locator('a[href="/profile"]');
}

export function heroHeading(page: Page) {
  return page.getByRole("heading", { name: "Discover your next home, verified." });
}

export function browseProjectsLink(page: Page) {
  return page.locator('a[href="/projects"]').filter({ hasText: "Browse projects" });
}

export function openMapViewLink(page: Page) {
  return page.locator('a[href="/map"]').filter({ hasText: "Open map view" });
}

export function featuredHeading(page: Page) {
  return page.getByRole("heading", { name: "Featured under construction" });
}

export function featuredSection(page: Page) {
  return featuredHeading(page).locator("xpath=ancestor::section[1]");
}

export function exploreHeading(page: Page) {
  return page.getByRole("heading", { name: "Explore projects" });
}

export function exploreSection(page: Page) {
  return exploreHeading(page).locator("xpath=ancestor::section[1]");
}

export function projectCards(page: Page) {
  return page.locator('a[href^="/p/"]');
}

export function projectCardByName(page: Page, name: string) {
  return projectCards(page).filter({
    has: page.getByRole("heading", { name, exact: true }),
  });
}

export function footer(page: Page) {
  return page.getByRole("contentinfo");
}

export function bottomNav(page: Page) {
  return page.getByRole("navigation", { name: "Primary" });
}

export async function expectHomepageLoaded(page: Page) {
  await expect(page).toHaveURL(/https?:\/\/[^/]+\/?$/);
  await expect(heroHeading(page)).toBeVisible();
  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
}

export async function expectNoBrokenValues(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\bundefined\b/);
  expect(text).not.toMatch(/\bNaN\b/);
  expect(text).not.toMatch(/(^|\s)null(\s|$)/i);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);
}
