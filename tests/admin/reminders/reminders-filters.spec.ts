import { test, expect } from "@playwright/test";
import {
  applyReminderFilter,
  callbackRows,
  collectRowKinds,
  expectFilterChipActive,
  filterChip,
  filterChipCount,
  filteredLabel,
  followupRows,
  nothingDueToday,
  nothingUpcoming,
  openReminders,
  overdueSection,
  reminderRows,
  remindersSubtitle,
  todaySection,
  upcomingSection,
} from "../../../pages/admin/remindersPage";

test.describe("Admin Reminders tab switching and filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openReminders(page);
  });

  test("ADMIN-REM-020 — All is the default tab and has no filter query @smoke", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/reminders\/?$/);
    await expectFilterChipActive(page, "all");
    await expect(remindersSubtitle(page)).toBeVisible();
    await expect(overdueSection(page)).toBeVisible();
    await expect(todaySection(page)).toBeVisible();
    await expect(upcomingSection(page)).toBeVisible();
  });

  test("ADMIN-REM-021 — Overdue tab keeps only the overdue section @smoke", async ({
    page,
  }) => {
    await applyReminderFilter(page, "overdue");

    await expect(page).toHaveURL(/[?&]filter=overdue/);
    await expect(filteredLabel(page, "overdue")).toBeVisible();
    await expect(overdueSection(page)).toBeVisible();
    await expect(todaySection(page)).toHaveCount(0);
    await expect(upcomingSection(page)).toHaveCount(0);

    const expected = await filterChipCount(page, "overdue");
    expect(await reminderRows(page).count()).toBe(expected);
    expect(await overdueSection(page).locator("li").count()).toBe(expected);
  });

  test("ADMIN-REM-022 — Due today tab keeps only the today section", async ({
    page,
  }) => {
    await applyReminderFilter(page, "due-today");

    await expect(page).toHaveURL(/[?&]filter=due-today/);
    await expect(filteredLabel(page, "due-today")).toBeVisible();
    await expect(todaySection(page)).toBeVisible();
    await expect(overdueSection(page)).toHaveCount(0);
    await expect(upcomingSection(page)).toHaveCount(0);

    const expected = await filterChipCount(page, "due-today");
    expect(await reminderRows(page).count()).toBe(expected);
    if (expected === 0) {
      await expect(nothingDueToday(page)).toBeVisible();
    }
  });

  test("ADMIN-REM-023 — Upcoming tab keeps only the next-7-days section", async ({
    page,
  }) => {
    await applyReminderFilter(page, "upcoming");

    await expect(page).toHaveURL(/[?&]filter=upcoming/);
    await expect(filteredLabel(page, "upcoming")).toBeVisible();
    await expect(upcomingSection(page)).toBeVisible();
    await expect(overdueSection(page)).toHaveCount(0);
    await expect(todaySection(page)).toHaveCount(0);

    const expected = await filterChipCount(page, "upcoming");
    expect(await reminderRows(page).count()).toBe(expected);
    if (expected === 0) {
      await expect(nothingUpcoming(page)).toBeVisible();
    }
  });

  test("ADMIN-REM-024 — Callbacks tab lists only callback rows @smoke", async ({
    page,
  }) => {
    await applyReminderFilter(page, "callbacks");

    await expect(page).toHaveURL(/[?&]filter=callbacks/);
    await expect(filteredLabel(page, "callbacks")).toBeVisible();

    const expected = await filterChipCount(page, "callbacks");
    expect(await reminderRows(page).count()).toBe(expected);
    expect(await callbackRows(page).count()).toBe(expected);
    expect(await followupRows(page).count()).toBe(0);

    const kinds = await collectRowKinds(page);
    for (const kind of kinds) {
      expect(kind).toBe("Callback");
    }
  });

  test("ADMIN-REM-025 — Follow-ups tab lists only follow-up rows @smoke", async ({
    page,
  }) => {
    await applyReminderFilter(page, "followups");

    await expect(page).toHaveURL(/[?&]filter=followups/);
    await expect(filteredLabel(page, "followups")).toBeVisible();

    const expected = await filterChipCount(page, "followups");
    expect(await reminderRows(page).count()).toBe(expected);
    expect(await followupRows(page).count()).toBe(expected);
    expect(await callbackRows(page).count()).toBe(0);

    const kinds = await collectRowKinds(page);
    for (const kind of kinds) {
      expect(kind).toBe("Followup");
    }
  });

  test("ADMIN-REM-026 — switching chips updates the active tab style", async ({
    page,
  }) => {
    await applyReminderFilter(page, "callbacks");
    await expectFilterChipActive(page, "callbacks");
    await expect(filterChip(page, "all")).not.toHaveClass(/bg-primary/);

    await applyReminderFilter(page, "followups");
    await expectFilterChipActive(page, "followups");
    await expect(filterChip(page, "callbacks")).not.toHaveClass(/bg-primary/);
  });

  test("ADMIN-REM-027 — All chip clears the filter and restores every section @smoke", async ({
    page,
  }) => {
    await applyReminderFilter(page, "overdue");
    await expect(page).toHaveURL(/[?&]filter=overdue/);
    await expect(todaySection(page)).toHaveCount(0);

    await applyReminderFilter(page, "all");

    await expect(page).toHaveURL(/\/reminders\/?$/);
    await expect(remindersSubtitle(page)).toBeVisible();
    await expect(overdueSection(page)).toBeVisible();
    await expect(todaySection(page)).toBeVisible();
    await expect(upcomingSection(page)).toBeVisible();
    expect(await reminderRows(page).count()).toBe(
      await filterChipCount(page, "all"),
    );
  });

  test("ADMIN-REM-028 — unknown filter query falls back to All", async ({
    page,
  }) => {
    await page.goto("/reminders?filter=bogus");
    await expect(page).toHaveURL(/[?&]filter=bogus/);
    await expectFilterChipActive(page, "all");
    await expect(remindersSubtitle(page)).toBeVisible();
    await expect(overdueSection(page)).toBeVisible();
    await expect(todaySection(page)).toBeVisible();
    await expect(upcomingSection(page)).toBeVisible();
  });
});
