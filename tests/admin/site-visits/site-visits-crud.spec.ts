import { test, expect } from "@playwright/test";
import {
  QA_VISIT_PROJECT,
  cancelLink,
  cleanupQaVisitByContact,
  createQaLeadAndVisit,
  formErrorBanner,
  futureDateTimeLocal,
  leadSelect,
  newVisitHeading,
  openEditVisit,
  openNewSiteVisit,
  openSiteVisits,
  remarksInput,
  saveVisitChanges,
  scheduleVisitButton,
  scheduledAtInput,
  siteVisitsHeading,
  statusInput,
  visitContactLink,
  visitedAtInput,
} from "../../../pages/admin/siteVisitsPage";

/**
 * Create / edit only disposable QA Autotest visits (via a QA lead).
 * Never mutate seeded visits. The portal has no visit-delete action.
 */
test.describe("Admin Site visits CRUD", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaVisitByContact(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-VISITS-030 — create form shows expected fields @smoke", async ({
    page,
  }) => {
    await openNewSiteVisit(page);

    await expect(newVisitHeading(page)).toBeVisible();
    await expect(leadSelect(page)).toBeVisible();
    await expect(scheduledAtInput(page)).toBeVisible();
    await expect(visitedAtInput(page)).toBeVisible();
    await expect(statusInput(page)).toBeVisible();
    await expect(statusInput(page)).toHaveValue("scheduled");
    await expect(remarksInput(page)).toBeVisible();
    await expect(scheduleVisitButton(page)).toBeVisible();
    await expect(cancelLink(page)).toBeVisible();
    await expect(page.getByText("Lead *")).toBeVisible();
    await expect(page.getByText("Scheduled at *")).toBeVisible();
    await expect(page.getByText("Status *")).toBeVisible();
  });

  test("ADMIN-VISITS-031 — empty required fields show validation", async ({
    page,
  }) => {
    await openNewSiteVisit(page);
    await page.getByRole("button", { name: "Schedule visit", exact: true }).click();

    await expect(page).toHaveURL(/\/site-visits\/new/);
    await expect(formErrorBanner(page)).toBeVisible();
    await expect(page.getByText("Required", { exact: true }).first()).toBeVisible();
  });

  test("ADMIN-VISITS-032 — Cancel returns to the site visits list", async ({
    page,
  }) => {
    await openNewSiteVisit(page);
    await cancelLink(page).click();
    await expect(page).toHaveURL(/\/site-visits\/?$/);
    await expect(siteVisitsHeading(page)).toBeVisible();
  });

  test("ADMIN-VISITS-033 — list and detail expose no delete action", async ({
    page,
  }) => {
    await openSiteVisits(page);
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(
      0,
    );

    contactName = await createQaLeadAndVisit(page, {
      remarks: "QA Autotest visit — no delete control.",
    });

    await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByTestId("delete-lead-button")).toHaveCount(0);
  });

  test("ADMIN-VISITS-040 — can schedule a disposable QA visit @smoke", async ({
    page,
  }) => {
    const remarks = `Disposable QA Autotest visit ${Date.now()}`;
    contactName = await createQaLeadAndVisit(page, { remarks });

    await expect(page.getByText("Site visits / Detail")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Visit · ${contactName}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(QA_VISIT_PROJECT).first()).toBeVisible();
    await expect(page.getByText(remarks)).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
  });

  test("ADMIN-VISITS-041 — created QA visit appears on the list", async ({
    page,
  }) => {
    contactName = await createQaLeadAndVisit(page);

    await openSiteVisits(page);
    await expect(visitContactLink(page, contactName)).toBeVisible();
  });

  test("ADMIN-VISITS-050 — can edit a QA visit remarks and schedule", async ({
    page,
  }) => {
    const beforeRemarks = "Before edit — QA Autotest visit";
    contactName = await createQaLeadAndVisit(page, {
      remarks: beforeRemarks,
    });

    await openEditVisit(page);
    await expect(leadSelect(page)).toBeDisabled();
    await expect(page.getByText(`Site visits / ${contactName} / Edit`)).toBeVisible();

    const editedRemarks = "After edit — QA Autotest visit";
    const nextSlot = futureDateTimeLocal(21);
    await scheduledAtInput(page).fill(nextSlot);
    await remarksInput(page).fill(editedRemarks);
    await saveVisitChanges(page);

    await expect(
      page.getByRole("heading", { name: `Visit · ${contactName}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(editedRemarks)).toBeVisible();
  });
});
