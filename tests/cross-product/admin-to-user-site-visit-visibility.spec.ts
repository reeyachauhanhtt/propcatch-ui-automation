import { test, expect } from "@playwright/test";
import {
  findAdminUserIdByEmail,
  openUserContext,
  requireUserEmail,
} from "../../pages/crossProduct";
import {
  QA_VISIT_PROJECT,
  changeVisitStatus,
  cleanupQaVisitByContact,
  createQaLeadAndVisit,
  futureDateTimeLocal,
} from "../../pages/admin/siteVisitsPage";
import { loginAsUser } from "../../pages/user/auth";
import {
  upcomingSectionHeading,
  visitCardByProject,
  visitStatusBadge,
  visitsHeading,
} from "../../pages/user/visitsPage";

/**
 * Admin Site visits → user-site /visits.
 *
 * User "Book a site visit" creates an Admin lead (source app:site_visit), not a
 * scheduled visit — that path is covered in user-to-admin-lead-generation
 * (XAPP-LEAD-001). These tests schedule a disposable visit on a lead linked to
 * the seeded user account and assert it shows on /visits.
 */
test.describe("Admin → User site visit visibility", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaVisitByContact(page, contactName);
      contactName = "";
    }
  });

  test("XAPP-VISIT-001 — admin-scheduled visit appears on the user Site Visits page @smoke", async ({
    page,
    browser,
  }) => {
    const userId = await findAdminUserIdByEmail(page, requireUserEmail());
    contactName = await createQaLeadAndVisit(page, {
      userId,
      scheduledAt: futureDateTimeLocal(14),
      remarks: "QA Autotest xapp scheduled visit",
    });

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await loginAsUser(userPage);
      await userPage.goto("/visits");
      await expect(visitsHeading(userPage)).toBeVisible();
      await expect(upcomingSectionHeading(userPage)).toBeVisible({
        timeout: 20_000,
      });

      const card = visitCardByProject(userPage, QA_VISIT_PROJECT).first();
      await expect(card).toBeVisible({ timeout: 20_000 });
      await expect(visitStatusBadge(card)).toHaveText(/scheduled/i);
    } finally {
      await context.close();
    }
  });

  test("XAPP-VISIT-002 — admin status change is reflected on the user Site Visits page", async ({
    page,
    browser,
  }) => {
    const userId = await findAdminUserIdByEmail(page, requireUserEmail());
    contactName = await createQaLeadAndVisit(page, {
      userId,
      scheduledAt: futureDateTimeLocal(21),
      remarks: "QA Autotest xapp status sync",
    });

    await changeVisitStatus(page, "confirmed");

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await loginAsUser(userPage);
      await userPage.goto("/visits");
      await expect(visitsHeading(userPage)).toBeVisible();

      const card = visitCardByProject(userPage, QA_VISIT_PROJECT).first();
      await expect(card).toBeVisible({ timeout: 20_000 });
      await expect(visitStatusBadge(card)).toHaveText(/confirmed/i);
    } finally {
      await context.close();
    }
  });
});
