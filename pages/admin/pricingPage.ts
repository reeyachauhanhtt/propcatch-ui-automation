import { expect, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Pricing helpers for https://propcatch-admin.vercel.app/pricing
 *
 * Verified 2026-09-03 against the live Admin portal:
 * - List: search (#filter-q) + filters (project, min/max price, min/max
 *   price-per-sqft) + table (From / To / Scope / Project / Price / ₹/sqft) +
 *   pagination. No "Apply" button — filters auto-apply via URL query params.
 *   Query keys (camelCase): q, project, minPrice, maxPrice, minPricePerSqft,
 *   maxPricePerSqft. Project/price apply on change; price-per-sqft applies on
 *   blur. Reset is a <button> (not a link) that returns to the unfiltered list.
 * - Create: /pricing/new — Project * / Price * / Effective from * required;
 *   Unit (optional), Price / sqft, Effective to optional. The unit select is a
 *   flat list of unit numbers, NOT re-scoped by the selected project.
 * - Pricing history is append-only: entries cannot be edited or deleted through
 *   the portal (the create form states this explicitly). List rows link to
 *   /projects/:id or /units/:id — there is no /pricing/:id detail page.
 *
 * Unlike units/projects/builders, created price records are permanent — there
 * is no soft-delete. Any test that submits "Record price" writes a real row.
 */

export const QA_PRICING_PROJECT = "Montessa Heights";

export function main(page: Page) {
  return page.getByRole("main");
}

export function pricingHeading(page: Page) {
  return page.getByRole("heading", { name: "Pricing", exact: true });
}

export function pricingSubtitle(page: Page) {
  return main(page).getByText(
    "Append-only price history across projects and units.",
  );
}

export function recordPriceLink(page: Page) {
  return main(page).getByRole("link", { name: "+ Record price", exact: true });
}

export function pricingTable(page: Page) {
  return main(page).getByRole("table");
}

export function pricingRows(page: Page) {
  return pricingTable(page).locator("tbody tr");
}

/** Empty-state message shown when no rows match the current filter/search. */
export function pricingEmptyState(page: Page) {
  return main(page).getByText("No price history").first();
}

export function previousPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Previous", exact: true });
}

export function nextPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Next", exact: true });
}

/* ---- List filters ---- */

export function searchInput(page: Page) {
  return page.locator("#filter-q");
}

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function filterMinPriceInput(page: Page) {
  return page.locator("#filter-min-price");
}

export function filterMaxPriceInput(page: Page) {
  return page.locator("#filter-max-price");
}

export function filterMinPricePerSqftInput(page: Page) {
  return page.locator("#filter-min-price-per-sqft");
}

export function filterMaxPricePerSqftInput(page: Page) {
  return page.locator("#filter-max-price-per-sqft");
}

export function resetFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Reset", exact: true });
}

/* ---- Create form ---- */

export function recordPriceHeading(page: Page) {
  return page.getByRole("heading", { name: "Record price", exact: true });
}

export function projectSelect(page: Page) {
  return page.locator("#project_id");
}

export function unitSelect(page: Page) {
  return page.locator("#unit_id");
}

export function priceInput(page: Page) {
  return page.locator("#price");
}

export function pricePerSqftInput(page: Page) {
  return page.locator("#price_per_sqft");
}

export function effectiveFromInput(page: Page) {
  return page.locator("#effective_from");
}

export function effectiveToInput(page: Page) {
  return page.locator("#effective_to");
}

export function recordPriceButton(page: Page) {
  return page.getByRole("button", { name: "Record price", exact: true });
}

export function cancelLink(page: Page) {
  return main(page).getByRole("link", { name: "Cancel", exact: true }).first();
}

export function formErrorBanner(page: Page) {
  return main(page).getByText("Please correct the highlighted fields.");
}

export function appendOnlyNotice(page: Page) {
  return main(page).getByText(
    "Price history is append-only — entries cannot be edited or deleted through the portal.",
  );
}

/* ---- Navigation helpers ---- */

export async function openPricing(page: Page) {
  await page.goto("/pricing");
  await expectPricingListLoaded(page);
}

