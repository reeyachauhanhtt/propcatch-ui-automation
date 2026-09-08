import { test, expect } from "@playwright/test";
import {
  QA_LEAD_ASSIGNEE_LABEL,
  QA_LEAD_ASSIGNEE_NAME,
  cleanupQaLeadByName,
  createLead,
  reassignLead,
  uniqueQaLeadName,
} from "../../../pages/admin/leadsPage";
import {
  openReports,
  salesRepAssignmentCounts,
  salesRepRow,
} from "../../../pages/admin/reportsPage";

/**
 * A newly assigned disposable lead must be included in the assignee's active
 * and total assignment counts in Reports.
 */
test.describe("Admin Reports sales-rep activity", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaLeadByName(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-REPORTS-070 — assigning a lead increases the sales-rep activity count @smoke", async ({
    page,
  }) => {
    await openReports(page);
    const before = await salesRepAssignmentCounts(page, QA_LEAD_ASSIGNEE_NAME);

    contactName = uniqueQaLeadName("Reports assignment");
    await createLead(page, { name: contactName });
    await reassignLead(page, QA_LEAD_ASSIGNEE_LABEL);

    await openReports(page);
    await expect(salesRepRow(page, QA_LEAD_ASSIGNEE_NAME)).toBeVisible();
    await expect
      .poll(
        async () => {
          await page.reload();
          const after = await salesRepAssignmentCounts(
            page,
            QA_LEAD_ASSIGNEE_NAME,
          );
          return `${after.activeAssignments}|${after.totalAssignments}`;
        },
        { timeout: 45_000, intervals: [1_000, 2_000, 5_000] },
      )
      .toBe(`${before.activeAssignments + 1}|${before.totalAssignments + 1}`);
  });
});
