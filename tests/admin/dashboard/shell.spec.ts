import { test, expect } from "@playwright/test";
import { requireAdminCreds } from "../../../pages/admin/auth";
import {
  brandLabel,
  expectAdminShellVisible,
  expectAllSidebarLinksPresent,
  expectSidebarItemActive,
  openSidebarItem,
  remindersNavDot,
  SIDEBAR_ITEMS,
  sidebar,
  sidebarFooter,
  sidebarLink,
  sidebarNav,
  signedInAsLink,
  signOutButton,
} from "../../../pages/admin/shell";
import {
  dashboardHeading,
  openDashboard,
} from "../../../pages/admin/dashboardPage";

test.describe("Admin shell", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test("ADMIN-SHELL-001 — sidebar, brand, topbar, and footer are visible @smoke", async ({
    page,
  }) => {
    await expectAdminShellVisible(page);
    await expect(brandLabel(page)).toBeVisible();
    await expect(sidebarFooter(page)).toBeVisible();
    await expect(signedInAsLink(page)).toContainText(/Signed in as/i);
    await expect(signOutButton(page)).toHaveText("Sign out");
  });

  test("ADMIN-SHELL-002 — all sidebar module links are present with correct hrefs", async ({
    page,
  }) => {
    await expect(sidebar(page)).toBeVisible();
    await expect(sidebarNav(page)).toBeVisible();
    await expectAllSidebarLinksPresent(page);
    expect(SIDEBAR_ITEMS.length).toBe(17);
  });

  test("ADMIN-SHELL-003 — Dashboard is the active sidebar item on /dashboard", async ({
    page,
  }) => {
    await expectSidebarItemActive(page, "Dashboard");
    await expect(sidebarLink(page, "Builders")).not.toHaveClass(/bg-primary\/10/);
  });

  test("ADMIN-SHELL-004 — Reminders nav shows urgent badge when reminders exist", async ({
    page,
  }) => {
    const reminders = sidebarLink(page, "Reminders");
    await expect(reminders).toBeVisible();
    await expect(reminders).toHaveAttribute("href", "/reminders");
    await expect(remindersNavDot(page)).toBeVisible();
    await expect(reminders).toContainText(/urgent reminders/i);
  });

  test("ADMIN-SHELL-005 — Signed in as link opens profile (/users/me → user detail)", async ({
    page,
  }) => {
    const { email } = requireAdminCreds();
    await expect(signedInAsLink(page)).toHaveAttribute("href", "/users/me");
    await expect(signedInAsLink(page)).toContainText(email);

    await signedInAsLink(page).click();

    // /users/me resolves to /users/:id
    await expect(page).toHaveURL(/\/users\/(me|[0-9a-f-]{36})/i);
    await expect(
      page.getByRole("main").getByRole("paragraph").filter({ hasText: email }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to list" })).toBeVisible();
    await expect(page.getByText("Users / Detail")).toBeVisible();
    await expectAdminShellVisible(page);
  });

  test("ADMIN-SHELL-010 — sidebar navigation reaches Builders, Projects, and Leads", async ({
    page,
  }) => {
    await openSidebarItem(page, "Builders");
    await openSidebarItem(page, "Projects");
    await openSidebarItem(page, "Leads");
  });

  test("ADMIN-SHELL-011 — sidebar navigation reaches Reminders, Freshness, and Audit log", async ({
    page,
  }) => {
    await openSidebarItem(page, "Reminders");
    await openSidebarItem(page, "Freshness");
    await openSidebarItem(page, "Audit log");
  });

  test("ADMIN-SHELL-012 — sidebar navigation reaches Settings and returns to Dashboard", async ({
    page,
  }) => {
    await openSidebarItem(page, "Settings");
    await openSidebarItem(page, "Dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(dashboardHeading(page)).toBeVisible();
  });
});

// Sign-out from the shared setup session is covered by ADMIN-LOGIN-041.
// Do not re-login/sign-out here — it revokes the setup session for parallel workers.