import { expect, type Page } from "@playwright/test";
import {
  QA_PROJECT_BROCHURE,
  expectMediaUploaded,
  mediaSection,
  uploadMediaFile,
} from "./mediaPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Leads helpers for https://propcatch-admin.vercel.app/leads
 *
 * Verified 2026-09-04 against the live Admin portal:
 * - "Module 8 — Leads" — all buyer enquiries (manual, portal, WhatsApp, etc.).
 * - Search (#filter-q) auto-applies via ?q= (debounced). Filters auto-apply:
 *   status (#filter-status → ?status_id=<uuid>), project (#filter-project →
 *   ?project_id=<uuid>), source (#filter-source → ?source=), from/to dates
 *   (#filter-from / #filter-to). "Clear filters" returns to /leads.
 * - Table: Contact (link → /leads/:id) · Project / Unit · Source · Status ·
 *   Assigned · Created. Empty state: "No leads". List has no row-level delete.
 * - Create /leads/new: Contact name, phone or email (required for manual),
 *   Project *, Source * (datalist, defaults to "manual"), Status * required.
 *   Lands on /leads/:id. Edit is /leads/:id/edit ("Edit lead" / Save changes).
 * - Detail: "Leads / Detail", inline status select, Edit, soft-delete
 *   (delete-lead-button + Yes, delete). Cards: Lead overview, Assignment
 *   (Reassign), Follow-ups, Callbacks, Communication log, Attachments
 *   (lead.attachment).
 *
 * Create / edit / delete only disposable QA Autotest leads. Never mutate
 * seeded contacts. Tester-name cleanup is a separate one-shot spec.
 */

export const TESTER_CONTACT_NAMES = [
  "Automation Tester",
  "Non-Admin Tester",
] as const;

export type TesterContactName = (typeof TESTER_CONTACT_NAMES)[number];

export const QA_LEAD_PREFIX = "QA Autotest Lead";

/** Seeded project used only as a foreign key when creating QA leads. */
export const QA_LEAD_PROJECT = "Montessa Heights";

export const QA_LEAD_STATUS = "New";
export const QA_LEAD_SOURCE = "manual";

export const LEAD_ATTACHMENT_SLOT = "lead.attachment";

export const QA_LEAD_ASSIGNEE_LABEL = "Sagar Bhatt (sagar.bhatt4@gmail.com)";
export const QA_LEAD_ASSIGNEE_NAME = "Sagar Bhatt";

export const LEAD_SOURCE_OPTIONS = [
  "manual",
  "whatsapp",
  "call",
  "walk_in",
  "portal",
  "campaign",
  "referral",
  "broker",
] as const;

export const FOLLOWUP_TYPES = [
  "call",
  "whatsapp",
  "email",
  "sms",
  "meeting",
  "site_visit",
  "note",
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function leadsHeading(page: Page) {
  return page.getByRole("heading", { name: "Leads", exact: true });
}

export function leadsModuleLabel(page: Page) {
  return main(page).getByText("Module 8 — Leads", { exact: true });
}

export function leadsSubtitle(page: Page) {
  return main(page).getByText(
    "All buyer enquiries — manual, portal, WhatsApp, broker, etc.",
  );
}

export function newLeadLink(page: Page) {
  return main(page).getByRole("link", { name: "+ New lead", exact: true });
}

export function newLeadHeading(page: Page) {
  return page.getByRole("heading", { name: "New lead", exact: true });
}

export function editLeadHeading(page: Page) {
  return page.getByRole("heading", { name: "Edit lead", exact: true });
}

/* ---- List filters ---- */

export function searchInput(page: Page) {
  return page.locator("#filter-q");
}

export function filterStatusSelect(page: Page) {
  return page.locator("#filter-status");
}

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function filterSourceSelect(page: Page) {
  return page.locator("#filter-source");
}

export function filterFromInput(page: Page) {
  return page.locator("#filter-from");
}

export function filterToInput(page: Page) {
  return page.locator("#filter-to");
}

export function clearFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Clear filters", exact: true });
}

/* ---- Table ---- */

export function leadsTable(page: Page) {
  return main(page).getByRole("table");
}

export function leadRows(page: Page) {
  return leadsTable(page).locator("tbody tr");
}

export function leadContactLinks(page: Page) {
  return leadsTable(page).locator('a[href*="/leads/"]');
}

export function leadContactLink(page: Page, name: string) {
  return leadContactLinks(page).filter({
    hasText: new RegExp(`^${escapeRegExp(name)}$`),
  });
}

export function leadsEmptyState(page: Page) {
  return main(page).getByText("No leads").first();
}

export function previousPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Previous", exact: true });
}

export function nextPageButton(page: Page) {
  return main(page).getByRole("button", { name: "Next", exact: true });
}

export function paginationLabel(page: Page) {
  return main(page).getByText(/Page \d+ of \d+/);
}

async function goToNextLeadPage(page: Page) {
  const beforeHref = await leadContactLinks(page).first().getAttribute("href");
  const beforePage = ((await paginationLabel(page).textContent()) ?? "").trim();
  await nextPageButton(page).click();
  await expect
    .poll(
      async () => {
        const href = await leadContactLinks(page).first().getAttribute("href");
        const label = ((await paginationLabel(page).textContent()) ?? "").trim();
        return `${label}|${href}`;
      },
      { timeout: 15_000 },
    )
    .not.toBe(`${beforePage}|${beforeHref}`);
}

/* ---- Create / edit form ---- */

export function contactNameInput(page: Page) {
  return page.locator("#contact_name");
}

export function contactPhoneInput(page: Page) {
  return page.locator("#contact_phone");
}

export function contactEmailInput(page: Page) {
  return page.locator("#contact_email");
}

export function projectSelect(page: Page) {
  return page.locator("#project_id");
}

export function unitSelect(page: Page) {
  return page.locator("#unit_id");
}

export function sourceInput(page: Page) {
  return page.locator("#source");
}

export function statusSelect(page: Page) {
  return page.locator("#status_id");
}

export function budgetMinInput(page: Page) {
  return page.locator("#budget_min");
}

export function budgetMaxInput(page: Page) {
  return page.locator("#budget_max");
}

export function linkedUserIdInput(page: Page) {
  return page.locator("#user_id");
}

export function messageInput(page: Page) {
  return page.locator("#message");
}

export function phoneOrEmailHint(page: Page) {
  return main(page).getByText("Phone or email is required for manual leads.");
}

export function createLeadButton(page: Page) {
  return page.getByRole("button", { name: /^Create lead$|^Saving/ });
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

/* ---- Detail chrome ---- */

export function editLink(page: Page) {
  return main(page).getByRole("link", { name: "Edit", exact: true });
}

export function deleteButton(page: Page) {
  return page.getByTestId("delete-lead-button");
}

export function restoreButton(page: Page) {
  return main(page).getByRole("button", { name: "Restore", exact: true });
}

export function deleteDialog(page: Page) {
  return page.getByRole("dialog");
}

export function confirmDeleteButton(page: Page) {
  return deleteDialog(page)
    .getByRole("button", { name: "Yes, delete", exact: true })
    .or(deleteDialog(page).getByRole("button", { name: "Delete", exact: true }));
}

export function cancelDeleteButton(page: Page) {
  return deleteDialog(page).getByRole("button", { name: "Cancel", exact: true });
}

export function detailStatusSelect(page: Page) {
  return main(page).locator('select[name="status_id"]').first();
}

export function leadOverviewHeading(page: Page) {
  return main(page).getByText("Lead overview", { exact: true });
}

export function assignmentHeading(page: Page) {
  return main(page).getByText("Assignment", { exact: true });
}

export function followUpsHeading(page: Page) {
  return main(page).getByText("Follow-ups", { exact: true });
}

export function callbacksHeading(page: Page) {
  return main(page).getByText("Callbacks", { exact: true });
}

export function communicationLogHeading(page: Page) {
  return main(page).getByText("Communication log", { exact: true });
}

export function attachmentsHeading(page: Page) {
  return main(page).getByText("Attachments", { exact: true });
}

export function leadAttachmentSection(page: Page) {
  return mediaSection(page, LEAD_ATTACHMENT_SLOT);
}

/* ---- Assignment / follow-up / callback / communication ---- */

export function assignedToSelect(page: Page) {
  return page.locator("#assigned_to");
}

export function reassignButton(page: Page) {
  return main(page).getByRole("button", { name: "Reassign", exact: true });
}

export function followupTypeInput(page: Page) {
  return page.locator("#followup_type");
}

export function nextFollowupAtInput(page: Page) {
  return page.locator("#next_followup_at");
}

export function followupNotesInput(page: Page) {
  return page.locator("#followup_notes");
}

export function addFollowupButton(page: Page) {
  return main(page).getByRole("button", { name: "Add follow-up", exact: true });
}

export function markCompletedButton(page: Page) {
  return main(page).getByRole("button", { name: "Mark completed", exact: true });
}

export function callbackStatusInput(page: Page) {
  return page.locator("#callback_status");
}

export function scheduledAtInput(page: Page) {
  return page.locator("#scheduled_at");
}

export function callbackRemarksInput(page: Page) {
  return page.locator("#callback_remarks");
}

export function addCallbackButton(page: Page) {
  return main(page).getByRole("button", { name: "Add callback", exact: true });
}

export function channelInput(page: Page) {
  return page.locator("#channel");
}

export function directionSelect(page: Page) {
  return page.locator("#direction");
}

export function commStatusInput(page: Page) {
  return page.locator("#comm_status");
}

export function commMessageInput(page: Page) {
  return page.locator("#comm_message");
}

export function logCommunicationButton(page: Page) {
  return main(page).getByRole("button", {
    name: "Log communication",
    exact: true,
  });
}

/* ---- Navigation helpers ---- */

export async function openLeads(page: Page) {
  await page.goto("/leads");
  await expectLeadsListLoaded(page);
}

export async function expectLeadsListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/leads\/?(\?.*)?$/);
  await expect(leadsHeading(page)).toBeVisible();
  await expect(leadsSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function expectLeadDetailLoaded(page: Page, name?: string) {
  await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+/i);
  await expect(page.getByText("Leads / Detail")).toBeVisible();
  if (name) {
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
}

export function leadIdFromUrl(url: string) {
  const match = url.match(/\/leads\/([0-9a-f-]+)/i);
  if (!match) {
    throw new Error(`No lead id in URL: ${url}`);
  }
  return match[1];
}

export async function openNewLead(page: Page) {
  await page.goto("/leads/new");
  await expect(page).toHaveURL(/\/leads\/new/);
  await expect(newLeadHeading(page)).toBeVisible();
}

export async function openLeadDetail(page: Page, leadId: string) {
  await page.goto(`/leads/${leadId}`);
  await expect(page).toHaveURL(
    new RegExp(`/leads/${leadId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
  );
  await expect(page.getByText("Leads / Detail")).toBeVisible();
}

export async function openEditLead(page: Page) {
  await editLink(page).click();
  await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+\/edit$/i);
  await expect(editLeadHeading(page)).toBeVisible();
}

/** Search auto-applies on typing (debounced) → ?q=<query>. */
export async function searchLeads(page: Page, query: string) {
  await searchInput(page).fill(query);
  await expect(page).toHaveURL(/[?&]q=/, { timeout: 15_000 });
  await expect(main(page).getByText(/searching/i)).toHaveCount(0, {
    timeout: 15_000,
  });
  await expectLeadsListLoaded(page);
}

/**
 * Applies list filters. Each control auto-applies via URL query params
 * (status_id, project_id, source, from, to).
 */
export async function applyLeadFilters(
  page: Page,
  filters: {
    status?: string;
    project?: string;
    source?: string;
    from?: string;
    to?: string;
  },
) {
  if (filters.status !== undefined) {
    await filterStatusSelect(page).selectOption({ label: filters.status });
    await expect(page).toHaveURL(/[?&]status_id=/, { timeout: 15_000 });
  }
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
    await expect(page).toHaveURL(/[?&]project_id=/, { timeout: 15_000 });
  }
  if (filters.source !== undefined) {
    await filterSourceSelect(page).selectOption(filters.source);
    await expect(page).toHaveURL(/[?&]source=/, { timeout: 15_000 });
  }
  if (filters.from !== undefined) {
    await filterFromInput(page).fill(filters.from);
    await expect(page).toHaveURL(/[?&]from=/, { timeout: 15_000 });
  }
  if (filters.to !== undefined) {
    await filterToInput(page).fill(filters.to);
    await expect(page).toHaveURL(/[?&]to=/, { timeout: 15_000 });
  }
  await expectLeadsListLoaded(page);
}

export async function clearLeadFilters(page: Page) {
  await clearFiltersButton(page).click();
  await expect(page).toHaveURL(/\/leads\/?$/, { timeout: 15_000 });
  await expect(searchInput(page)).toHaveValue("");
  await expectLeadsListLoaded(page);
}

/* ---- Row collection ---- */

async function collectColumnText(page: Page, columnIndex: number) {
  const rows = leadRows(page);
  const count = await rows.count();
  const values: string[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const text = (await row.innerText()).trim();
    if (/^No leads/i.test(text)) {
      continue;
    }
    const cell = row.locator("td").nth(columnIndex);
    if ((await cell.count()) === 0) {
      continue;
    }
    values.push((await cell.innerText()).trim());
  }

  return values;
}

export async function collectContactNamesOnPage(page: Page) {
  const links = leadContactLinks(page);
  const count = await links.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push((await links.nth(i).innerText()).trim());
  }
  return names;
}

export async function collectLeadProjects(page: Page) {
  const rows = leadRows(page);
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

export async function collectLeadSources(page: Page) {
  return collectColumnText(page, 2);
}

export async function collectLeadStatuses(page: Page) {
  return collectColumnText(page, 3);
}

export async function collectLeadCreatedDates(page: Page) {
  return collectColumnText(page, 5);
}

export function isTesterContactName(name: string) {
  return (TESTER_CONTACT_NAMES as readonly string[]).includes(name);
}

export function isDisposableContactName(name: string) {
  return (
    isTesterContactName(name) ||
    /^QA Autotest/i.test(name) ||
    /^E2E[- ]/i.test(name)
  );
}

/** First contact on the unfiltered list that is not a leftover tester. */
export async function findKeeperContactName(page: Page) {
  await openLeads(page);
  for (let i = 0; i < 20; i++) {
    const names = await collectContactNamesOnPage(page);
    const keeper = names.find((name) => name && !isTesterContactName(name));
    if (keeper) {
      return keeper;
    }
    if (await nextPageButton(page).isDisabled()) {
      break;
    }
    await goToNextLeadPage(page);
  }
  return "";
}

export async function findSeededContactName(page: Page) {
  const names = await collectContactNamesOnPage(page);
  return names.find((name) => name && !isDisposableContactName(name)) ?? "";
}

/**
 * Collect /leads/:id hrefs whose Contact link text is exactly `name`, walking
 * every page of the current (usually searched) list.
 */
export async function collectLeadHrefsForContact(page: Page, name: string) {
  const hrefs: string[] = [];
  for (let i = 0; i < 50; i++) {
    if ((await leadsEmptyState(page).count()) > 0) {
      break;
    }
    const links = leadContactLinks(page);
    const count = await links.count();
    for (let j = 0; j < count; j++) {
      const link = links.nth(j);
      const text = (await link.innerText()).trim();
      if (text !== name) {
        continue;
      }
      const href = await link.getAttribute("href");
      if (href) {
        hrefs.push(href);
      }
    }
    if (await nextPageButton(page).isDisabled()) {
      break;
    }
    await goToNextLeadPage(page);
  }
  return [...new Set(hrefs)];
}

/* ---- Create / edit / delete ---- */

export function uniqueQaLeadName(suffix?: string) {
  const stamp = Date.now();
  return suffix
    ? `${QA_LEAD_PREFIX} ${stamp} ${suffix}`
    : `${QA_LEAD_PREFIX} ${stamp}`;
}

export function uniqueQaLeadPhone() {
  return `9${String(Date.now()).slice(-9)}`;
}

export function uniqueQaLeadEmail() {
  return `qa.autotest.lead.${Date.now()}@example.com`;
}

export function futureDateTimeLocal(daysAhead = 14) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function fillLeadForm(
  page: Page,
  data: {
    name: string;
    phone?: string;
    email?: string;
    project?: string;
    source?: string;
    status?: string;
    budgetMin?: string;
    budgetMax?: string;
    message?: string;
  },
) {
  await contactNameInput(page).fill(data.name);
  if (data.phone !== undefined) {
    await contactPhoneInput(page).fill(data.phone);
  }
  if (data.email !== undefined) {
    await contactEmailInput(page).fill(data.email);
  }
  if (data.project !== undefined) {
    await projectSelect(page).selectOption({ label: data.project });
  }
  if (data.source !== undefined) {
    await sourceInput(page).fill(data.source);
  }
  if (data.status !== undefined) {
    await statusSelect(page).selectOption({ label: data.status });
  }
  if (data.budgetMin !== undefined) {
    await budgetMinInput(page).fill(data.budgetMin);
  }
  if (data.budgetMax !== undefined) {
    await budgetMaxInput(page).fill(data.budgetMax);
  }
  if (data.message !== undefined) {
    await messageInput(page).fill(data.message);
  }
}

export async function createLead(
  page: Page,
  data: {
    name: string;
    phone?: string;
    email?: string;
    project?: string;
    source?: string;
    status?: string;
    budgetMin?: string;
    budgetMax?: string;
    message?: string;
  },
) {
  await openNewLead(page);
  await fillLeadForm(page, {
    phone: uniqueQaLeadPhone(),
    project: QA_LEAD_PROJECT,
    source: QA_LEAD_SOURCE,
    status: QA_LEAD_STATUS,
    ...data,
  });
  await page.getByRole("button", { name: "Create lead", exact: true }).click();
  await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expectLeadDetailLoaded(page, data.name);
}

export async function saveLeadChanges(page: Page) {
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expect(page.getByText("Leads / Detail")).toBeVisible();
}

/**
 * Soft-delete from detail. Leaves an audit trail; the record disappears from
 * the list. Caller must already be on a matching lead detail page.
 */
export async function softDeleteLead(page: Page) {
  await deleteButton(page).click();
  await expect(deleteDialog(page)).toBeVisible();
  await confirmDeleteButton(page).click();
  await expect(page).toHaveURL(/\/leads\/?(\?.*)?$/, { timeout: 20_000 });
  await expect(leadsHeading(page)).toBeVisible();
}

export async function expectLeadAbsentFromList(page: Page, name: string) {
  await openLeads(page);
  await searchLeads(page, name);
  await expect(leadContactLink(page, name)).toHaveCount(0);
}

export async function changeLeadStatus(page: Page, statusLabel: string) {
  await detailStatusSelect(page).selectOption({ label: statusLabel });
  await expect
    .poll(
      async () =>
        (
          (await detailStatusSelect(page).locator("option:checked").innerText()) ??
          ""
        ).trim(),
      { timeout: 15_000 },
    )
    .toBe(statusLabel);
}

export async function reassignLead(page: Page, assigneeLabel: string) {
  await assignedToSelect(page).selectOption({ label: assigneeLabel });
  await reassignButton(page).click();
  await expectLeadDetailLoaded(page);
}

export async function addFollowUp(
  page: Page,
  data: { type: string; nextAt: string; notes: string },
) {
  await followupTypeInput(page).fill(data.type);
  await nextFollowupAtInput(page).fill(data.nextAt);
  await followupNotesInput(page).fill(data.notes);
  await addFollowupButton(page).click();
  await expectLeadDetailLoaded(page);
  await expect(main(page).getByText(data.notes)).toBeVisible({
    timeout: 15_000,
  });
}

export async function addCallback(
  page: Page,
  data: { status?: string; scheduledAt: string; remarks: string },
) {
  if (data.status !== undefined) {
    await callbackStatusInput(page).fill(data.status);
  }
  await scheduledAtInput(page).fill(data.scheduledAt);
  await callbackRemarksInput(page).fill(data.remarks);
  await addCallbackButton(page).click();
  await expectLeadDetailLoaded(page);
  await expect(main(page).getByText(data.remarks)).toBeVisible({
    timeout: 15_000,
  });
}

export async function logCommunication(
  page: Page,
  data: {
    channel?: string;
    direction?: string;
    status?: string;
    message: string;
  },
) {
  if (data.channel !== undefined) {
    await channelInput(page).fill(data.channel);
  }
  if (data.direction !== undefined) {
    await directionSelect(page).selectOption(data.direction);
  }
  if (data.status !== undefined) {
    await commStatusInput(page).fill(data.status);
  }
  await commMessageInput(page).fill(data.message);
  await logCommunicationButton(page).click();
  await expectLeadDetailLoaded(page);
  await expect(main(page).getByText(data.message)).toBeVisible({
    timeout: 15_000,
  });
}

export async function uploadLeadAttachment(
  page: Page,
  filePath: string = QA_PROJECT_BROCHURE,
) {
  await uploadMediaFile(page, LEAD_ATTACHMENT_SLOT, filePath);
  await expectMediaUploaded(page, LEAD_ATTACHMENT_SLOT, "qa-brochure.pdf", {
    expectImage: false,
  });
}

/**
 * Soft-delete every lead whose Contact name is exactly `name`. Re-checks the
 * detail heading before each delete so other contacts cannot be removed.
 */
export async function deleteLeadsNamed(page: Page, name: string) {
  await openLeads(page);
  await searchLeads(page, name);

  const hrefs = await collectLeadHrefsForContact(page, name);
  let deleted = 0;

  for (const href of hrefs) {
    await page.goto(href);
    await expect(page).toHaveURL(new RegExp(`/leads/[0-9a-f-]+`, "i"));
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    const heading = page.getByRole("heading", { name, exact: true });
    if ((await heading.count()) === 0) {
      continue;
    }
    await expect(heading).toBeVisible();
    if ((await deleteButton(page).count()) === 0) {
      continue;
    }
    await softDeleteLead(page);
    deleted += 1;
  }

  return deleted;
}

export async function expectNoLeadsNamed(page: Page, name: string) {
  await openLeads(page);
  await searchLeads(page, name);
  const remaining = await leadContactLink(page, name).count();
  expect(remaining).toBe(0);
}

/** Best-effort cleanup if a prior step left a QA lead on the list. */
export async function cleanupQaLeadByName(page: Page, name: string) {
  await deleteLeadsNamed(page, name);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
