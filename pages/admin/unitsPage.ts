import { expect, type Page } from "@playwright/test";
import {
  deleteFirstMediaInSlot,
  expectMediaUploaded,
  mediaSection,
  QA_PROJECT_FLOOR_PLAN,
  QA_PROJECT_GALLERY,
  uploadMediaFile,
} from "./mediaPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Units helpers for https://propcatch-admin.vercel.app/units
 *
 * Verified 2026-08-26 against the live Admin portal:
 * - List: filters (Project, Availability, Config, Base price, Carpet) + table + pagination
 * - Create: /units/new — Project / Unit number / Configuration required
 *   Availability is OPTIONAL and defaults to "available" when omitted
 *   Configuration, availability, and facing use datalist suggestions
 * - Successful create lands on /units/:id (detail)
 * - Save changes redirects to detail; soft-delete dialog "Yes, delete" → /units
 * - Soft-deleted detail shows Restore + SOFT-DELETED (no Delete)
 * - Detail media slots: unit.floor_plan, unit.photo
 *
 * Disposable unit numbers must use the QA Autotest prefix and be soft-deleted after use.
 * Link new units to an existing seeded project (select only — do not edit projects).
 */

export const QA_UNIT_PREFIX = "QA Autotest";

/** Seeded project used only as a foreign key when creating QA units. */
export const QA_UNIT_PROJECT = "Montessa Heights";

export const CONFIGURATION_OPTIONS = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "3 BHK Villa",
  "4 BHK",
  "4 BHK Villa",
] as const;

export const UNIT_MEDIA = {
  floorPlan: {
    slot: "unit.floor_plan",
    file: QA_PROJECT_FLOOR_PLAN,
    fileName: "qa-project-floor-plan.png",
  },
  photo: {
    slot: "unit.photo",
    file: QA_PROJECT_GALLERY,
    fileName: "qa-project-gallery.png",
  },
} as const;

export const AVAILABILITY_OPTIONS = [
  "available",
  "booked",
  "sold",
  "blocked",
  "hold",
  "resale",
  "rented",
  "not_released",
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function unitsHeading(page: Page) {
  return page.getByRole("heading", { name: "Units", exact: true });
}

export function unitsSubtitle(page: Page) {
  return main(page).getByText("Inventory across all projects.");
}

export function newUnitLink(page: Page) {
  return main(page).getByRole("link", { name: "+ New unit", exact: true });
}

export function unitsTable(page: Page) {
  return main(page).getByRole("table");
}

export function unitRows(page: Page) {
  return unitsTable(page).locator("tbody tr");
}

export function unitNumberLink(page: Page, unitNumber: string | RegExp) {
  return main(page).getByRole("link", {
    name: unitNumber,
    exact: typeof unitNumber === "string",
  });
}

export function previousPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Previous", exact: true });
}

export function nextPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Next", exact: true });
}

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function filterStatusSelect(page: Page) {
  return page.locator("#filter-status");
}

export function filterConfigInput(page: Page) {
  return page.locator("#filter-config");
}

export function filterMinPriceInput(page: Page) {
  return page.locator("#filter-min-price");
}

export function filterMaxPriceInput(page: Page) {
  return page.locator("#filter-max-price");
}

export function filterMinCarpetInput(page: Page) {
  return page.locator("#filter-min-carpet");
}

export function filterMaxCarpetInput(page: Page) {
  return page.locator("#filter-max-carpet");
}

export function applyFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Apply", exact: true });
}

export function resetFiltersLink(page: Page) {
  return main(page).getByRole("link", { name: "Reset", exact: true });
}

export function newUnitHeading(page: Page) {
  return page.getByRole("heading", { name: "New unit", exact: true });
}

export function projectSelect(page: Page) {
  return page.locator("#project_id");
}

export function unitNumberInput(page: Page) {
  return page.locator("#unit_number");
}

export function configurationInput(page: Page) {
  return page.locator("#configuration");
}

export function availabilityStatusInput(page: Page) {
  return page.locator("#availability_status");
}

export function phaseSelect(page: Page) {
  return page.locator("#phase_id");
}

export function towerSelect(page: Page) {
  return page.locator("#tower_id");
}

export function floorNumberInput(page: Page) {
  return page.locator("#floor_number");
}

export function facingInput(page: Page) {
  return page.locator("#facing");
}

export function carpetAreaInput(page: Page) {
  return page.locator("#carpet_area");
}

export function builtUpAreaInput(page: Page) {
  return page.locator("#built_up_area");
}

export function superBuiltUpAreaInput(page: Page) {
  return page.locator("#super_built_up_area");
}

export function basePriceInput(page: Page) {
  return page.locator("#base_price");
}

export function createUnitButton(page: Page) {
  return page.getByRole("button", { name: /^Create unit$|^Saving/ });
}

