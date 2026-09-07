import { expect, type Page } from "@playwright/test";
import {
  QA_LEAD_PROJECT,
  cleanupQaLeadByName,
  createLead,
  futureDateTimeLocal,
  isDisposableContactName,
  uniqueQaLeadName,
} from "./leadsPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Site visits helpers for https://propcatch-admin.vercel.app/site-visits
 *
 * Verified 2026-09-07 against the live Admin portal:
 * - "Module 10 — Site Visits" — scheduled visits, latest first.
 * - Filters auto-apply via URL query params (no Apply button):
 *   status (#filter-status → ?status=<snake_case>), project (#filter-project
 *   → ?project=<uuid>), from/to dates (#filter-from / #filter-to).
 *   "Clear" returns to /site-visits.
 * - "Status legend" (data-testid="site-visit-legend-toggle") expands a region
 *   (data-testid="site-visit-legend") explaining each status.
 * - Table: Scheduled (link → /site-visits/:id) · Contact (link → /leads/:id)
 *   · Project (link → /projects/:id) · Status · Visited.
 * - Create /site-visits/new: Lead *, Scheduled at *, Status * (datalist,
 *   defaults to "scheduled"), Visited at and Remarks optional. Lands on
 *   /site-visits/:id. Edit is /site-visits/:id/edit; the lead select is locked.
 * - Detail: "Site visits / Detail", heading "Visit · {contact}", inline status
 *   <select name="status">, Edit. Cards: Visit (Scheduled / Visited / Status /
 *   Lead status / Remarks) and Lead (Contact / Phone / Project). There is no
 *   row-level or detail delete in the portal.
 *
 * Create / edit only disposable QA Autotest visits (via a QA lead). Never
 * mutate seeded visits. Soft-delete the QA lead on cleanup; cancel the visit
 * when a detail page is still reachable.
 */

export { QA_LEAD_PROJECT, futureDateTimeLocal, uniqueQaLeadName };

export const QA_VISIT_PROJECT = QA_LEAD_PROJECT;

export const VISIT_STATUS_VALUES = [
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "no_show",
] as const;

export const VISIT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
  no_show: "No Show",
};

/** Copy shown by the Status legend panel on the list page. */
export const STATUS_LEGEND = [
  {
    label: "Scheduled",
    meaning: "Booked; not yet confirmed with the visitor.",
  },
  {
    label: "Confirmed",
    meaning: "Visitor confirmed they will attend.",
  },
  {
    label: "Rescheduled",
    meaning: "Moved to a different date/time; open again.",
  },
  {
    label: "No show",
    meaning: "Slot passed; visitor did not arrive.",
  },
  {
    label: "Cancelled",
    meaning: "Called off; will not be rescheduled.",
  },
  {
    label: "Completed",
    meaning: "Visit happened; follow-up captured on the lead.",
  },
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function siteVisitsHeading(page: Page) {
  return page.getByRole("heading", { name: "Site visits", exact: true });
}

export function siteVisitsModuleLabel(page: Page) {
  return main(page).getByText("Module 10 — Site Visits", { exact: true });
}

export function siteVisitsSubtitle(page: Page) {
  return main(page).getByText(
    "Scheduled visits, ordered by date — latest first.",
  );
}

export function newVisitLink(page: Page) {
  return main(page).getByRole("link", { name: "+ Schedule visit", exact: true });
}

export function newVisitHeading(page: Page) {
  return page.getByRole("heading", { name: "Schedule site visit", exact: true });
}

export function editVisitHeading(page: Page) {
  return page.getByRole("heading", { name: "Edit site visit", exact: true });
}

/* ---- List filters / legend ---- */

export function filterStatusSelect(page: Page) {
  return page.locator("#filter-status");
}

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function filterFromInput(page: Page) {
  return page.locator("#filter-from");
}

export function filterToInput(page: Page) {
  return page.locator("#filter-to");
}

export function clearFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Clear", exact: true });
}

export function statusLegendToggle(page: Page) {
  return page.getByTestId("site-visit-legend-toggle");
}

export function statusLegend(page: Page) {
  return page.getByTestId("site-visit-legend");
}

/* ---- Table ---- */

export function siteVisitsTable(page: Page) {
  return main(page).getByRole("table");
}

export function visitRows(page: Page) {
  return siteVisitsTable(page).locator("tbody tr");
}

export function visitScheduledLinks(page: Page) {
  return siteVisitsTable(page).locator('a[href*="/site-visits/"]').filter({
    hasNot: page.locator('[href="/site-visits/new"]'),
  });
}

export function visitContactLinks(page: Page) {
  return siteVisitsTable(page).locator('a[href*="/leads/"]');
}

export function visitContactLink(page: Page, name: string) {
  return visitContactLinks(page).filter({
    hasText: new RegExp(`^${escapeRegExp(name)}$`),
  });
}

export function visitProjectLinks(page: Page) {
  return siteVisitsTable(page).locator('a[href*="/projects/"]');
}

