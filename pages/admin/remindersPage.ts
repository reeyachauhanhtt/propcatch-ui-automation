import { expect, type Page } from "@playwright/test";
import {
  QA_LEAD_PROJECT,
  addCallback,
  addFollowUp,
  cleanupQaLeadByName,
  createLead,
  futureDateTimeLocal,
  isDisposableContactName,
  logCommunication,
  uniqueQaLeadName,
} from "./leadsPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Reminders helpers for https://propcatch-admin.vercel.app/reminders
 *
 * Verified 2026-09-07 against the live Admin portal:
 * - "Module 14 — Follow-up reminders" — follow-ups + pending callbacks on
 *   open leads, grouped by urgency. There is no create form on this page.
 * - Filter chips (data-testid="reminders-filter-chips") are links, not
 *   buttons. They switch via ?filter=:
 *     overdue | due-today | upcoming | callbacks | followups
 *   "All" is /reminders (no query). An unknown filter falls back to All.
 *   Active chip uses bg-primary. Chip counts stay visible on every tab.
 * - Sections (only those in the current filter render):
 *     data-testid="reminders-section-overdue"  heading "Overdue"
 *     data-testid="reminders-section-today"    heading "Due today"
 *     data-testid="reminders-section-upcoming" heading "Upcoming (next 7 days)"
 *   Empty copy: "Nothing due today." / "Nothing scheduled in the next week."
 * - Rows are <li data-testid="reminders-row-followup:{id}"> or
 *   reminders-row-callback:{id}. Each shows Contact (link → /leads/:id),
 *   type badge (Followup | Callback), status/kind badge (Call, Call Overdue,
 *   Pending, …), "{project} · Due {datetime}", and optional quoted notes.
 * - Communication logs are not reminder rows — only open follow-ups and
 *   pending callbacks. Completing either on the lead detail page drops it
 *   from this list.
 *
 * Create activity only on disposable QA Autotest leads. Never mark seeded
 * follow-ups or callbacks completed.
 */

export { QA_LEAD_PROJECT, futureDateTimeLocal, uniqueQaLeadName };

export const REMINDER_FILTERS = [
  "all",
  "overdue",
  "due-today",
  "upcoming",
  "callbacks",
  "followups",
] as const;

export type ReminderFilter = (typeof REMINDER_FILTERS)[number];

export const FILTER_CHIP_LABELS: Record<ReminderFilter, string> = {
  all: "All",
  overdue: "Overdue",
  "due-today": "Due today",
  upcoming: "Upcoming",
  callbacks: "Callbacks",
  followups: "Follow-ups",
};

export const FILTERED_LABELS: Partial<Record<ReminderFilter, string>> = {
  overdue: "Filtered: Overdue.",
  "due-today": "Filtered: Due today.",
  upcoming: "Filtered: Upcoming.",
  callbacks: "Filtered: Callbacks.",
  followups: "Filtered: Follow-ups.",
};

export function main(page: Page) {
  return page.getByRole("main");
}

export function remindersHeading(page: Page) {
  return page.getByRole("heading", { name: "Reminders", exact: true });
}

export function remindersModuleLabel(page: Page) {
  return main(page).getByText("Module 14 — Follow-up reminders", {
    exact: true,
  });
}

export function remindersSubtitle(page: Page) {
  return main(page).getByText(
    "Follow-ups + pending callbacks across all open leads. Grouped by urgency; click a lead to open its detail page.",
  );
}

export function filteredLabel(page: Page, filter: ReminderFilter) {
  const copy = FILTERED_LABELS[filter];
  if (!copy) {
    throw new Error(`Filter ${filter} has no "Filtered:" label`);
  }
  return main(page).getByText(copy, { exact: true });
}

/* ---- Filter chips ---- */

export function filterChips(page: Page) {
  return page.getByTestId("reminders-filter-chips");
}

export function filterChipHref(filter: ReminderFilter) {
  return filter === "all" ? "/reminders" : `/reminders?filter=${filter}`;
}

