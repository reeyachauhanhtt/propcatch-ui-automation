import { test, expect } from "@playwright/test";
import {
  dashboardHeading,
  dashboardSubtitle,
  expectDashboardLoaded,
  expectFollowUpsSection,
  expectMetricCardsPresent,
  expectNoBrokenValues,
  expectQuickActionsPresent,
  expectUpcomingVisitsSection,
  followUpItemLinks,
  inventoryHeading,
  main,
  moduleEyebrow,
  noVisitsEmptyState,
  openDashboard,
  overdueBadges,
  quickActionsLabel,
  salesPipelineHeading,
} from "../../../pages/admin/dashboardPage";

test.describe("Admin Dashboard UI", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test("ADMIN-DASH-001 — dashboard loads with title, heading, and shell @smoke", async ({
    page,
  }) => {
    await expectDashboardLoaded(page);
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expect(moduleEyebrow(page)).toBeVisible();
  });

  test("ADMIN-DASH-002 — root / redirects authenticated admin to /dashboard", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(dashboardHeading(page)).toBeVisible();
  });

  test("ADMIN-DASH-003 — read-only subtitle and Inventory / Sales pipeline sections", async ({
    page,
  }) => {
    await expect(dashboardSubtitle(page)).toBeVisible();
    await expect(inventoryHeading(page)).toBeVisible();
    await expect(salesPipelineHeading(page)).toBeVisible();
  });

  test("ADMIN-DASH-004 — inventory and pipeline metric cards show numeric values", async ({
    page,
  }) => {
    await expectMetricCardsPresent(page);
  });

  test("ADMIN-DASH-005 — due follow-ups section lists overdue items or stays empty safely", async ({
    page,
  }) => {
    await expectFollowUpsSection(page);

    const items = followUpItemLinks(page);
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(10);

    if (count > 0) {
      await expect(items.first()).toBeVisible();
      await expect(overdueBadges(page).first()).toBeVisible();
      await expect(items.first()).toHaveAttribute("href", /\/leads\//);
    }
  });

  test("ADMIN-DASH-006 — upcoming site visits section is present", async ({
    page,
  }) => {
    await expectUpcomingVisitsSection(page);

    const empty = noVisitsEmptyState(page);
    if ((await empty.count()) > 0) {
      await expect(empty).toBeVisible();
      await expect(
        main(page).getByText("No site visits scheduled in the next 7 days."),
      ).toBeVisible();
    }
  });

  test("ADMIN-DASH-007 — Quick actions expose Add builder / project / unit / lead", async ({
    page,
  }) => {
    await expect(quickActionsLabel(page)).toBeVisible();
    await expectQuickActionsPresent(page);
  });

  test("ADMIN-DASH-008 — dashboard main content has no broken undefined/null/NaN values", async ({
    page,
  }) => {
    await expectNoBrokenValues(page);
  });

  test("ADMIN-DASH-009 — dashboard remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expectDashboardLoaded(page);
  });
});
