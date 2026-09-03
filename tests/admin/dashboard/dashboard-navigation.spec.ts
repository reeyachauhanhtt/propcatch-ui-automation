import { test, expect } from "@playwright/test";
import {
  INVENTORY_METRICS,
  PIPELINE_METRICS,
  QUICK_ACTIONS,
  followUpItemLinks,
  metricCard,
  openDashboard,
  openMetricCard,
  openQuickAction,
} from "../../../pages/admin/dashboardPage";

test.describe("Admin Dashboard navigation", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test("ADMIN-DASH-020 — Active projects metric opens Projects @smoke", async ({
    page,
  }) => {
    await openMetricCard(page, /Active projects/i, /\/projects\/?$/);
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-021 — Available units metric opens Units", async ({ page }) => {
    await openMetricCard(page, /Available units/i, /\/units\/?$/);
    await expect(page.getByRole("heading", { name: "Units", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-022 — Active builders metric opens Builders", async ({ page }) => {
    await openMetricCard(page, /Active builders/i, /\/builders\/?$/);
    await expect(page.getByRole("heading", { name: "Builders", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-023 — Open enquiries metric opens Leads", async ({ page }) => {
    await openMetricCard(page, /Open enquiries/i, /\/leads\/?$/);
    await expect(page.getByRole("heading", { name: "Leads", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-024 — Follow-ups due metric opens Reminders filtered view", async ({
    page,
  }) => {
    await openMetricCard(page, /Follow-ups due/i, /\/reminders\?filter=followups/);
    await expect(page.getByRole("heading", { name: "Reminders", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-025 — Visits (next 7d) metric opens Site visits", async ({
    page,
  }) => {
    await openMetricCard(page, /Visits \(next 7d\)/i, /\/site-visits\/?$/);
    await expect(
      page.getByRole("heading", { name: "Site visits", exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-DASH-026 — Pending verifications metric opens Verification", async ({
    page,
  }) => {
    await openMetricCard(page, /Pending verifications/i, /\/verification\/?$/);
    await expect(
      page.getByRole("heading", { name: "Verification", exact: true }),
    ).toBeVisible();
  });

  test("ADMIN-DASH-027 — all inventory and pipeline metric hrefs are wired", async ({
    page,
  }) => {
    for (const metric of [...INVENTORY_METRICS, ...PIPELINE_METRICS]) {
      await expect(metricCard(page, metric.label)).toHaveAttribute("href", metric.href);
    }
  });

  test("ADMIN-DASH-030 — Quick action Add builder opens New builder @smoke", async ({
    page,
  }) => {
    await openQuickAction(page, "Add builder");
  });

  test("ADMIN-DASH-031 — Quick action Add project opens New project", async ({
    page,
  }) => {
    await openQuickAction(page, "Add project");
  });

  test("ADMIN-DASH-032 — Quick action Add unit opens New unit", async ({ page }) => {
    await openQuickAction(page, "Add unit");
  });

  test("ADMIN-DASH-035 — Available units metric → Units list → New unit form", async ({
    page,
  }) => {
    await openMetricCard(page, /Available units/i, /\/units\/?$/);
    await expect(page.getByRole("heading", { name: "Units", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "+ New unit", exact: true }).click();
    await expect(page).toHaveURL(/\/units\/new/);
    await expect(page.getByRole("heading", { name: "New unit", exact: true })).toBeVisible();
  });

  test("ADMIN-DASH-033 — Quick action Add lead opens New lead", async ({ page }) => {
    await openQuickAction(page, "Add lead");
  });

  test("ADMIN-DASH-034 — quick action hrefs match create routes", async ({ page }) => {
    for (const action of QUICK_ACTIONS) {
      await expect(
        page.getByRole("main").getByRole("link", { name: action.name, exact: true }),
      ).toHaveAttribute("href", action.href);
    }
  });

  test("ADMIN-DASH-040 — overdue follow-up row opens a lead detail when present", async ({
    page,
  }) => {
    const items = followUpItemLinks(page);
    const count = await items.count();
    test.skip(count === 0, "No due/overdue follow-ups on dashboard right now");

    const href = await items.first().getAttribute("href");
    expect(href).toMatch(/^\/leads\/[0-9a-f-]+$/i);

    await items.first().click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
  });
});
