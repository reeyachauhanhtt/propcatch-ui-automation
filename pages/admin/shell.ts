import { expect, type Page } from "@playwright/test";
import { logoutButton, topbarUserLink } from "./auth";

/**
 * Admin app shell (sidebar + topbar) for https://propcatch-admin.vercel.app
 *
 * Verified 2026-08-26 against the live Admin portal:
 * - Sidebar lives in <aside> / complementary with a single <nav>
 * - Nav labels (Freshness → /data-freshness, Audit log → /audit-logs)
 * - Reminders link includes urgent count + data-testid="reminders-nav-dot"
 * - Topbar: data-testid="topbar-user-link" → /users/me, data-testid="logout-button"
 * - Active nav item uses bg-primary/10 text-primary classes
 */

export const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/dashboard", heading: "Dashboard" },
  { name: "Builders", href: "/builders", heading: "Builders" },
  { name: "Projects", href: "/projects", heading: "Projects" },
  { name: "Units", href: "/units", heading: "Units" },
  { name: "Pricing", href: "/pricing", heading: "Pricing" },
  { name: "Availability", href: "/availability", heading: "Availability" },
  { name: "Leads", href: "/leads", heading: "Leads" },
  { name: "Pipeline", href: "/pipeline", heading: "Pipeline" },
  { name: "Site visits", href: "/site-visits", heading: "Site visits" },
  { name: "Reminders", href: "/reminders", heading: "Reminders" },
  { name: "Verification", href: "/verification", heading: "Verification" },
  { name: "Reports", href: "/reports", heading: "Reports" },
  { name: "Freshness", href: "/data-freshness", heading: "Data freshness" },
  { name: "Localities", href: "/localities", heading: "Localities" },
  { name: "Users", href: "/users", heading: "Users" },
  { name: "Audit log", href: "/audit-logs", heading: "Audit log" },
  { name: "Settings", href: "/settings", heading: "Settings · Master data" },
] as const;

export function sidebar(page: Page) {
  return page.getByRole("complementary");
}

export function sidebarNav(page: Page) {
  return page.getByRole("navigation");
}

export function brandLabel(page: Page) {
  return sidebar(page).getByText("PropCatch Admin", { exact: true });
}

export function sidebarFooter(page: Page) {
  return sidebar(page).getByText("Internal portal — RLS-governed");
}

/** Sidebar link by visible label. Reminders also exposes the urgent-count text. */
export function sidebarLink(page: Page, name: string) {
  if (name === "Reminders") {
    return sidebarNav(page).getByRole("link", { name: /^Reminders/ });
  }
  return sidebarNav(page).getByRole("link", { name, exact: true });
}

export function remindersNavDot(page: Page) {
  return page.getByTestId("reminders-nav-dot");
}

export function signedInAsLink(page: Page) {
  return topbarUserLink(page);
}

export function signOutButton(page: Page) {
  return logoutButton(page);
}

export async function expectAdminShellVisible(page: Page) {
  await expect(sidebar(page)).toBeVisible();
  await expect(brandLabel(page)).toBeVisible();
  await expect(sidebarNav(page)).toBeVisible();
  await expect(signedInAsLink(page)).toBeVisible();
  await expect(signOutButton(page)).toBeVisible();
  await expect(sidebarFooter(page)).toBeVisible();
}

export async function expectAllSidebarLinksPresent(page: Page) {
  for (const item of SIDEBAR_ITEMS) {
    await expect(sidebarLink(page, item.name)).toBeVisible();
    await expect(sidebarLink(page, item.name)).toHaveAttribute("href", item.href);
  }
}

/** Active item uses primary highlight classes (no aria-current on live UI). */
export async function expectSidebarItemActive(page: Page, name: string) {
  const link = sidebarLink(page, name);
  await expect(link).toBeVisible();
  await expect(link).toHaveClass(/bg-primary\/10/);
  await expect(link).toHaveClass(/text-primary/);
}

export async function openSidebarItem(page: Page, name: string) {
  const item = SIDEBAR_ITEMS.find((entry) => entry.name === name);
  if (!item) {
    throw new Error(`Unknown sidebar item: ${name}`);
  }
  await sidebarLink(page, name).click();
  await expect(page).toHaveURL(
    new RegExp(`${item.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?|$)`),
    { timeout: 15_000 },
  );
  await expect(
    page.getByRole("heading", { name: item.heading, exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expectSidebarItemActive(page, name);
}
