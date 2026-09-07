import { test, expect } from "@playwright/test";
import {
  QA_LEAD_PROJECT,
  budgetMaxInput,
  budgetMinInput,
  cancelDeleteButton,
  cancelLink,
  cleanupQaLeadByName,
  contactEmailInput,
  contactNameInput,
  contactPhoneInput,
  createLead,
  createLeadButton,
  deleteButton,
  deleteDialog,
  expectLeadAbsentFromList,
  formErrorBanner,
  leadContactLink,
  leadsHeading,
  linkedUserIdInput,
  messageInput,
  newLeadHeading,
  openEditLead,
  openLeads,
  openNewLead,
  phoneOrEmailHint,
  projectSelect,
  restoreButton,
  saveLeadChanges,
  searchLeads,
  softDeleteLead,
  sourceInput,
  statusSelect,
  uniqueQaLeadEmail,
  uniqueQaLeadName,
  uniqueQaLeadPhone,
  unitSelect,
} from "../../../pages/admin/leadsPage";

/**
 * Create / edit / soft-delete only disposable QA Autotest leads.
 * Never mutate seeded leads. Link to seeded project via select only.
 */
test.describe("Admin Leads CRUD", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaLeadByName(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-LEADS-030 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewLead(page);

    await expect(newLeadHeading(page)).toBeVisible();
    await expect(contactNameInput(page)).toBeVisible();
    await expect(contactPhoneInput(page)).toBeVisible();
    await expect(contactEmailInput(page)).toBeVisible();
    await expect(phoneOrEmailHint(page)).toBeVisible();
    await expect(projectSelect(page)).toBeVisible();
    await expect(unitSelect(page)).toBeVisible();
    await expect(sourceInput(page)).toBeVisible();
    await expect(statusSelect(page)).toBeVisible();
    await expect(budgetMinInput(page)).toBeVisible();
    await expect(budgetMaxInput(page)).toBeVisible();
    await expect(linkedUserIdInput(page)).toBeVisible();
    await expect(messageInput(page)).toBeVisible();
    await expect(createLeadButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
  });

  test("ADMIN-LEADS-031 — empty required fields show validation", async ({
    page,
  }) => {
    await openNewLead(page);
    await page.getByRole("button", { name: "Create lead", exact: true }).click();

    await expect(page).toHaveURL(/\/leads\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    await expect(page.getByText("Expected string, received null")).toBeVisible();
  });

  test("ADMIN-LEADS-032 — Cancel returns to the leads list", async ({
    page,
  }) => {
    await openNewLead(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/leads\/?$/);
    await expect(leadsHeading(page)).toBeVisible();
  });

  test("ADMIN-LEADS-040 — can create a disposable QA lead @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    const phone = uniqueQaLeadPhone();
    const email = uniqueQaLeadEmail();

    await createLead(page, {
      name: contactName,
      phone,
      email,
      project: QA_LEAD_PROJECT,
      source: "manual",
      status: "New",
      message: "Disposable QA Autotest lead — safe to delete.",
    });

    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByText(phone).first()).toBeVisible();
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText(QA_LEAD_PROJECT).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
  });

  test("ADMIN-LEADS-041 — created QA lead appears on the list", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await openLeads(page);
    await searchLeads(page, contactName);
    await expect(leadContactLink(page, contactName)).toBeVisible();
  });

  test("ADMIN-LEADS-050 — can edit a QA lead name", async ({ page }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, {
      name: contactName,
      message: "Before edit",
    });

    await openEditLead(page);
    const editedName = `${contactName} Edited`;
    await contactNameInput(page).fill(editedName);
    await messageInput(page).fill("After edit — QA Autotest");
    await saveLeadChanges(page);

    await expect(
      page.getByRole("heading", { name: editedName, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("After edit — QA Autotest")).toBeVisible();

    contactName = editedName;
  });

  test("ADMIN-LEADS-060 — soft-delete removes QA lead from list @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    const detailUrl = page.url();
    await softDeleteLead(page);
    await expectLeadAbsentFromList(page, contactName);

    await page.goto(detailUrl);
    await expect(
      page.getByRole("heading", { name: contactName, exact: true }),
    ).toBeVisible();
    await expect(restoreButton(page)).toBeVisible();
    await expect(page.getByText(/^deleted$/i).first()).toBeVisible();
    await expect(deleteButton(page)).toHaveCount(0);

    contactName = "";
  });

  test("ADMIN-LEADS-061 — delete dialog Cancel keeps the QA lead", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await deleteButton(page).click();
    await expect(deleteDialog(page)).toBeVisible();
    await expect(deleteDialog(page)).toContainText(contactName);
    await cancelDeleteButton(page).click();
    await expect(deleteDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: contactName, exact: true }),
    ).toBeVisible();
  });
});
