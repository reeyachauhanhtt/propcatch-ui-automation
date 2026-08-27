import { test, expect } from "@playwright/test";
import {
  activeCheckbox,
  builderNameLink,
  cancelDeleteButton,
  cancelLink,
  builderLogoSection,
  cleanupQaBuilderByName,
  createBuilder,
  createBuilderButton,
  deleteButton,
  deleteDialog,
  descriptionInput,
  establishedYearInput,
  expectBuilderAbsentFromList,
  formErrorBanner,
  hqCitySelect,
  legalNameInput,
  logoUrlInput,
  nameInput,
  nameRequiredError,
  newBuilderHeading,
  openBuilders,
  openEditBuilder,
  openNewBuilder,
  restoreButton,
  saveBuilderChanges,
  softDeleteBuilder,
  uniqueQaBuilderName,
  uploadBuilderLogo,
  websiteUrlInput,
} from "../../../pages/admin/buildersPage";
import { expectMediaUploaded } from "../../../pages/admin/mediaPage";

/**
 * Create / edit / soft-delete only disposable QA Autotest builders.
 * Never mutate seeded builders. Always clean up.
 */
test.describe("Admin Builders CRUD", () => {
  test.describe.configure({ mode: "serial", timeout: 60_000 });

  let builderName = "";

  test.afterEach(async ({ page }) => {
    if (builderName) {
      await cleanupQaBuilderByName(page, builderName);
      builderName = "";
    }
  });

  test("ADMIN-BUILDERS-010 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewBuilder(page);

    await expect(newBuilderHeading(page)).toBeVisible();
    await expect(nameInput(page)).toBeVisible();
    await expect(legalNameInput(page)).toBeVisible();
    await expect(establishedYearInput(page)).toBeVisible();
    await expect(websiteUrlInput(page)).toBeVisible();
    await expect(hqCitySelect(page)).toBeVisible();
    await expect(descriptionInput(page)).toBeVisible();
    await expect(activeCheckbox(page)).toBeVisible();
    await expect(createBuilderButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
    await expect(logoUrlInput(page)).toBeVisible();
  });

  test("ADMIN-BUILDERS-011 — empty Name shows Required validation", async ({
    page,
  }) => {
    await openNewBuilder(page);
    await page.getByRole("button", { name: "Create builder", exact: true }).click();

    await expect(page).toHaveURL(/\/builders\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    await expect(nameRequiredError(page)).toBeVisible();
  });

  test("ADMIN-BUILDERS-012 — Cancel returns to the builders list", async ({
    page,
  }) => {
    await openNewBuilder(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/builders\/?$/);
    await expect(page.getByRole("heading", { name: "Builders", exact: true })).toBeVisible();
  });

  test("ADMIN-BUILDERS-020 — can create a disposable QA builder @smoke", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName();
    const legalName = builderName.replace("Builder", "Legal");

    await createBuilder(page, {
      name: builderName,
      legalName,
      establishedYear: "2021",
      websiteUrl: "https://example.com/qa-autotest",
      hqCity: "Ahmedabad",
      description: "Disposable QA Autotest builder — safe to delete.",
    });

    await expect(page.getByText("Builders / Detail")).toBeVisible();
    await expect(page.getByText(legalName, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Ahmedabad").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
  });

  test("ADMIN-BUILDERS-021 — created QA builder appears on the list", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Surat",
    });

    await openBuilders(page);
    await expect(builderNameLink(page, builderName)).toBeVisible();
  });

  test("ADMIN-BUILDERS-030 — can edit a QA builder name", async ({ page }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Mumbai",
      description: "Before edit",
    });

    await openEditBuilder(page);
    const editedName = `${builderName} Edited`;
    await nameInput(page).fill(editedName);
    await descriptionInput(page).fill("After edit — QA Autotest");
    await saveBuilderChanges(page);

    await expect(page.getByRole("heading", { name: editedName, exact: true })).toBeVisible();
    await expect(page.getByText("After edit — QA Autotest")).toBeVisible();

    // Cleanup must target the renamed record.
    builderName = editedName;
  });

  test("ADMIN-BUILDERS-040 — soft-delete removes QA builder from list @smoke", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Ahmedabad",
    });

    const detailUrl = page.url();
    await softDeleteBuilder(page);
    await expectBuilderAbsentFromList(page, builderName);

    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: builderName, exact: true })).toBeVisible();
    await expect(restoreButton(page)).toBeVisible();
    await expect(page.getByText("SOFT-DELETED")).toBeVisible();
    await expect(page.getByText("Inactive", { exact: true })).toBeVisible();
    await expect(deleteButton(page)).toHaveCount(0);

    builderName = ""; // already soft-deleted
  });

  test("ADMIN-BUILDERS-050 — can upload a logo on detail @smoke", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
      hqCity: "Ahmedabad",
    });

    await expect(builderLogoSection(page)).toBeVisible();
    await expect(
      page.getByText("JPG / PNG / WebP, up to 5 MB"),
    ).toBeVisible();
    await expect(page.getByText("No file yet.", { exact: true })).toBeVisible();

    await uploadBuilderLogo(page);
    await expectMediaUploaded(page, "builder.logo", "qa-builder-logo.png");
    await expect(
      page.getByRole("button", { name: "Replace", exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-BUILDERS-041 — delete dialog Cancel keeps the QA builder", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName();
    await createBuilder(page, {
      name: builderName,
      legalName: `${builderName} Legal`,
    });

    await deleteButton(page).click();
    await expect(deleteDialog(page)).toBeVisible();
    await expect(deleteDialog(page)).toContainText(builderName);
    await cancelDeleteButton(page).click();
    await expect(deleteDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name: builderName, exact: true })).toBeVisible();
  });
});
