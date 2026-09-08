import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  builderVerificationsHeading,
  buildersWithUploadedDocuments,
  contentApprovalsHeading,
  openVerification,
  queueEmptyHeading,
  verificationHeading,
  verificationFilterTab,
  switchVerificationTab,
} from "../../../pages/admin/verificationPage";

/**
 * Verification list and status-tab behavior.
 */
test.describe("Admin Verification list", () => {
  test.beforeEach(async ({ page }) => {
    await openVerification(page);
  });

  test("ADMIN-VERIFY-001 — Verification page loads with heading and active sidebar", async ({
    page,
  }) => {
    await expect(verificationHeading(page)).toBeVisible();
    await expectSidebarItemActive(page, "Verification");
  });

  test("ADMIN-VERIFY-002 — content and builder verification queues show their empty states", async ({
    page,
  }) => {
    await expect(contentApprovalsHeading(page)).toBeVisible();
    await expect(builderVerificationsHeading(page)).toBeVisible();
    await expect(queueEmptyHeading(page)).toHaveCount(2);
    await expect(
      page.getByText("No content approvals match this filter.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("No builder verification requests match this filter.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("ADMIN-VERIFY-003 — status tabs filter both verification queues", async ({
    page,
  }) => {
    for (const status of ["pending", "approved", "rejected", "all"] as const) {
      await switchVerificationTab(page, status);
      await expect(verificationFilterTab(page, status)).toHaveClass(/bg-primary/);
    }
  });

  test("ADMIN-VERIFY-004 — uploaded-document section links to Builder detail", async ({
    page,
  }) => {
    const section = buildersWithUploadedDocuments(page);
    await expect(section).toBeVisible();
    expect(await section.locator("li").count()).toBeGreaterThan(0);
    await expect(section.locator('a[href*="/builders/"]').first()).toHaveAttribute(
      "href",
      /\/builders\/[0-9a-f-]+/i,
    );
  });
});