export function filterChip(page: Page, filter: ReminderFilter) {
  return filterChips(page).locator(`a[href="${filterChipHref(filter)}"]`);
}

export async function filterChipCount(page: Page, filter: ReminderFilter) {
  const text = (await filterChip(page, filter).innerText()).replace(/\s+/g, " ");
  const match = text.match(/(\d+)\s*$/);
  if (!match) {
    throw new Error(`No count on ${filter} chip: "${text}"`);
  }
  return Number(match[1]);
}

export async function expectFilterChipActive(
  page: Page,
  filter: ReminderFilter,
) {
  const chip = filterChip(page, filter);
  await expect(chip).toBeVisible();
  await expect(chip).toHaveClass(/bg-primary/);
}

/* ---- Sections / empty states ---- */

export function overdueSection(page: Page) {
  return page.getByTestId("reminders-section-overdue");
}

export function todaySection(page: Page) {
  return page.getByTestId("reminders-section-today");
}

export function upcomingSection(page: Page) {
  return page.getByTestId("reminders-section-upcoming");
}

export function reminderSection(page: Page, key: "overdue" | "today" | "upcoming") {
  if (key === "overdue") {
    return overdueSection(page);
  }
  if (key === "today") {
    return todaySection(page);
  }
  return upcomingSection(page);
}

export function nothingDueToday(page: Page) {
  return main(page).getByText("Nothing due today.", { exact: true });
}

export function nothingUpcoming(page: Page) {
  return main(page).getByText("Nothing scheduled in the next week.", {
    exact: true,
  });
}

/* ---- Rows ---- */

export function reminderRows(page: Page) {
  return main(page).locator('li[data-testid^="reminders-row-"]');
}

export function followupRows(page: Page) {
  return main(page).locator('li[data-testid^="reminders-row-followup"]');
}

export function callbackRows(page: Page) {
  return main(page).locator('li[data-testid^="reminders-row-callback"]');
}

export function reminderRowByContact(page: Page, name: string) {
  return reminderRows(page).filter({
    has: page.getByRole("link", { name, exact: true }),
  });
}

export function reminderRowByNotes(page: Page, notes: string) {
  return reminderRows(page).filter({ hasText: notes });
}

export function followupRowByNotes(page: Page, notes: string) {
  return followupRows(page).filter({ hasText: notes });
}

export function callbackRowByRemarks(page: Page, remarks: string) {
  return callbackRows(page).filter({ hasText: remarks });
}

export function rowContactLink(row: ReturnType<typeof reminderRows>) {
  return row.locator('a[href*="/leads/"]').first();
}

export function rowTypeBadge(row: ReturnType<typeof reminderRows>) {
  return row.locator("div.rounded-full").first();
}

export function rowStatusBadge(row: ReturnType<typeof reminderRows>) {
  return row.locator("div.rounded-full").nth(1);
}

export function rowDueLine(row: ReturnType<typeof reminderRows>) {
  return row.locator("div.text-xs").last();
}

/* ---- Navigation ---- */

export async function openReminders(page: Page, filter?: ReminderFilter) {
  const path =
    !filter || filter === "all" ? "/reminders" : `/reminders?filter=${filter}`;
  await page.goto(path);
  await expectRemindersListLoaded(page, filter ?? "all");
}

