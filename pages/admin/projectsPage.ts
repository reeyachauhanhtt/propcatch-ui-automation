import { expect, type Page } from "@playwright/test";
import {
  expectMediaUploaded,
  mediaSection,
  QA_PROJECT_BROCHURE,
  QA_PROJECT_FLOOR_PLAN,
  QA_PROJECT_GALLERY,
  QA_PROJECT_HERO,
  deleteFirstMediaInSlot,
  uploadMediaFile,
} from "./mediaPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Projects helpers for https://propcatch-admin.vercel.app/projects
 *
 * Verified 2026-08-26 / 2026-08-27 against the live Admin portal:
 * - List: table (Project, Type, Status, City, Units, Possession, Active) + pagination
 * - Create: /projects/new — Name/Builder/Property type/Status/City required
 *   Property type + status use datalist suggestions (status values are snake_case)
 *   Amenities checkboxes live under data-testid="create-project-amenities"
 * - Successful create lands on /projects/:id/edit (not detail)
 * - Detail /projects/:id: amenity picker + Save amenities, media slots
 *   (hero / gallery / brochure / floor_plan / rera_doc)
 * - Soft-delete dialog "Yes, delete" → /projects; detail shows Restore
 *
 * Disposable records must use the QA Autotest prefix and be soft-deleted after use.
 * Link new projects to an existing seeded builder (select only — do not edit builders).
 * Never mutate seeded project amenities (e.g. Montessa Heights).
 */

export const QA_PROJECT_PREFIX = "QA Autotest Project";

/** Seeded builder used only as a foreign key when creating QA projects. */
export const QA_PROJECT_BUILDER = "Acme Realty";

export const PROJECT_AMENITY_LABELS = [
  "Children Play Area",
  "Club House",
  "Garden",
  "Gym",
  "Parking",
  "Power Backup",
  "Security",
  "Skating rink",
  "Swimming Pool",
] as const;

export const PROJECT_MEDIA = {
  hero: { slot: "project.hero", file: QA_PROJECT_HERO, fileName: "qa-project-hero.png" },
  gallery: {
    slot: "project.gallery",
    file: QA_PROJECT_GALLERY,
    fileName: "qa-project-gallery.png",
  },
  floorPlan: {
    slot: "project.floor_plan",
    file: QA_PROJECT_FLOOR_PLAN,
    fileName: "qa-project-floor-plan.png",
  },
  brochure: {
    slot: "project.brochure",
    file: QA_PROJECT_BROCHURE,
    fileName: "qa-brochure.pdf",
    expectImage: false,
  },
  reraDoc: {
    slot: "project.rera_doc",
    file: QA_PROJECT_BROCHURE,
    fileName: "qa-brochure.pdf",
    expectImage: false,
  },
} as const;

export const PROPERTY_TYPE_OPTIONS = [
  "Apartment",
  "Commercial Office",
  "Villa",
] as const;