export function visitRowByContact(page: Page, name: string) {
  return visitRows(page).filter({
    has: page.getByRole("link", { name, exact: true }),
  });
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

/* ---- Create / edit form ---- */

export function leadSelect(page: Page) {
  return page.locator("#enquiry_id");
}

export function scheduledAtInput(page: Page) {
  return page.locator("#scheduled_at");
}

export function visitedAtInput(page: Page) {
  return page.locator("#visited_at");
}

export function statusInput(page: Page) {
  return page.locator("#status");
}

export function remarksInput(page: Page) {
  return page.locator("#remarks");
}

export function scheduleVisitButton(page: Page) {
  return page.getByRole("button", { name: /^Schedule visit$|^Saving/ });
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

/* ---- Detail chrome ---- */

export function editLink(page: Page) {
  return main(page).getByRole("link", { name: "Edit", exact: true });
}

export function detailStatusSelect(page: Page) {
  return main(page).locator('select[name="status"]').first();
}

export function visitFieldLabel(page: Page, name: string) {
  return main(page).locator("dt").filter({
    hasText: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  });
}

export function visitOverviewHeading(page: Page) {
  return main(page).getByText("Visit", { exact: true });
}

export function leadCardHeading(page: Page) {
  return main(page).getByText("Lead", { exact: true });
}

export function visitStatusBadge(page: Page) {
  return main(page)
    .locator("div.rounded-full")
    .filter({
      hasText:
        /^(Scheduled|Confirmed|Completed|Rescheduled|Cancelled|No Show)$/,
    })
    .first();
}

export function detailLeadLink(page: Page) {
  return main(page).locator('a[href*="/leads/"]').first();
}

export function detailProjectLink(page: Page) {
  return main(page).locator('a[href*="/projects/"]').first();
}

export function visitDetailHeading(page: Page, contactName: string) {
  return page.getByRole("heading", {
    name: `Visit · ${contactName}`,
    exact: true,
  });
}

/* ---- Navigation helpers ---- */

export async function openSiteVisits(page: Page) {
  await page.goto("/site-visits");
  await expectSiteVisitsListLoaded(page);
}

export async function expectSiteVisitsListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/site-visits\/?(\?.*)?$/);
  await expect(siteVisitsHeading(page)).toBeVisible();
  await expect(siteVisitsSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function expectVisitDetailLoaded(page: Page, contactName?: string) {
  await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+/i);
  await expect(page).not.toHaveURL(/\/(new|edit)\/?$/);
  await expect(page.getByText("Site visits / Detail")).toBeVisible();
  if (contactName) {
    await expect(visitDetailHeading(page, contactName)).toBeVisible();
  }
}

export async function openNewSiteVisit(page: Page) {
  await page.goto("/site-visits/new");
  await expect(page).toHaveURL(/\/site-visits\/new/);
  await expect(newVisitHeading(page)).toBeVisible();
}

export async function openEditVisit(page: Page) {
  await editLink(page).click();
  await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+\/edit$/i);
  await expect(editVisitHeading(page)).toBeVisible();
}

export async function openStatusLegend(page: Page) {
  await expect(statusLegendToggle(page)).toBeVisible();
  if ((await statusLegend(page).count()) > 0) {
    await expect(statusLegend(page)).toBeVisible();
    return;
  }
  await statusLegendToggle(page).click();
  await expect(statusLegend(page)).toBeVisible();
  await expect(statusLegendToggle(page)).toHaveAttribute(
    "aria-expanded",
    "true",
  );
}

/**
 * Applies list filters. Each control auto-applies via URL query params
 * (status, project, from, to).
 */
export async function applySiteVisitFilters(
  page: Page,
  filters: {
    status?: string;
    project?: string;
    from?: string;
    to?: string;
  },
) {
  if (filters.status !== undefined) {
    await filterStatusSelect(page).selectOption(filters.status);
    await expect(page).toHaveURL(/[?&]status=/, { timeout: 15_000 });
  }
  if (filters.project !== undefined) {
    await filterProjectSelect(page).selectOption({ label: filters.project });
    await expect(page).toHaveURL(/[?&]project=/, { timeout: 15_000 });
  }
  if (filters.from !== undefined) {
    await filterFromInput(page).fill(filters.from);
    await expect(page).toHaveURL(/[?&]from=/, { timeout: 15_000 });
  }
  if (filters.to !== undefined) {
    await filterToInput(page).fill(filters.to);
    await expect(page).toHaveURL(/[?&]to=/, { timeout: 15_000 });
  }
  await expectSiteVisitsListLoaded(page);
}

export async function clearSiteVisitFilters(page: Page) {
  await clearFiltersButton(page).click();
  await expect(page).toHaveURL(/\/site-visits\/?$/, { timeout: 15_000 });
  await expectSiteVisitsListLoaded(page);
}

/* ---- Row collection ---- */

async function collectColumnText(page: Page, columnIndex: number) {
  const rows = visitRows(page);
  const count = await rows.count();
  const values: string[] = [];

  for (let i = 0; i < count; i++) {
    const cell = rows.nth(i).locator("td").nth(columnIndex);
    if ((await cell.count()) === 0) {
      continue;
    }
    const text = (await cell.innerText()).trim();
    if (text) {
      values.push(text);
    }
  }

  return values;
}