export async function expectRemindersListLoaded(
  page: Page,
  filter: ReminderFilter = "all",
) {
  if (filter === "all") {
    await expect(page).toHaveURL(/\/reminders\/?(\?.*)?$/);
    await expect(page).not.toHaveURL(/[?&]filter=(overdue|due-today|upcoming|callbacks|followups)/);
  } else {
    await expect(page).toHaveURL(new RegExp(`[?&]filter=${filter}`));
  }
  await expect(remindersHeading(page)).toBeVisible();
  await expect(remindersModuleLabel(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function applyReminderFilter(page: Page, filter: ReminderFilter) {
  await filterChip(page, filter).click();
  if (filter === "all") {
    await expect(page).toHaveURL(/\/reminders\/?$/, { timeout: 15_000 });
  } else {
    await expect(page).toHaveURL(new RegExp(`[?&]filter=${filter}`), {
      timeout: 15_000,
    });
  }
  await expectRemindersListLoaded(page, filter);
  await expectFilterChipActive(page, filter);
}

/* ---- Row collection ---- */

export async function collectReminderContacts(page: Page) {
  const rows = reminderRows(page);
  const count = await rows.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push((await rowContactLink(rows.nth(i)).innerText()).trim());
  }
  return names;
}

export async function collectRowKinds(page: Page) {
  const rows = reminderRows(page);
  const count = await rows.count();
  const kinds: string[] = [];
  for (let i = 0; i < count; i++) {
    kinds.push((await rowTypeBadge(rows.nth(i)).innerText()).trim());
  }
  return kinds;
}

export async function collectRowStatuses(page: Page) {
  const rows = reminderRows(page);
  const count = await rows.count();
  const statuses: string[] = [];
  for (let i = 0; i < count; i++) {
    statuses.push((await rowStatusBadge(rows.nth(i)).innerText()).trim());
  }
  return statuses;
}

export async function collectRowDueLines(page: Page) {
  const rows = reminderRows(page);
  const count = await rows.count();
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const line = rowDueLine(rows.nth(i));
    if ((await line.count()) === 0) {
      continue;
    }
    lines.push((await line.innerText()).replace(/\s+/g, " ").trim());
  }
  return lines;
}

/** First reminder row whose contact is not a leftover tester / QA record. */
export async function findSeededReminderRow(
  page: Page,
  kind?: "followup" | "callback",
) {
  const rows = kind === "callback" ? callbackRows(page) : kind === "followup" ? followupRows(page) : reminderRows(page);
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const contact = rowContactLink(row);
    if ((await contact.count()) === 0) {
      continue;
    }
    const name = (await contact.innerText()).trim();
    if (isDisposableContactName(name)) {
      continue;
    }
    const href = (await contact.getAttribute("href")) ?? "";
    if (!/\/leads\/[0-9a-f-]+/i.test(href)) {
      continue;
    }
    return {
      row,
      name,
      href,
      contact,
      type: (await rowTypeBadge(row).innerText()).trim(),
      status: (await rowStatusBadge(row).innerText()).trim(),
      due: (await rowDueLine(row).innerText()).replace(/\s+/g, " ").trim(),
      testId: (await row.getAttribute("data-testid")) ?? "",
    };
  }

  return null;
}

export async function expectReminderRowVisible(
  page: Page,
  data: { name: string; notes?: string; kind?: "Followup" | "Callback" },
) {
  const row = data.notes
    ? reminderRowByNotes(page, data.notes)
    : reminderRowByContact(page, data.name);
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(rowContactLink(row)).toHaveText(data.name);
  if (data.kind) {
    await expect(rowTypeBadge(row)).toHaveText(data.kind);
  }
  return row;
}

export async function expectReminderAbsent(
  page: Page,
  notes: string,
) {
  await openReminders(page);
  await expect(reminderRowByNotes(page, notes)).toHaveCount(0, {
    timeout: 20_000,
  });
}

/* ---- QA fixtures ---- */

export async function createQaLeadWithReminderActivity(
  page: Page,
  data: {
    followupNotes: string;
    callbackRemarks: string;
    followupAt?: string;
    callbackAt?: string;
  },
) {
  const name = uniqueQaLeadName("REM");
  await createLead(page, { name });
  await addFollowUp(page, {
    type: "call",
    nextAt: data.followupAt ?? futureDateTimeLocal(-1),
    notes: data.followupNotes,
  });
  await addCallback(page, {
    status: "pending",
    scheduledAt: data.callbackAt ?? futureDateTimeLocal(3),
    remarks: data.callbackRemarks,
  });
  return name;
}

export async function cleanupQaReminderLead(page: Page, name: string) {
  await cleanupQaLeadByName(page, name);
}

export { logCommunication };
