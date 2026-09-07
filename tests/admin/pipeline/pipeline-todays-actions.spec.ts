import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  TODAYS_ACTIONS,
  expectRemindersFilterApplied,
  openPipeline,
  todaysActionLink,
  todaysActionsHeading,
} from "../../../pages/admin/pipelinePage";

test.describe("Admin Pipeline Today's actions → Reminders", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openPipeline(page);
    await expect(todaysActionsHeading(page)).toBeVisible();
  });

  test("ADMIN-PIPE-050 — Today's action links are wired to reminder filters @smoke", async ({
    page,
  }) => {
    for (const action of TODAYS_ACTIONS) {
      const link = todaysActionLink(page, action.label);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", action.href);
    }
  });

  test("ADMIN-PIPE-051 — Overdue follow-ups opens Reminders with Overdue selected @smoke", async ({
    page,
  }) => {
    const action = TODAYS_ACTIONS[0];
    await todaysActionLink(page, action.label).click();
    await expectRemindersFilterApplied(page, action);
    await expectSidebarItemActive(page, "Reminders");
  });

  test("ADMIN-PIPE-052 — Due today opens Reminders with Due today selected", async ({
    page,
  }) => {
    const action = TODAYS_ACTIONS[1];
    await todaysActionLink(page, action.label).click();
    await expectRemindersFilterApplied(page, action);
    await expectSidebarItemActive(page, "Reminders");
  });

  test("ADMIN-PIPE-053 — Pending callbacks opens Reminders with Callbacks selected", async ({
    page,
  }) => {
    const action = TODAYS_ACTIONS[2];
    await todaysActionLink(page, action.label).click();
    await expectRemindersFilterApplied(page, action);
    await expectSidebarItemActive(page, "Reminders");
  });
});
