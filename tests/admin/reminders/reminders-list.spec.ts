import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  FILTER_CHIP_LABELS,
  REMINDER_FILTERS,
  callbackRows,
  collectRowDueLines,
  collectRowStatuses,
  expectFilterChipActive,
  filterChip,
  filterChipCount,
  findSeededReminderRow,
  followupRows,
  nothingDueToday,
  nothingUpcoming,
  openReminders,
  overdueSection,
  reminderRows,
  remindersHeading,
  remindersModuleLabel,
  remindersSubtitle,
  rowContactLink,
  rowDueLine,
  rowStatusBadge,
  rowTypeBadge,
  todaySection,
  upcomingSection,
} from "../../../pages/admin/remindersPage";

test.describe("Admin Reminders list", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openReminders(page);
  });

  test("ADMIN-REM-001 — reminders list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(remindersHeading(page)).toBeVisible();
    await expect(remindersModuleLabel(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Reminders");
  });

  test("ADMIN-REM-002 — subtitle explains follow-ups, callbacks, and lead click", async ({
    page,
  }) => {
    await expect(remindersSubtitle(page)).toBeVisible();
  });

  test("ADMIN-REM-003 — filter chips are visible with counts @smoke", async ({
    page,
  }) => {
    for (const filter of REMINDER_FILTERS) {
      const chip = filterChip(page, filter);
      await expect(chip).toBeVisible();
      await expect(chip).toContainText(FILTER_CHIP_LABELS[filter]);
      expect(await filterChipCount(page, filter)).toBeGreaterThanOrEqual(0);
    }
    await expectFilterChipActive(page, "all");
  });

  test("ADMIN-REM-004 — list is grouped into Overdue, Due today, and Upcoming", async ({
    page,
  }) => {
    await expect(overdueSection(page)).toBeVisible();
    await expect(overdueSection(page)).toContainText("Overdue");
    await expect(todaySection(page)).toBeVisible();
    await expect(todaySection(page)).toContainText("Due today");
    await expect(upcomingSection(page)).toBeVisible();
    await expect(upcomingSection(page)).toContainText("Upcoming (next 7 days)");

    const todayCount = await todaySection(page).locator("li").count();
    if (todayCount === 0) {
      await expect(nothingDueToday(page)).toBeVisible();
    }
    const upcomingCount = await upcomingSection(page).locator("li").count();
    if (upcomingCount === 0) {
      await expect(nothingUpcoming(page)).toBeVisible();
    }
  });

  test("ADMIN-REM-005 — each row shows contact, type, status, project, and due @smoke", async ({
    page,
  }) => {
    expect(await reminderRows(page).count()).toBeGreaterThan(0);

    const sampleCount = Math.min(await reminderRows(page).count(), 5);
    for (let i = 0; i < sampleCount; i++) {
      const row = reminderRows(page).nth(i);
      const contact = rowContactLink(row);
      await expect(contact).toBeVisible();
      await expect(contact).toHaveAttribute("href", /\/leads\/[0-9a-f-]+/i);

      const type = (await rowTypeBadge(row).innerText()).trim();
      expect(["Followup", "Callback"]).toContain(type);

      const status = (await rowStatusBadge(row).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);

      const due = (await rowDueLine(row).innerText()).replace(/\s+/g, " ");
      expect(due).toMatch(/· Due /);
    }
  });

  test("ADMIN-REM-006 — follow-up and callback rows expose their statuses", async ({
    page,
  }) => {
    const followups = await followupRows(page).count();
    const callbacks = await callbackRows(page).count();
    expect(followups + callbacks).toBeGreaterThan(0);

    if (followups > 0) {
      const row = followupRows(page).first();
      await expect(rowTypeBadge(row)).toHaveText("Followup");
      const status = (await rowStatusBadge(row).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);
      await expect(row).toHaveAttribute(
        "data-testid",
        /^reminders-row-followup:[0-9a-f-]+$/i,
      );
    }

    if (callbacks > 0) {
      const row = callbackRows(page).first();
      await expect(rowTypeBadge(row)).toHaveText("Callback");
      const status = (await rowStatusBadge(row).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);
      await expect(row).toHaveAttribute(
        "data-testid",
        /^reminders-row-callback:[0-9a-f-]+$/i,
      );
    }

    const statuses = await collectRowStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    const dues = await collectRowDueLines(page);
    expect(dues.length).toBe(statuses.length);
  });

  test("ADMIN-REM-007 — All chip count matches visible rows and kind chips", async ({
    page,
  }) => {
    const all = await filterChipCount(page, "all");
    const followups = await filterChipCount(page, "followups");
    const callbacks = await filterChipCount(page, "callbacks");
    const overdue = await filterChipCount(page, "overdue");
    const today = await filterChipCount(page, "due-today");
    const upcoming = await filterChipCount(page, "upcoming");

    expect(await reminderRows(page).count()).toBe(all);
    expect(await followupRows(page).count()).toBe(followups);
    expect(await callbackRows(page).count()).toBe(callbacks);
    expect(followups + callbacks).toBe(all);
    expect(overdue + today + upcoming).toBe(all);
    expect(await overdueSection(page).locator("li").count()).toBe(overdue);
    expect(await todaySection(page).locator("li").count()).toBe(today);
    expect(await upcomingSection(page).locator("li").count()).toBe(upcoming);
  });

  test("ADMIN-REM-008 — reminders list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expect(remindersHeading(page)).toBeVisible();
    await expect(remindersModuleLabel(page)).toBeVisible();
    await expectFilterChipActive(page, "all");
  });

  test("ADMIN-REM-009 — a seeded row keeps a lead href without mutating it", async ({
    page,
  }) => {
    const seeded = await findSeededReminderRow(page);
    expect(seeded).not.toBeNull();
    const { name, href, type, status, due } = seeded!;

    expect(href).toMatch(/\/leads\/[0-9a-f-]+/i);
    expect(["Followup", "Callback"]).toContain(type);
    expect(status.length).toBeGreaterThan(0);
    expect(due).toMatch(/· Due /);
    await expect(
      page.getByRole("link", { name, exact: true }).first(),
    ).toHaveAttribute("href", href);
    // Do not click through or complete seeded reminders here.
  });
});
