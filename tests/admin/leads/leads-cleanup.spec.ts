import { test, expect } from "@playwright/test";
import {
  TESTER_CONTACT_NAMES,
  collectContactNamesOnPage,
  deleteLeadsNamed,
  expectNoLeadsNamed,
  findKeeperContactName,
  isTesterContactName,
  leadContactLink,
  openLeads,
  searchLeads,
} from "../../../pages/admin/leadsPage";

/**
 * One-shot cleanup of leftover tester enquiries on Admin Leads.
 * Only Automation Tester and Non-Admin Tester are deleted — other contacts
 * are left untouched.
 */
test.describe("Admin Leads tester cleanup", () => {
  test.describe.configure({ mode: "serial", timeout: 900_000 });

  test("ADMIN-LEADS-090 — delete Automation Tester and Non-Admin Tester leads only", async ({
    page,
  }) => {
    const keeper = await findKeeperContactName(page);

    const deletedByName: Record<string, number> = {};
    for (const name of TESTER_CONTACT_NAMES) {
      deletedByName[name] = await deleteLeadsNamed(page, name);
    }

    for (const name of TESTER_CONTACT_NAMES) {
      await expectNoLeadsNamed(page, name);
    }

    if (keeper) {
      await openLeads(page);
      await searchLeads(page, keeper);
      await expect(leadContactLink(page, keeper).first()).toBeVisible();
    } else {
      await openLeads(page);
      const remaining = await collectContactNamesOnPage(page);
      for (const name of remaining) {
        expect(isTesterContactName(name)).toBe(false);
      }
    }

    test.info().annotations.push({
      type: "cleanup",
      description: `Deleted ${JSON.stringify(deletedByName)}; keeper=${keeper || "(none)"}`,
    });
  });
});
