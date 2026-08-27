import { expect, type Locator, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Dashboard page helpers for https://propcatch-admin.vercel.app/dashboard
 *
 * Verified 2026-08-26 — read-only MVP:
 * - Inventory + Sales pipeline metric cards (links to list routes)
 * - Due / overdue follow-ups (top 5) + Upcoming site visits (empty state OK)
 * - Quick actions → /builders/new, /projects/new, /units/new, /leads/new
 * - Metric values are live; assert labels + numeric shape, not hard-coded counts
 */

export const INVENTORY_METRICS = [
  { label: /Active projects/i, href: "/projects" },
  { label: /Total projects/i, href: "/projects" },
  { label: /Total units/i, href: "/units" },
  { label: /Available units/i, href: "/units" },
  { label: /Sold units/i, href: "/units" },
  { label: /Active builders/i, href: "/builders" },
] as const;

export const PIPELINE_METRICS = [
  { label: /Total enquiries/i, href: "/leads" },
  { label: /Open enquiries/i, href: "/leads" },
  { label: /Enquiries \(7d\)/i, href: "/leads" },
  { label: /Follow-ups due/i, href: "/reminders?filter=followups" },
  { label: /Visits \(next 7d\)/i, href: "/site-visits" },
  { label: /Pending verifications/i, href: "/verification" },
] as const;

export const QUICK_ACTIONS = [
  { name: "Add builder", href: "/builders/new", heading: "New builder" },
  { name: "Add project", href: "/projects/new", heading: "New project" },
  { name: "Add unit", href: "/units/new", heading: "New unit" },
  { name: "Add lead", href: "/leads/new", heading: "New lead" },
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function dashboardHeading(page: Page) {
  return page.getByRole("heading", { name: "Dashboard", exact: true });
}

export function inventoryHeading(page: Page) {
  return page.getByRole("heading", { name: "Inventory", exact: true });
}

export function salesPipelineHeading(page: Page) {
  return page.getByRole("heading", { name: "Sales pipeline", exact: true });
}

export function dashboardSubtitle(page: Page) {
  return main(page).getByText(
    "Snapshot of inventory, leads, and operations. Read-only at MVP.",
  );
}

export function moduleEyebrow(page: Page) {
  return main(page).getByText("Module 2 — Dashboard");
}

export function followUpsSectionLabel(page: Page) {
  return main(page).getByText("Due / overdue follow-ups", { exact: true });
}

export function upcomingVisitsSectionLabel(page: Page) {
  return main(page).getByText("Upcoming site visits", { exact: true });
}

export function quickActionsLabel(page: Page) {
  return main(page).getByText("Quick actions", { exact: true });
}

export function metricCard(page: Page, label: RegExp) {
  return main(page).getByRole("link", { name: label });
}

export function quickActionLink(page: Page, name: string) {
  return main(page).getByRole("link", { name, exact: true });
}

export function followUpItemLinks(page: Page) {
  return main(page).locator('a[href^="/leads/"]');
}

export function overdueBadges(page: Page) {
  return main(page).getByText("Overdue", { exact: true });
}

export function noVisitsEmptyState(page: Page) {
  return main(page).getByRole("heading", { name: "Nothing scheduled", exact: true });
}

export async function openDashboard(page: Page) {
  await page.goto("/dashboard");
  await expectDashboardLoaded(page);
}

export async function expectDashboardLoaded(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page).toHaveTitle(/PropCatch Admin/i);
  await expect(dashboardHeading(page)).toBeVisible();
  await expect(dashboardSubtitle(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function expectMetricCardsPresent(page: Page) {
  for (const metric of [...INVENTORY_METRICS, ...PIPELINE_METRICS]) {
    const card = metricCard(page, metric.label);
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", metric.href);
    await expectMetricValueNumeric(card);
  }
}

export async function expectMetricValueNumeric(card: Locator) {
  const text = (await card.innerText()).replace(/\s+/g, " ").trim();
  expect(text).toMatch(/\d+/);
  expect(text).not.toMatch(/\bundefined\b|\bNaN\b|(^|\s)null(\s|$)/i);
}

export async function expectQuickActionsPresent(page: Page) {
  await expect(quickActionsLabel(page)).toBeVisible();
  for (const action of QUICK_ACTIONS) {
    const link = quickActionLink(page, action.name);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", action.href);
  }
}

export async function expectFollowUpsSection(page: Page) {
  await expect(followUpsSectionLabel(page)).toBeVisible();
  await expect(main(page).getByText("Top 5 oldest first")).toBeVisible();
}

export async function expectUpcomingVisitsSection(page: Page) {
  await expect(upcomingVisitsSectionLabel(page)).toBeVisible();
  await expect(main(page).getByText(/Next 7 days/)).toBeVisible();
}

export async function openMetricCard(
  page: Page,
  label: RegExp,
  expectedUrl: string | RegExp,
) {
  const card = metricCard(page, label);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(expectedUrl, { timeout: 15_000 });
}

export async function openQuickAction(page: Page, name: string) {
  const action = QUICK_ACTIONS.find((entry) => entry.name === name);
  if (!action) {
    throw new Error(`Unknown quick action: ${name}`);
  }
  await quickActionLink(page, name).click();
  await expect(page).toHaveURL(
    new RegExp(`${action.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
  await expect(
    page.getByRole("heading", { name: action.heading, exact: true }),
  ).toBeVisible();
}

export async function expectNoBrokenValues(page: Page) {
  const text = await main(page).innerText();
  expect(text).not.toMatch(/\bundefined\b/);
  expect(text).not.toMatch(/\bNaN\b/);
  expect(text).not.toMatch(/(^|\s)null(\s|$)/i);
}
