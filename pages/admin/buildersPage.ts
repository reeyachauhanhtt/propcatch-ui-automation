import { expect, type Page } from "@playwright/test";
import {
  expectMediaUploaded,
  mediaSection,
  QA_BUILDER_LOGO,
  uploadMediaFile,
} from "./mediaPage";
import { expectAdminShellVisible } from "./shell";

export const BUILDER_LOGO_SLOT = "builder.logo";

export const QA_BUILDER_PREFIX = "QA Autotest Builder";

export function main(page: Page) {
  return page.getByRole("main");
}

export function buildersHeading(page: Page) {
  return page.getByRole("heading", { name: "Builders", exact: true });
}

export function buildersSubtitle(page: Page) {
  return main(page).getByText(
    "Manage builder/developer profiles. Linked to projects, units, and verification.",
  );
}

export function newBuilderLink(page: Page) {
  return main(page).getByRole("link", { name: "+ New builder", exact: true });
}

export function buildersTable(page: Page) {
  return main(page).getByRole("table");
}

export function builderRows(page: Page) {
  return buildersTable(page).locator("tbody tr");
}

export function builderNameLink(page: Page, name: string | RegExp) {
  return main(page).getByRole("link", {
    name,
    exact: typeof name === "string",
  });
}

export function previousPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Previous", exact: true });
}

export function nextPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Next", exact: true });
}

export function newBuilderHeading(page: Page) {
  return page.getByRole("heading", { name: "New builder", exact: true });
}

export function nameInput(page: Page) {
  return page.locator("#name");
}

export function legalNameInput(page: Page) {
  return page.locator("#legal_name");
}

export function establishedYearInput(page: Page) {
  return page.locator("#established_year");
}

export function websiteUrlInput(page: Page) {
  return page.locator("#website_url");
}

export function logoUrlInput(page: Page) {
  return page.locator("#logo_url");
}

export function builderLogoSection(page: Page) {
  return mediaSection(page, BUILDER_LOGO_SLOT);
}

export async function uploadBuilderLogo(
  page: Page,
  filePath: string = QA_BUILDER_LOGO,
) {
  await uploadMediaFile(page, BUILDER_LOGO_SLOT, filePath);
  await expectMediaUploaded(page, BUILDER_LOGO_SLOT);
}

export function hqCitySelect(page: Page) {
  return page.locator("#headquarters_city_id");
}

export function descriptionInput(page: Page) {
  return page.locator("#description");
}

export function activeCheckbox(page: Page) {
  return page.locator("#is_active");
}

export function createBuilderButton(page: Page) {
  return page.getByRole("button", { name: /^Create builder$|^Saving/ });
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

export function nameRequiredError(page: Page) {
  return main(page).getByText("Required", { exact: true });
}

export function editLink(page: Page) {
  return main(page).getByRole("link", { name: "Edit", exact: true });
}

export function deleteButton(page: Page) {
  return page.getByTestId("delete-builder-button");
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
  return deleteDialog(page).getByRole("button", {
    name: "Cancel",
    exact: true,
  });
}

export function uniqueQaBuilderName(suffix?: string) {
  const stamp = Date.now();
  return suffix
    ? `${QA_BUILDER_PREFIX} ${stamp} ${suffix}`
    : `${QA_BUILDER_PREFIX} ${stamp}`;
}

export async function openBuilders(page: Page) {
  await page.goto("/builders");
  await expectBuildersListLoaded(page);
}

export async function expectBuildersListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/builders\/?$/);
  await expect(buildersHeading(page)).toBeVisible();
  await expect(buildersSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export function builderIdFromUrl(url: string) {
  const match = url.match(/\/builders\/([0-9a-f-]+)/i);
  if (!match) {
    throw new Error(`No builder id in URL: ${url}`);
  }
  return match[1];
}

export async function openNewBuilder(page: Page) {
  await page.goto("/builders/new");
  await expect(page).toHaveURL(/\/builders\/new/);
  await expect(newBuilderHeading(page)).toBeVisible();
}

export async function fillBuilderForm(
  page: Page,
  data: {
    name: string;
    legalName?: string;
    establishedYear?: string;
    websiteUrl?: string;
    hqCity?: string;
    description?: string;
  },
) {
  await nameInput(page).fill(data.name);
  if (data.legalName !== undefined) {
    await legalNameInput(page).fill(data.legalName);
  }
  if (data.establishedYear !== undefined) {
    await establishedYearInput(page).fill(data.establishedYear);
  }
  if (data.websiteUrl !== undefined) {
    await websiteUrlInput(page).fill(data.websiteUrl);
  }
  if (data.hqCity !== undefined) {
    await hqCitySelect(page).selectOption({ label: data.hqCity });
  }
  if (data.description !== undefined) {
    await descriptionInput(page).fill(data.description);
  }
}

export async function createBuilder(
  page: Page,
  data: {
    name: string;
    legalName?: string;
    establishedYear?: string;
    websiteUrl?: string;
    hqCity?: string;
    description?: string;
  },
) {
  await openNewBuilder(page);
  await fillBuilderForm(page, data);
  await page
    .getByRole("button", { name: "Create builder", exact: true })
    .click();
  await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: data.name, exact: true }),
  ).toBeVisible();
}

export async function openBuilderByName(page: Page, name: string) {
  await openBuilders(page);
  await builderNameLink(page, name).click();
  await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

export async function openEditBuilder(page: Page) {
  await editLink(page).click();
  await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+\/edit$/i);
  await expect(page.getByRole("heading", { name: /^Edit:/ })).toBeVisible();
}

export async function saveBuilderChanges(page: Page) {
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i, { timeout: 20_000 });
}

/**
 * Soft-delete from detail. Leaves audit trail; record disappears from list.
 */
export async function softDeleteBuilder(page: Page) {
  await deleteButton(page).click();
  await expect(deleteDialog(page)).toBeVisible();
  await expect(deleteDialog(page).getByText("Delete builder?")).toBeVisible();
  await confirmDeleteButton(page).click();
  await expect(page).toHaveURL(/\/builders\/?$/, { timeout: 20_000 });
  await expect(buildersHeading(page)).toBeVisible();
}

export async function expectBuilderAbsentFromList(page: Page, name: string) {
  await openBuilders(page);
  await expect(builderNameLink(page, name)).toHaveCount(0);
}

/** Best-effort cleanup if a prior step left a QA builder on the list. */
export async function cleanupQaBuilderByName(page: Page, name: string) {
  await page.goto("/builders");
  const link = builderNameLink(page, name);
  if ((await link.count()) === 0) {
    return;
  }
  await link.click();
  await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i);
  if ((await deleteButton(page).count()) > 0) {
    await softDeleteBuilder(page);
  }
}