export function saveChangesButton(page: Page) {
  return page.getByRole("button", { name: /^Save changes$|^Saving/ });
}

export function cancelLink(page: Page) {
  return main(page).getByRole("link", { name: "Cancel", exact: true }).first();
}

export function formErrorBanner(page: Page) {
  return main(page).getByText("Please correct the highlighted fields.");
}

export function requiredErrors(page: Page) {
  return main(page).getByText("Required", { exact: true });
}

export function editLink(page: Page) {
  return main(page).getByRole("link", { name: "Edit", exact: true });
}

export function deleteButton(page: Page) {
  return main(page).getByRole("button", { name: "Delete", exact: true }).first();
}

export function restoreButton(page: Page) {
  return main(page).getByRole("button", { name: "Restore", exact: true });
}

export function deleteDialog(page: Page) {
  return page.getByRole("dialog");
}

export function confirmDeleteButton(page: Page) {
  return deleteDialog(page).getByRole("button", {
    name: "Yes, delete",
    exact: true,
  });
}

export function cancelDeleteButton(page: Page) {
  return deleteDialog(page).getByRole("button", { name: "Cancel", exact: true });
}

export function uniqueQaUnitNumber(suffix?: string) {
  const stamp = Date.now();
  return suffix
    ? `${QA_UNIT_PREFIX} ${stamp} ${suffix}`
    : `${QA_UNIT_PREFIX} ${stamp}`;
}

export function unitIdFromUrl(url: string) {
  const match = url.match(/\/units\/([0-9a-f-]+)/i);
  if (!match) {
    throw new Error(`No unit id in URL: ${url}`);
  }
  return match[1];
}

export async function openUnits(page: Page) {
  await page.goto("/units");
  await expectUnitsListLoaded(page);
}

export async function expectUnitsListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/units\/?(\?.*)?$/);
  await expect(unitsHeading(page)).toBeVisible();
  await expect(unitsSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function openNewUnit(page: Page) {
  await page.goto("/units/new");
  await expect(page).toHaveURL(/\/units\/new/);
  await expect(newUnitHeading(page)).toBeVisible();
}

/** Unit numbers from the current list table (skips the empty-state row). */
export async function collectUnitNumbers(page: Page) {
  const rows = unitRows(page);
  const count = await rows.count();
  const numbers: string[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = (await row.innerText()).trim();
    if (/^No units/i.test(text)) {
      continue;
    }
    const link = row.getByRole("link").first();
    if ((await link.count()) === 0) {
      continue;
    }
    numbers.push((await link.innerText()).trim());
  }

  return numbers;
}

export async function expectFilteredRowsMatch(
  page: Page,
  expected: {
    project?: string;
    statusLabel?: string;
    configuration?: string;
  },
) {
  const rows = unitRows(page);
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = (await row.innerText()).trim();
    if (/^No units/i.test(text)) {
      continue;
    }
    if (expected.project) {
      await expect(
        row.getByRole("link", { name: expected.project }),
      ).toBeVisible();
    }
    if (expected.statusLabel) {
      await expect(
        row.getByText(expected.statusLabel, { exact: true }),
      ).toBeVisible();
    }
    if (expected.configuration) {
      await expect(
        row.getByText(expected.configuration, { exact: true }),
      ).toBeVisible();
    }
  }
}

export async function applyUnitFilters(
  page: Page,
  filters: {
    project?: string;
    status?: string;
    configuration?: string;
    minPrice?: string;
    maxPrice?: string;
    minCarpet?: string;
    maxCarpet?: string;
  },
) {
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
  }
  if (filters.status !== undefined) {
    await filterStatusSelect(page).selectOption({ value: filters.status });
  }
  if (filters.configuration !== undefined) {
    await filterConfigInput(page).fill(filters.configuration);
  }
  if (filters.minPrice !== undefined) {
    await filterMinPriceInput(page).fill(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    await filterMaxPriceInput(page).fill(filters.maxPrice);
  }
  if (filters.minCarpet !== undefined) {
    await filterMinCarpetInput(page).fill(filters.minCarpet);
  }
  if (filters.maxCarpet !== undefined) {
    await filterMaxCarpetInput(page).fill(filters.maxCarpet);
  }
  await applyFiltersButton(page).click();
  await expect(page).toHaveURL(/\/units\?/, { timeout: 15_000 });
  await expect(unitsHeading(page)).toBeVisible();
}

