import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Locators and helpers for the Builders pages.
 *
 * TWO routes, both PUBLIC (server-rendered, no auth gate, no loading skeleton):
 *
 *  /builders — the directory. h1 "Builders" with a summary line
 *  "N verified · N listed". One card per builder, sorted alphabetically; each
 *  card shows a monogram (initials) or a logo image, the builder name, an
 *  "N projects" count, and links to /b/<uuid>. The page has no search, filters,
 *  buttons, inputs, or selects.
 *
 *  /b/<uuid> — a single builder. Header = logo image or a monogram fallback, the
 *  builder name (h1), an OPTIONAL "Verified" badge, an OPTIONAL tagline, and an
 *  OPTIONAL Website link (target=_blank). Below the header: a 3-up stats row
 *  (Years in business / Active projects / Delivered), then a "Projects by
 *  <name>" section of project cards (status badge, name, locality, price) each
 *  linking to /p/<uuid> and carrying an "Add to compare" button.
 *
 * LIVE-APP STATE (verified 2026-08-26): 8 seeded builders. 5 show the Verified
 * badge (Elite Homes, PrimeBuild Infra, Shiv Developers, Skyline Group,
 * UrbanEdge Realty); 3 do not (Acme Realty, Happy Homes, Vertex Commercial
 * Spaces). The Website link is present on all but Acme Realty; taglines are
 * optional (Acme Realty and Happy Homes have none). The "N projects" count on
 * the listing equals the number of project cards in the detail section, but NOT
 * necessarily the "Active projects" stat (Shiv Developers lists 4 projects with
 * Active 1 + Delivered 3; Happy Homes lists 2 with Active 1 + Delivered 0), so
 * tests keep the two independent.
 */

/** Navigate to and await the /builders listing. */
export async function openBuilders(page: Page) {
  await page.goto("/builders");
  await expect(page).toHaveURL(/\/builders$/);
  await expect(buildersHeading(page)).toBeVisible();
}

/** The "Builders" h1. */
export function buildersHeading(page: Page) {
  return page.getByRole("heading", { name: "Builders" });
}

/** Summary line under the heading, e.g. "5 verified · 8 listed". */
export function buildersSubtitle(page: Page) {
  return page.getByText(/^\d+ verified · \d+ listed$/);
}

/** Every builder card — a link to /b/<uuid>. */
export function builderCards(page: Page) {
  return page.locator('main a[href^="/b/"]');
}

/** The card for one builder (matched by name). */
export function builderCardByName(page: Page, name: string) {
  return builderCards(page).filter({ hasText: name }).first();
}

/** The builder name inside a card, e.g. "Acme Realty". */
export function builderName(card: ReturnType<typeof builderCards>) {
  return card.locator("div.truncate.font-semibold");
}

/** The "N projects" count line inside a card. */
export function builderCardProjectCount(card: ReturnType<typeof builderCards>) {
  return card.locator("div.text-xs");
}

/** The monogram (initials) circle inside a card — empty when a logo image shows. */
export function builderCardMonogram(card: ReturnType<typeof builderCards>) {
  return card.locator("div.size-14");
}

/** The logo image inside a card — absent when a monogram shows. */
export function builderCardLogo(card: ReturnType<typeof builderCards>) {
  return card.locator("img");
}

/** Open a specific builder from the /builders listing and await its detail page. */
export async function openBuilder(page: Page, name: string) {
  await openBuilders(page);
  await builderCardByName(page, name).click();
  await expect(page).toHaveURL(/\/b\//);
  await expect(builderH1(page)).toHaveText(name);
}

/* ----- Builder detail page (/b/<uuid>) ----- */

/** The builder name as the page h1. */
export function builderH1(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

/** The builder logo image in the header (alt ends with " logo"). */
export function builderLogo(page: Page) {
  return page.locator('main img[alt*="logo"]');
}

/** The monogram fallback in the header — contains initials when no logo shows. */
export function builderMonogram(page: Page) {
  return page.locator("main div.size-24");
}

/** The "Verified" badge — present only on verified builders. */
export function verifiedBadge(page: Page) {
  return page.getByText("Verified", { exact: true });
}

/** The builder's one-line tagline / description (optional). */
export function builderTagline(page: Page) {
  return page.locator("main section p.text-sm.text-muted-foreground").first();
}

/** The Website link in the header (optional; opens in a new tab). */
export function websiteLink(page: Page) {
  return page.locator('main a[href^="http"]');
}

/** A stats-row label, e.g. "Years in business". */
export function statLabel(page: Page, label: string) {
  return page.getByText(label, { exact: true });
}

/** The numeric value of a stats-row card (the div after the label). */
export function statValue(page: Page, label: string) {
  return statLabel(page, label).locator("xpath=following-sibling::div[1]");
}

/** The "Projects by <name>" section heading. */
export function projectsHeading(page: Page) {
  return page.getByRole("heading", { name: /^Projects by / });
}

/** Every project card on the builder detail page. */
export function builderProjectCards(page: Page) {
  return page.locator('main a[href^="/p/"]');
}

/** The status badge on a project card (Ready to Move / Under Construction / …). */
export function cardStatusBadge(card: ReturnType<typeof builderProjectCards>) {
  return card.locator("span.rounded-full");
}

/** The locality line on a project card, e.g. "Andheri West, Mumbai". */
export function cardLocality(card: ReturnType<typeof builderProjectCards>) {
  return card.getByText(/,\s*(Mumbai|Ahmedabad|Surat)/).first();
}

/** The price line on a project card ("₹…" or "Price on request"). */
export function cardPrice(card: ReturnType<typeof builderProjectCards>) {
  return card.getByText(/₹|Price on request/).first();
}