export async function expectPricingListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/pricing\/?(\?.*)?$/);
  await expect(pricingHeading(page)).toBeVisible();
  await expect(pricingSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function openNewPricing(page: Page) {
  await page.goto("/pricing/new");
  await expect(page).toHaveURL(/\/pricing\/new/);
  await expect(recordPriceHeading(page)).toBeVisible();
}

/** Search auto-applies on typing (debounced) → ?q=<query>. */
export async function searchPricing(page: Page, query: string) {
  await searchInput(page).fill(query);
  await expect(page).toHaveURL(/[?&]q=/, { timeout: 15_000 });
  await expect(pricingHeading(page)).toBeVisible();
}

/**
 * Applies list filters. Price filters apply on change; price-per-sqft filters
 * apply on blur (so they are explicitly blurred). Waits for each query param.
 */
export async function applyPricingFilters(
  page: Page,
  filters: {
    project?: string;
    minPrice?: string;
    maxPrice?: string;
    minPricePerSqft?: string;
    maxPricePerSqft?: string;
  },
) {
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
    await expect(page).toHaveURL(/[?&]project=/, { timeout: 15_000 });
  }
  if (filters.minPrice !== undefined) {
    await filterMinPriceInput(page).fill(filters.minPrice);
    await expect(page).toHaveURL(/[?&]minPrice=/, { timeout: 15_000 });
  }
  if (filters.maxPrice !== undefined) {
    await filterMaxPriceInput(page).fill(filters.maxPrice);
    await expect(page).toHaveURL(/[?&]maxPrice=/, { timeout: 15_000 });
  }
  if (filters.minPricePerSqft !== undefined) {
    const input = filterMinPricePerSqftInput(page);
    await input.fill(filters.minPricePerSqft);
    await input.blur();
    await expect(page).toHaveURL(/[?&]minPricePerSqft=/, { timeout: 15_000 });
  }
  if (filters.maxPricePerSqft !== undefined) {
    const input = filterMaxPricePerSqftInput(page);
    await input.fill(filters.maxPricePerSqft);
    await input.blur();
    await expect(page).toHaveURL(/[?&]maxPricePerSqft=/, { timeout: 15_000 });
  }
  await expect(pricingHeading(page)).toBeVisible();
}

/** Reset returns to the unfiltered list (no query params). */
export async function resetPricingFilters(page: Page) {
  await resetFiltersButton(page).click();
  await expect(page).toHaveURL(/\/pricing\/?$/, { timeout: 15_000 });
  await expectPricingListLoaded(page);
}

/* ---- Row collection ---- */

/** Project name for each visible row (skips empty-state rows). */
export async function collectPricingProjects(page: Page) {
  const rows = pricingRows(page);
  const count = await rows.count();
  const projects: string[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const projectLink = row.locator('a[href*="/projects/"]').first();
    if ((await projectLink.count()) === 0) {
      continue;
    }
    projects.push((await projectLink.innerText()).trim());
  }

  return projects;
}

/** Parsed numeric "Price" column values for each visible row (skips empty rows). */
export async function collectPricingPrices(page: Page) {
  const rows = pricingRows(page);
  const count = await rows.count();
  const prices: number[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    // Price is the 5th cell (index 4): From, To, Scope, Project, Price, ₹/sqft
    const cell = row.locator("td").nth(4);
    if ((await cell.count()) === 0) {
      continue;
    }
    const raw = (await cell.innerText()).trim();
    const parsed = Number(raw.replace(/,/g, ""));
    if (!Number.isNaN(parsed)) {
      prices.push(parsed);
    }
  }

  return prices;
}

/** Parsed numeric "₹/sqft" column values (skips "—" and empty rows). */
export async function collectPricingPricePerSqft(page: Page) {
  const rows = pricingRows(page);
  const count = await rows.count();
  const values: number[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const cell = row.locator("td").nth(5);
    if ((await cell.count()) === 0) {
      continue;
    }
    const raw = (await cell.innerText()).trim();
    if (!raw || raw === "—") {
      continue;
    }
    const parsed = Number(raw.replace(/,/g, ""));
    if (!Number.isNaN(parsed)) {
      values.push(parsed);
    }
  }

  return values;
}

/* ---- Create form helpers ---- */

export async function fillPricingForm(
  page: Page,
  data: {
    project?: string;
    unit?: string;
    price: string;
    pricePerSqft?: string;
    effectiveFrom: string;
    effectiveTo?: string;
  },
) {
  if (data.project !== undefined) {
    await projectSelect(page).selectOption({ label: data.project });
  }
  if (data.unit !== undefined) {
    // The unit list is scoped to the selected project and populated async.
    await expect(
      unitSelect(page).locator("option", { hasText: data.unit }),
    ).toBeAttached({ timeout: 10_000 });
    await unitSelect(page).selectOption({ label: data.unit });
  }
  await priceInput(page).fill(data.price);
  if (data.pricePerSqft !== undefined) {
    await pricePerSqftInput(page).fill(data.pricePerSqft);
  }
  await effectiveFromInput(page).fill(data.effectiveFrom);
  if (data.effectiveTo !== undefined) {
    await effectiveToInput(page).fill(data.effectiveTo);
  }
}

/**
 * Submits a "Record price" entry. Project-level records redirect to
 * /pricing?project=<id> and unit-level records to /pricing?unit=<id>.
 * Writes a permanent append-only row (no cleanup available).
 */
export async function recordPrice(
  page: Page,
  data: {
    project: string;
    unit?: string;
    price: string;
    pricePerSqft?: string;
    effectiveFrom: string;
    effectiveTo?: string;
  },
) {
  await openNewPricing(page);
  await fillPricingForm(page, data);
  await recordPriceButton(page).click();
  if (data.unit !== undefined) {
    await expect(page).toHaveURL(/\/pricing\?unit=/, { timeout: 20_000 });
  } else {
    await expect(page).toHaveURL(/\/pricing\?project=/, { timeout: 20_000 });
  }
  await expect(pricingHeading(page)).toBeVisible();
}

/** Unique numeric price used to identify QA-created records in the list. */
export function uniqueQaPrice() {
  return 1_700_000_000 + (Date.now() % 100_000_000);
}

export function formatPrice(value: number) {
  return value.toLocaleString("en-US");
}
