import { test, expect } from "@playwright/test";
import {
  QA_LEAD_ASSIGNEE_LABEL,
  QA_LEAD_ASSIGNEE_NAME,
  addCallback,
  addFollowUp,
  addCallbackButton,
  addFollowupButton,
  assignedToSelect,
  callbackRemarksInput,
  callbackStatusInput,
  channelInput,
  cleanupQaLeadByName,
  commMessageInput,
  commStatusInput,
  createLead,
  directionSelect,
  followupNotesInput,
  followupTypeInput,
  futureDateTimeLocal,
  logCommunication,
  logCommunicationButton,
  main,
  markCompletedButton,
  nextFollowupAtInput,
  reassignButton,
  reassignLead,
  scheduledAtInput,
  uniqueQaLeadName,
} from "../../../pages/admin/leadsPage";

/**
 * Assignment, follow-ups, callbacks, and communication log on disposable QA
 * leads only. Never reassign or log activity against seeded contacts.
 */
test.describe("Admin Leads activity", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaLeadByName(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-LEADS-080 — can reassign a QA lead @smoke", async ({ page }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await expect(assignedToSelect(page)).toBeVisible();
    await expect(reassignButton(page)).toBeVisible();

    await reassignLead(page, QA_LEAD_ASSIGNEE_LABEL);
    await expect(
      main(page).getByText(QA_LEAD_ASSIGNEE_NAME, { exact: true }).first(),
    ).toBeVisible();
  });

  test("ADMIN-LEADS-081 — reassignment is recorded in assignment history", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await reassignLead(page, QA_LEAD_ASSIGNEE_LABEL);
    await expect(main(page).getByText("HISTORY")).toBeVisible();
    await expect(main(page).getByText("No previous assignments.")).toHaveCount(0);
  });

  test("ADMIN-LEADS-082 — can add a follow-up on a QA lead @smoke", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await expect(followupTypeInput(page)).toBeVisible();
    await expect(nextFollowupAtInput(page)).toBeVisible();
    await expect(followupNotesInput(page)).toBeVisible();
    await expect(addFollowupButton(page)).toBeVisible();

    const notes = `QA Autotest follow-up ${Date.now()}`;
    await addFollowUp(page, {
      type: "call",
      nextAt: futureDateTimeLocal(),
      notes,
    });
    await expect(main(page).getByText("call", { exact: true }).first()).toBeVisible();
  });

  test("ADMIN-LEADS-083 — can mark a QA follow-up completed", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    const notes = `QA Autotest follow-up complete ${Date.now()}`;
    await addFollowUp(page, {
      type: "whatsapp",
      nextAt: futureDateTimeLocal(),
      notes,
    });

    await expect(markCompletedButton(page)).toBeVisible();
    await markCompletedButton(page).click();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(markCompletedButton(page)).toHaveCount(0, { timeout: 15_000 });
  });

  test("ADMIN-LEADS-084 — can add a callback on a QA lead", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await expect(callbackStatusInput(page)).toBeVisible();
    await expect(scheduledAtInput(page)).toBeVisible();
    await expect(callbackRemarksInput(page)).toBeVisible();
    await expect(addCallbackButton(page)).toBeVisible();

    const remarks = `QA Autotest callback ${Date.now()}`;
    await addCallback(page, {
      status: "scheduled",
      scheduledAt: futureDateTimeLocal(),
      remarks,
    });
    await expect(main(page).getByText("scheduled").first()).toBeVisible();
  });

  test("ADMIN-LEADS-085 — can log communication on a QA lead", async ({
    page,
  }) => {
    contactName = uniqueQaLeadName();
    await createLead(page, { name: contactName });

    await expect(channelInput(page)).toBeVisible();
    await expect(directionSelect(page)).toBeVisible();
    await expect(commStatusInput(page)).toBeVisible();
    await expect(commMessageInput(page)).toBeVisible();
    await expect(logCommunicationButton(page)).toBeVisible();

    const message = `QA Autotest comm log ${Date.now()}`;
    await logCommunication(page, {
      channel: "whatsapp",
      direction: "outbound",
      status: "sent",
      message,
    });
    await expect(main(page).getByText(message)).toBeVisible();
  });
});
