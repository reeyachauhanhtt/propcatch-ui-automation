import { test, expect } from "@playwright/test";
import {
  QA_LEAD_PROJECT,
  addCallback,
  addFollowUp,
  createLead,
  expectLeadDetailLoaded,
  futureDateTimeLocal,
  logCommunication,
  markCallbackCompleted,
  markFollowUpCompleted,
  uniqueQaLeadName,
} from "../../../pages/admin/leadsPage";
import {
  applyReminderFilter,
  callbackRowByRemarks,
  cleanupQaReminderLead,
  expectReminderAbsent,
  expectReminderRowVisible,
  findSeededReminderRow,
  followupRowByNotes,
  openReminders,
  reminderRowByContact,
  reminderRowByNotes,
  rowContactLink,
  rowStatusBadge,
  rowTypeBadge,
} from "../../../pages/admin/remindersPage";

/**
 * Lead click-through, create → list, and mark-completed → drop off the
 * reminders list. Only disposable QA Autotest leads are mutated.
 */
test.describe("Admin Reminders lead redirect and activity lifecycle", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaReminderLead(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-REM-070 — clicking a reminder contact opens that lead @smoke", async ({
    page,
  }) => {
    await openReminders(page);
    const seeded = await findSeededReminderRow(page);
    expect(seeded).not.toBeNull();
    const { name, href, contact } = seeded!;

    await contact.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}/?$`));
    await expectLeadDetailLoaded(page, name);
    // Do not mark seeded follow-ups or callbacks completed.
  });

  test("ADMIN-REM-071 — a new follow-up is listed on Reminders @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const notes = `QA Autotest reminder follow-up ${Date.now()}`;
    await createLead(page, { name: contactName, project: QA_LEAD_PROJECT });
    await addFollowUp(page, {
      type: "call",
      nextAt: futureDateTimeLocal(-1),
      notes,
    });

    await openReminders(page);
    const row = await expectReminderRowVisible(page, {
      name: contactName,
      notes,
      kind: "Followup",
    });
    await expect(rowStatusBadge(row)).toBeVisible();
    await expect(row).toContainText(QA_LEAD_PROJECT);
    await expect(row).toContainText(/Due /);

    await applyReminderFilter(page, "followups");
    await expect(followupRowByNotes(page, notes)).toBeVisible();

    await applyReminderFilter(page, "callbacks");
    await expect(reminderRowByNotes(page, notes)).toHaveCount(0);
  });

  test("ADMIN-REM-072 — a new pending callback is listed on Reminders @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const remarks = `QA Autotest reminder callback ${Date.now()}`;
    await createLead(page, { name: contactName, project: QA_LEAD_PROJECT });
    await addCallback(page, {
      status: "pending",
      scheduledAt: futureDateTimeLocal(3),
      remarks,
    });

    await openReminders(page);
    const row = await expectReminderRowVisible(page, {
      name: contactName,
      notes: remarks,
      kind: "Callback",
    });
    await expect(rowStatusBadge(row)).toHaveText(/Pending/i);
    await expect(row).toContainText(QA_LEAD_PROJECT);

    await applyReminderFilter(page, "callbacks");
    await expect(callbackRowByRemarks(page, remarks)).toBeVisible();

    await applyReminderFilter(page, "followups");
    await expect(reminderRowByNotes(page, remarks)).toHaveCount(0);
  });

  test("ADMIN-REM-073 — communication log is not a reminder row", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const message = `QA Autotest reminder comm ${Date.now()}`;
    await createLead(page, { name: contactName });
    await logCommunication(page, {
      channel: "call",
      direction: "outbound",
      status: "sent",
      message,
    });

    await openReminders(page);
    await expect(reminderRowByNotes(page, message)).toHaveCount(0);
    await expect(reminderRowByContact(page, contactName)).toHaveCount(0);
  });

  test("ADMIN-REM-074 — marking a follow-up completed drops it from Reminders @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const notes = `QA Autotest reminder follow-up done ${Date.now()}`;
    await createLead(page, { name: contactName });
    await addFollowUp(page, {
      type: "whatsapp",
      nextAt: futureDateTimeLocal(-1),
      notes,
    });

    await openReminders(page);
    const row = await expectReminderRowVisible(page, {
      name: contactName,
      notes,
      kind: "Followup",
    });
    await rowContactLink(row).click();
    await expectLeadDetailLoaded(page, contactName);

    await markFollowUpCompleted(page, notes);

    await expectReminderAbsent(page, notes);
    await expect(reminderRowByContact(page, contactName)).toHaveCount(0);
  });

  test("ADMIN-REM-075 — marking a callback completed drops it from Reminders", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const remarks = `QA Autotest reminder callback done ${Date.now()}`;
    await createLead(page, { name: contactName });
    await addCallback(page, {
      status: "pending",
      scheduledAt: futureDateTimeLocal(3),
      remarks,
    });

    await openReminders(page);
    const row = await expectReminderRowVisible(page, {
      name: contactName,
      notes: remarks,
      kind: "Callback",
    });
    await expect(rowTypeBadge(row)).toHaveText("Callback");
    await rowContactLink(row).click();
    await expectLeadDetailLoaded(page, contactName);

    await markCallbackCompleted(page, remarks);

    await expectReminderAbsent(page, remarks);
    await expect(reminderRowByContact(page, contactName)).toHaveCount(0);
  });

  test("ADMIN-REM-076 — creating another follow-up after complete lists it again", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName("REM");
    const first = `QA Autotest reminder first ${Date.now()}`;
    const second = `QA Autotest reminder second ${Date.now()}`;
    await createLead(page, { name: contactName });
    await addFollowUp(page, {
      type: "call",
      nextAt: futureDateTimeLocal(-1),
      notes: first,
    });

    await openReminders(page);
    const row = await expectReminderRowVisible(page, {
      name: contactName,
      notes: first,
    });
    await rowContactLink(row).click();
    await expectLeadDetailLoaded(page, contactName);
    await markFollowUpCompleted(page, first);

    await addFollowUp(page, {
      type: "email",
      nextAt: futureDateTimeLocal(2),
      notes: second,
    });

    await openReminders(page);
    await expect(reminderRowByNotes(page, first)).toHaveCount(0);
    await expectReminderRowVisible(page, {
      name: contactName,
      notes: second,
      kind: "Followup",
    });
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
