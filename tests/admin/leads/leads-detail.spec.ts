import { test, expect } from "@playwright/test";
import {
  QA_LEAD_PROJECT,
  assignmentHeading,
  attachmentsHeading,
  callbacksHeading,
  changeLeadStatus,
  cleanupQaLeadByName,
  communicationLogHeading,
  createLead,
  deleteButton,
  editLink,
  followUpsHeading,
  isDisposableContactName,
  leadAttachmentSection,
  leadOverviewHeading,
  leadRows,
  openLeads,
  uniqueQaLeadName,
  uploadLeadAttachment,
} from "../../../pages/admin/leadsPage";

/**
 * Lead detail chrome and in-place status / attachments.
 * Assignment, follow-ups, callbacks, and the communication log are covered
 * in leads-activity.spec.ts. Never mutate seeded leads.
 */
test.describe("Admin Leads detail", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaLeadByName(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-LEADS-070 — opening a seeded lead shows read-only detail chrome @smoke", async ({
    page,
  }) => {
    await openLeads(page);

    const rows = leadRows(page);
    const count = await rows.count();
    let name = "";
    let link = rows.first().locator('a[href*="/leads/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/leads/"]').first();
      if ((await candidate.count()) === 0) {
        continue;
      }
      const text = (await candidate.innerText()).trim();
      if (!isDisposableContactName(text)) {
        name = text;
        link = candidate;
        break;
      }
    }
    expect(name.length).toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(editLink(page)).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
    await expect(leadOverviewHeading(page)).toBeVisible();
    // Do not edit or delete seeded leads.
  });

  test("ADMIN-LEADS-071 — overview shows contact, project, source, and status labels", async ({
    page,
  }) => {
    await openLeads(page);
    const rows = leadRows(page);
    const count = await rows.count();
    let link = rows.first().locator('a[href*="/leads/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/leads/"]').first();
      const text = (await candidate.innerText()).trim();
      if (!isDisposableContactName(text)) {
        link = candidate;
        break;
      }
    }

    await link.click();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByText(/contact name/i).first()).toBeVisible();
    await expect(page.getByText(/^phone$/i).first()).toBeVisible();
    await expect(page.getByText(/^email$/i).first()).toBeVisible();
    await expect(page.getByText(/^project$/i).first()).toBeVisible();
    await expect(page.getByText(/^source$/i).first()).toBeVisible();
    await expect(page.getByText(/^status$/i).first()).toBeVisible();
    await expect(page.getByText(/^created$/i).first()).toBeVisible();
    await expect(page.getByText(/^notes$/i).first()).toBeVisible();
  });

  test("ADMIN-LEADS-072 — assignment, follow-up, callback, and log sections are visible", async ({
    page,
  }) => {
    await openLeads(page);
    const rows = leadRows(page);
    const count = await rows.count();
    let link = rows.first().locator('a[href*="/leads/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/leads/"]').first();
      const text = (await candidate.innerText()).trim();
      if (!isDisposableContactName(text)) {
        link = candidate;
        break;
      }
    }

    await link.click();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(assignmentHeading(page)).toBeVisible();
    await expect(followUpsHeading(page)).toBeVisible();
    await expect(callbacksHeading(page)).toBeVisible();
    await expect(communicationLogHeading(page)).toBeVisible();
    await expect(attachmentsHeading(page)).toBeVisible();
    // Do not submit assignment / follow-up / callback / log on seeded leads.
  });

  test("ADMIN-LEADS-073 — Project link from detail opens the project page", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, {
      name: contactName,
      project: QA_LEAD_PROJECT,
    });

    await page.getByRole("link", { name: QA_LEAD_PROJECT, exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: QA_LEAD_PROJECT, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
  });

  test("ADMIN-LEADS-074 — can change status inline on a QA lead @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, {
      name: contactName,
      status: "New",
    });

    await changeLeadStatus(page, "Contacted");
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: contactName, exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-LEADS-075 — can upload an attachment on a QA lead @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await expect(leadAttachmentSection(page)).toBeVisible();
    await expect(
      page.getByText("JPG / PNG / WebP / PDF, up to 20 MB"),
    ).toBeVisible();
    await expect(
      page.getByText("No files uploaded yet.", { exact: true }),
    ).toBeVisible();

    await uploadLeadAttachment(page);
  });
});