export const STATUS_OPTIONS = [
  "upcoming",
  "new_launch",
  "under_construction",
  "ready_to_move",
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function projectsHeading(page: Page) {
  return page.getByRole("heading", { name: "Projects", exact: true });
}

export function projectsSubtitle(page: Page) {
  return main(page).getByText(
    "Manage project records, location, and lifecycle status.",
  );
}

export function newProjectLink(page: Page) {
  return main(page).getByRole("link", { name: "+ New project", exact: true });
}

export function projectsTable(page: Page) {
  return main(page).getByRole("table");
}

export function projectRows(page: Page) {
  return projectsTable(page).locator("tbody tr");
}

export function projectNameLink(page: Page, name: string | RegExp) {
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

export function newProjectHeading(page: Page) {
  return page.getByRole("heading", { name: "New project", exact: true });
}

export function nameInput(page: Page) {
  return page.locator("#name");
}

export function builderSelect(page: Page) {
  return page.locator("#builder_id");
}

export function propertyTypeInput(page: Page) {
  return page.locator("#property_type");
}

export function statusInput(page: Page) {
  return page.locator("#status");
}

export function citySelect(page: Page) {
  return page.locator("#city_id");
}

export function localitySelect(page: Page) {
  return page.locator("#locality_id");
}

export function addressInput(page: Page) {
  return page.locator("#address");
}

export function descriptionInput(page: Page) {
  return page.locator("#description");
}

export function activeCheckbox(page: Page) {
  return page.locator("#is_active");
}

export function createProjectButton(page: Page) {
  return page.getByRole("button", { name: /^Create project$|^Saving/ });
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
  return page.getByTestId("delete-project-button");
}

export function createAmenitiesPicker(page: Page) {
  return page.getByTestId("create-project-amenities");
}

export function projectAmenitiesSection(page: Page) {
  return page.getByTestId("project-amenities-section");
}

export function projectAmenitiesPicker(page: Page) {
  return page.getByTestId("project-amenities-picker");
}

export function projectAmenitiesCount(page: Page) {
  return page.getByTestId("project-amenities-count");
}

export function projectAmenitiesSave(page: Page) {
  return page.getByTestId("project-amenities-save");
}

export function amenityOptionByLabel(page: Page, label: string) {
  return projectAmenitiesPicker(page)
    .locator('[data-testid^="project-amenity-option-"]')
    .filter({ hasText: label });
}

export function amenityCheckboxByLabel(page: Page, label: string) {
  return amenityOptionByLabel(page, label).locator('input[type="checkbox"]');
}

export function createAmenityCheckbox(page: Page, label: string) {
  return createAmenitiesPicker(page)
    .locator("label")
    .filter({ hasText: label })
    .locator('input[type="checkbox"]');
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

export function uniqueQaProjectName(suffix?: string) {
  const stamp = Date.now();
  return suffix
    ? `${QA_PROJECT_PREFIX} ${stamp} ${suffix}`
    : `${QA_PROJECT_PREFIX} ${stamp}`;
}

export function projectIdFromUrl(url: string) {
  const match = url.match(/\/projects\/([0-9a-f-]+)/i);
  if (!match) {
    throw new Error(`No project id in URL: ${url}`);
  }
  return match[1];
}

export async function openProjects(page: Page) {
  await page.goto("/projects");
  await expectProjectsListLoaded(page);
}

export async function expectProjectsListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(projectsHeading(page)).toBeVisible();
  await expect(projectsSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function openNewProject(page: Page) {
  await page.goto("/projects/new");
  await expect(page).toHaveURL(/\/projects\/new/);
  await expect(newProjectHeading(page)).toBeVisible();
}

export async function fillProjectForm(
  page: Page,
  data: {
    name: string;
    builder?: string;
    propertyType?: string;
    status?: string;
    city?: string;
    locality?: string;
    address?: string;
    description?: string;
    amenities?: readonly string[];
  },
) {
  await nameInput(page).fill(data.name);
  if (data.builder !== undefined) {
    await builderSelect(page).selectOption({ label: data.builder });
  }
  if (data.propertyType !== undefined) {
    await propertyTypeInput(page).fill(data.propertyType);
  }
  if (data.status !== undefined) {
    await statusInput(page).fill(data.status);
  }
  if (data.city !== undefined) {
    await citySelect(page).selectOption({ label: data.city });
  }
  if (data.locality !== undefined) {
    await expect(
      localitySelect(page).locator("option", { hasText: data.locality }),
    ).toBeAttached({ timeout: 10_000 });
    await localitySelect(page).selectOption({ label: data.locality });
  }
  if (data.address !== undefined) {
    await addressInput(page).fill(data.address);
  }
  if (data.description !== undefined) {
    await descriptionInput(page).fill(data.description);
  }
  if (data.amenities?.length) {
    await selectCreateAmenities(page, data.amenities);
  }
}

export async function selectCreateAmenities(
  page: Page,
  labels: readonly string[],
) {
  await expect(createAmenitiesPicker(page)).toBeVisible();
  for (const label of labels) {
    await createAmenityCheckbox(page, label).check();
  }
}

export async function expectSelectedAmenities(
  page: Page,
  labels: readonly string[],
) {
  await expect(projectAmenitiesSection(page)).toBeVisible();
  await expect(projectAmenitiesCount(page)).toContainText(
    `${labels.length} selected`,
  );
  for (const label of labels) {
    await expect(amenityCheckboxByLabel(page, label)).toBeChecked();
  }
}

export async function setDetailAmenities(
  page: Page,
  labels: readonly string[],
) {
  await expect(projectAmenitiesPicker(page)).toBeVisible();
  const options = projectAmenitiesPicker(page).locator(
    '[data-testid^="project-amenity-option-"]',
  );
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    const text = ((await option.innerText()) || "").trim();
    const checkbox = option.locator('input[type="checkbox"]');
    const shouldCheck = labels.some((label) => text.includes(label));
    if (shouldCheck) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }
  const save = projectAmenitiesSave(page);
  if (!(await save.isDisabled())) {
    await save.click();
    await expect(save).toBeDisabled({ timeout: 30_000 });
    await expect(save).toHaveText(/Save amenities/i);
  }
  await expectSelectedAmenities(page, labels);
}

/**
 * Creates a project. Live app redirects to /projects/:id/edit after create.
 */
export async function createProject(
  page: Page,
  data: {
    name: string;
    builder?: string;
    propertyType?: string;
    status?: string;
    city?: string;
    locality?: string;
    address?: string;
    description?: string;
    amenities?: readonly string[];
  },
) {
  await openNewProject(page);
  await fillProjectForm(page, {
    builder: QA_PROJECT_BUILDER,
    propertyType: "Apartment",
    status: "under_construction",
    city: "Ahmedabad",
    locality: "SG Highway",
    description: "Disposable QA Autotest project — safe to delete.",
    ...data,
  });
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/edit$/i, {
    timeout: 25_000,
  });
  await expect(
    page.getByRole("heading", { name: `Edit: ${data.name}`, exact: true }),
  ).toBeVisible();
}

export async function uploadProjectMedia(
  page: Page,
  kind: keyof typeof PROJECT_MEDIA,
) {
  const media = PROJECT_MEDIA[kind];
  await uploadMediaFile(page, media.slot, media.file);
  await expectMediaUploaded(
    page,
    media.slot,
    media.fileName,
    { expectImage: "expectImage" in media ? media.expectImage : true },
  );
}

export async function deleteProjectMedia(
  page: Page,
  kind: keyof typeof PROJECT_MEDIA,
) {
  await deleteFirstMediaInSlot(page, PROJECT_MEDIA[kind].slot);
}

export async function expectProjectMediaSlots(page: Page) {
  for (const media of Object.values(PROJECT_MEDIA)) {
    await expect(mediaSection(page, media.slot)).toBeVisible();
  }
}

export async function setProjectActive(page: Page, active: boolean) {
  if (page.url().includes("/edit")) {
    // already on edit
  } else {
    await openEditFromDetail(page);
  }
  if (active) {
    await activeCheckbox(page).check();
  } else {
    await activeCheckbox(page).uncheck();
  }
  await saveProjectChanges(page);
}

export async function openProjectDetail(page: Page, projectId: string) {
  await page.goto(`/projects/${projectId}`);
  await expect(page).toHaveURL(
    new RegExp(`/projects/${projectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
  );
  await expect(page.getByText("Projects / Detail")).toBeVisible();
}

export async function openEditFromDetail(page: Page) {
  await editLink(page).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/edit$/i);
  await expect(page.getByRole("heading", { name: /^Edit:/ })).toBeVisible();
}

/** Save on edit page — may stay on /edit or redirect to detail. */
export async function saveProjectChanges(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/projects\/[0-9a-f-]+\/edit/i.test(response.url()),
    { timeout: 20_000 },
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await responsePromise;
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+(\/edit)?$/i, {
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export async function softDeleteProject(page: Page) {
  await deleteButton(page).click();
  await expect(deleteDialog(page)).toBeVisible();
  await expect(deleteDialog(page).getByText("Delete project?")).toBeVisible();
  await confirmDeleteButton(page).click();
  await expect(page).toHaveURL(/\/projects\/?$/, { timeout: 20_000 });
  await expect(projectsHeading(page)).toBeVisible();
}

export async function expectProjectAbsentFromList(page: Page, name: string) {
  await openProjects(page);
  await expect(projectNameLink(page, name)).toHaveCount(0);
}

export async function cleanupQaProjectByName(page: Page, name: string) {
  await page.goto("/projects");
  const link = projectNameLink(page, name);
  if ((await link.count()) === 0) {
    return;
  }
  await link.click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+/i);
  if (page.url().includes("/edit")) {
    await openProjectDetail(page, projectIdFromUrl(page.url()));
  }
  if ((await deleteButton(page).count()) > 0) {
    await softDeleteProject(page);
  }
}
