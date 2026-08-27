import { test, expect } from "@playwright/test";
import {
  anonymousStorageState,
  dashboardHeading,
  expectLoggedInAdmin,
  expectOnLoginPage,
  fillLogin,
  openLogin,
  requireAdminCreds,
  signOutAdmin,
} from "../../../pages/admin/auth";

test.use({ storageState: anonymousStorageState });

const PROTECTED_ROUTES = [
  "/dashboard",
  "/projects",
  "/builders",
  "/leads",
  "/settings",
] as const;

test.describe("Admin session gating", () => {
  test.describe.configure({ timeout: 45_000 });

  for (const route of PROTECTED_ROUTES) {
    test(`ADMIN-GATE-001 — ${route} without login redirects to login with redirectTo`, async ({
      page,
    }) => {
      await page.goto(route);

      const encoded = encodeURIComponent(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encoded}`));
      await expectOnLoginPage(page);
    });
  }

  test("ADMIN-GATE-002 — unauthenticated /dashboard lands on login?redirectTo=%2Fdashboard @smoke", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/);
    await expectOnLoginPage(page);
    await expect(dashboardHeading(page)).toHaveCount(0);
  });

  test("ADMIN-GATE-003 — root / redirects toward dashboard then login when signed out", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/);
    await expectOnLoginPage(page);
  });

  test("ADMIN-GATE-010 — after logout, protected route redirects to login again", async ({
    page,
  }) => {
    const { email, password } = requireAdminCreds();
    await openLogin(page);
    await fillLogin(page, email, password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expectLoggedInAdmin(page);

    await signOutAdmin(page);

    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fprojects/);
    await expectOnLoginPage(page);
  });
});
