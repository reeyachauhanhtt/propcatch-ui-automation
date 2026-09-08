import { expect, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

export const QA_LOCALITY_PREFIX = "QA Autotest Locality";

export function main(page: Page) {
  return page.getByRole("main");
}

export function localitiesHeading(page: Page) {
  return page.getByRole("heading", { name: "Localities", exact: true });
}

export function localitiesModuleLabel(page: Page) {
  return main(page).getByText("Module 22 — Locality Management", {
    exact: true,
  });
}

export function localitiesSubtitle(page: Page) {
  return main(page).getByText(
    "Neighborhood-level master data. Localities anchor project addresses; adding one here makes it selectable in the project form.",
  );
}

export function filtersForm(page: Page) {
  return page.getByTestId("localities-filters");
}

export function filterCitySelect(page: Page) {
  return page.locator("#cityId");
}

export function filterNameInput(page: Page) {
  return page.locator("#q");
}

export function hideInactiveCheckbox(page: Page) {
  return filtersForm(page).locator('input[name="hideInactive"]');
}

export function applyFiltersButton(page: Page) {
  return filtersForm(page).getByRole("button", { name: "Apply", exact: true });
}

export function resetFiltersLink(page: Page) {
  return filtersForm(page).getByRole("link", { name: "Reset", exact: true });
}

export function createLocalityForm(page: Page) {
  return page.getByTestId("locality-create-form");
}

export function createCitySelect(page: Page) {
  return page.locator("#city_id");
}

export function localityNameInput(page: Page) {
  return page.locator("#name");
}

export function activeCheckbox(page: Page) {
  return createLocalityForm(page).locator('input[name="is_active"]');
}

export function addLocalityButton(page: Page) {
  return createLocalityForm(page).getByRole("button", {
    name: "Add locality",
    exact: true,
  });
}

export function localitiesSummary(page: Page) {
  return page.getByTestId("localities-summary");
}

export function localitiesTable(page: Page) {
  return page.getByTestId("localities-table");
}

export function localityRows(page: Page) {
  return localitiesTable(page).locator("tbody tr");
}

export function localityRowByName(page: Page, name: string) {
  return localityRows(page).filter({ hasText: name });
}

export function localityToggleButton(
  row: ReturnType<typeof localityRows>,
) {
  return row.locator('[data-testid^="locality-toggle-"]');
}

export function uniqueQaLocalityName() {
  return `${QA_LOCALITY_PREFIX} ${Date.now()}`;
}

export async function openLocalities(page: Page) {
  await page.goto("/localities");
  await expectLocalitiesListLoaded(page);
}

export async function expectLocalitiesListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/localities\/?(\?.*)?$/);
  await expect(localitiesHeading(page)).toBeVisible();
  await expect(localitiesSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function applyLocalityFilters(
  page: Page,
  filters: { city?: string; name?: string; hideInactive?: boolean },
) {
  if (filters.city !== undefined) {
    await filterCitySelect(page).selectOption({ label: filters.city });
  }
  if (filters.name !== undefined) {
    await filterNameInput(page).fill(filters.name);
  }
  if (filters.hideInactive !== undefined) {
    await hideInactiveCheckbox(page).setChecked(filters.hideInactive);
  }
  await applyFiltersButton(page).click();
  if (filters.city !== undefined) {
    await expect(page).toHaveURL(/[?&]cityId=/);
  }
  if (filters.name !== undefined) {
    await expect(page).toHaveURL(/[?&]q=/);
  }
  if (filters.hideInactive) {
    await expect(page).toHaveURL(/[?&]hideInactive=on/);
  }
}

export async function resetLocalityFilters(page: Page) {
  await resetFiltersLink(page).click();
  await expect(page).toHaveURL(/\/localities\/?$/);
  await expect(filterCitySelect(page)).toHaveValue("");
  await expect(filterNameInput(page)).toHaveValue("");
  await expect(hideInactiveCheckbox(page)).not.toBeChecked();
}

export async function createLocality(
  page: Page,
  data: { city: string; name: string; active?: boolean },
) {
  await createCitySelect(page).selectOption({ label: data.city });
  await localityNameInput(page).fill(data.name);
  if (data.active !== undefined) {
    await activeCheckbox(page).setChecked(data.active);
  }
  await addLocalityButton(page).click();
  await expect(localityRowByName(page, data.name)).toBeVisible({
    timeout: 20_000,
  });
}

export async function setLocalityActive(
  page: Page,
  name: string,
  active: boolean,
) {
  const row = localityRowByName(page, name);
  await expect(row).toBeVisible();
  await localityToggleButton(row).click();
  await expect(row).toHaveAttribute("data-active", String(active), {
    timeout: 15_000,
  });
  await expect(row).toContainText(active ? "Active" : "Inactive");
  await expect(localityToggleButton(row)).toHaveText(
    active ? "Deactivate" : "Activate",
  );
}