export async function collectVisitContactsOnPage(page: Page) {
  const links = visitContactLinks(page);
  const count = await links.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push((await links.nth(i).innerText()).trim());
  }
  return names;
}

export async function collectVisitProjects(page: Page) {
  const links = visitProjectLinks(page);
  const count = await links.count();
  const projects: string[] = [];
  for (let i = 0; i < count; i++) {
    projects.push((await links.nth(i).innerText()).trim());
  }
  return projects;
}

export async function collectVisitStatuses(page: Page) {
  return collectColumnText(page, 3);
}

export async function collectVisitScheduledDates(page: Page) {
  const scheduled = await collectColumnText(page, 0);
  return scheduled.map((value) => value.slice(0, 10));
}

/** First list row whose contact is not a leftover tester / QA record. */
export async function findSeededVisitRow(page: Page) {
  const rows = visitRows(page);
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const contact = row.locator('a[href*="/leads/"]').first();
    if ((await contact.count()) === 0) {
      continue;
    }
    const name = (await contact.innerText()).trim();
    if (isDisposableContactName(name)) {
      continue;
    }
    const scheduled = row.locator('a[href*="/site-visits/"]').first();
    const project = row.locator('a[href*="/projects/"]').first();
    const href = (await scheduled.getAttribute("href")) ?? "";
    if (!href || /\/site-visits\/new/.test(href)) {
      continue;
    }
    return {
      row,
      name,
      href,
      scheduled,
      contact,
      project,
      projectName: (await project.innerText()).trim(),
    };
  }

  return null;
}

export async function selectLeadByContactName(page: Page, name: string) {
  const option = leadSelect(page).locator("option").filter({ hasText: name });
  await expect(option).toHaveCount(1, { timeout: 15_000 });
  const value = await option.first().getAttribute("value");
  if (!value) {
    throw new Error(`Lead option for ${name} has no value`);
  }
  await leadSelect(page).selectOption(value);
}

export async function createSiteVisit(
  page: Page,
  data: {
    leadName: string;
    scheduledAt?: string;
    visitedAt?: string;
    status?: string;
    remarks?: string;
  },
) {
  await openNewSiteVisit(page);
  await selectLeadByContactName(page, data.leadName);
  await scheduledAtInput(page).fill(data.scheduledAt ?? futureDateTimeLocal());
  if (data.visitedAt !== undefined) {
    await visitedAtInput(page).fill(data.visitedAt);
  }
  if (data.status !== undefined) {
    await statusInput(page).fill(data.status);
  }
  if (data.remarks !== undefined) {
    await remarksInput(page).fill(data.remarks);
  }
  await page.getByRole("button", { name: "Schedule visit", exact: true }).click();
  await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expectVisitDetailLoaded(page, data.leadName);
}

export async function createQaLeadAndVisit(
  page: Page,
  data: {
    remarks?: string;
    status?: string;
    scheduledAt?: string;
    visitedAt?: string;
    userId?: string;
  } = {},
) {
  const { userId, ...visitData } = data;
  const leadName = uniqueQaLeadName();
  await createLead(page, {
    name: leadName,
    project: QA_VISIT_PROJECT,
    userId,
  });
  await createSiteVisit(page, {
    leadName,
    ...visitData,
  });
  return leadName;
}

export async function saveVisitChanges(page: Page) {
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+$/i, { timeout: 20_000 });
  await expect(page.getByText("Site visits / Detail")).toBeVisible();
}

export async function changeVisitStatus(page: Page, statusValue: string) {
  await detailStatusSelect(page).selectOption(statusValue);
  await expect
    .poll(async () => (await detailStatusSelect(page).inputValue()) ?? "", {
      timeout: 15_000,
    })
    .toBe(statusValue);
  const label = VISIT_STATUS_LABELS[statusValue] ?? statusValue;
  await expect(visitStatusBadge(page)).toHaveText(label, { timeout: 15_000 });
}

/**
 * Best-effort cleanup: cancel the visit when still on its detail page, then
 * soft-delete the QA lead. The portal has no visit delete action.
 */
export async function cleanupQaVisitByContact(page: Page, name: string) {
  const url = page.url();
  if (
    /\/site-visits\/[0-9a-f-]+/i.test(url) &&
    !/\/(new|edit)\/?(\?|$)/.test(url)
  ) {
    if ((await detailStatusSelect(page).count()) > 0) {
      await changeVisitStatus(page, "cancelled").catch(() => undefined);
    }
  } else {
    await openSiteVisits(page);
    const row = visitRowByContact(page, name).first();
    if ((await row.count()) > 0) {
      await row.locator('a[href*="/site-visits/"]').first().click();
      await expectVisitDetailLoaded(page, name);
      await changeVisitStatus(page, "cancelled").catch(() => undefined);
    }
  }
  await cleanupQaLeadByName(page, name);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