export async function fillUnitForm(
  page: Page,
  data: {
    project?: string;
    unitNumber: string;
    configuration?: string;
    availabilityStatus?: string;
    floorNumber?: string;
    facing?: string;
    carpetArea?: string;
    builtUpArea?: string;
    superBuiltUpArea?: string;
    basePrice?: string;
  },
) {
  if (data.project !== undefined) {
    await projectSelect(page).selectOption({ label: data.project });
  }
  await unitNumberInput(page).fill(data.unitNumber);
  if (data.configuration !== undefined) {
    await configurationInput(page).fill(data.configuration);
  }
  if (data.availabilityStatus !== undefined) {
    await availabilityStatusInput(page).fill(data.availabilityStatus);
  }
  if (data.floorNumber !== undefined) {
    await floorNumberInput(page).fill(data.floorNumber);
  }
  if (data.facing !== undefined) {
    await facingInput(page).fill(data.facing);
  }
  if (data.carpetArea !== undefined) {
    await carpetAreaInput(page).fill(data.carpetArea);
  }
  if (data.builtUpArea !== undefined) {
    await builtUpAreaInput(page).fill(data.builtUpArea);
  }
  if (data.superBuiltUpArea !== undefined) {
    await superBuiltUpAreaInput(page).fill(data.superBuiltUpArea);
  }
  if (data.basePrice !== undefined) {
    await basePriceInput(page).fill(data.basePrice);
  }
}

/**
 * Creates a unit. Live app redirects to /units/:id after create.
 */
export async function createUnit(
  page: Page,
  data: {
    unitNumber: string;
    project?: string;
    configuration?: string;
    availabilityStatus?: string;
    floorNumber?: string;
    facing?: string;
    carpetArea?: string;
    builtUpArea?: string;
    superBuiltUpArea?: string;
    basePrice?: string;
  },
) {
  await openNewUnit(page);
  await fillUnitForm(page, {
    project: QA_UNIT_PROJECT,
    configuration: "2 BHK",
    availabilityStatus: "available",
    floorNumber: "9",
    facing: "east",
    carpetArea: "950",
    basePrice: "1500000",
    ...data,
  });
  await page.getByRole("button", { name: "Create unit", exact: true }).click();
  await expect(page).toHaveURL(/\/units\/[0-9a-f-]+$/i, { timeout: 25_000 });
  await expect(
    page.getByRole("heading", {
      name: `Unit ${data.unitNumber}`,
      exact: true,
    }),
  ).toBeVisible();
}

export async function openUnitDetail(page: Page, unitId: string) {
  await page.goto(`/units/${unitId}`);
  await expect(page).toHaveURL(
    new RegExp(`/units/${unitId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
  );
  await expect(page.getByText("Units / Detail")).toBeVisible();
}

export async function openEditFromDetail(page: Page) {
  await editLink(page).click();
  await expect(page).toHaveURL(/\/units\/[0-9a-f-]+\/edit$/i);
  await expect(page.getByRole("heading", { name: /^Edit unit / })).toBeVisible();
}

/** Save on edit page — live app redirects to detail. */
export async function saveUnitChanges(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/units\/[0-9a-f-]+\/edit/i.test(response.url()),
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await responsePromise;
  await expect(page).toHaveURL(/\/units\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expect(page.getByText("Units / Detail")).toBeVisible();
}

export async function softDeleteUnit(page: Page) {
  await deleteButton(page).click();
  await expect(deleteDialog(page)).toBeVisible();
  await expect(deleteDialog(page).getByText("Delete unit?")).toBeVisible();
  await confirmDeleteButton(page).click();
  await expect(page).toHaveURL(/\/units\/?$/, { timeout: 20_000 });
  await expect(unitsHeading(page)).toBeVisible();
}

export async function expectUnitAbsentFromList(page: Page, unitNumber: string) {
  await openUnits(page);
  await expect(unitNumberLink(page, unitNumber)).toHaveCount(0);
}

export async function uploadUnitMedia(
  page: Page,
  kind: keyof typeof UNIT_MEDIA,
) {
  const media = UNIT_MEDIA[kind];
  await uploadMediaFile(page, media.slot, media.file);
  await expectMediaUploaded(page, media.slot, media.fileName);
}

export async function deleteUnitMedia(
  page: Page,
  kind: keyof typeof UNIT_MEDIA,
) {
  await deleteFirstMediaInSlot(page, UNIT_MEDIA[kind].slot);
}

export async function expectUnitMediaSlots(page: Page) {
  for (const media of Object.values(UNIT_MEDIA)) {
    await expect(mediaSection(page, media.slot)).toBeVisible();
  }
  await expect(page.getByText("Floor plan", { exact: true })).toBeVisible();
  await expect(page.getByText("Photos", { exact: true })).toBeVisible();
}

export async function cleanupQaUnitByNumber(page: Page, unitNumber: string) {
  await page.goto("/units");
  const link = unitNumberLink(page, unitNumber);
  if ((await link.count()) === 0) {
    return;
  }
  await link.click();
  await expect(page).toHaveURL(/\/units\/[0-9a-f-]+/i);
  if (page.url().includes("/edit")) {
    await openUnitDetail(page, unitIdFromUrl(page.url()));
  }
  if ((await deleteButton(page).count()) > 0) {
    await softDeleteUnit(page);
  }
}
