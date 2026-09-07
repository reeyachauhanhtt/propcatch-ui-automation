import { test, expect } from "@playwright/test";
import {
  QA_VISIT_PROJECT,
  changeVisitStatus,
  cleanupQaVisitByContact,
  createQaLeadAndVisit,
  detailLeadLink,
  detailProjectLink,
  detailStatusSelect,
  editLink,
  findSeededVisitRow,
  leadCardHeading,
  openSiteVisits,
  visitFieldLabel,
  visitOverviewHeading,
  visitStatusBadge,
} from "../../../pages/admin/siteVisitsPage";

/**
 * Visit detail chrome, inline status, and lead / project links.
 * Never change status on seeded visits — use a disposable QA visit for that.
 */
test.describe("Admin Site visits detail", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let contactName = "";

  test.afterEach(async ({ page }) => {
    if (contactName) {
      await cleanupQaVisitByContact(page, contactName);
      contactName = "";
    }
  });

  test("ADMIN-VISITS-070 — opening a seeded visit shows read-only detail chrome @smoke", async ({
    page,
  }) => {
    await openSiteVisits(page);
    const seeded = await findSeededVisitRow(page);
    expect(seeded).not.toBeNull();
    const { name, href, scheduled } = seeded!;

    await scheduled.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}/?$`));
    await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: `Visit · ${name}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Site visits / Detail")).toBeVisible();
    await expect(editLink(page)).toBeVisible();
    await expect(detailStatusSelect(page)).toBeVisible();
    await expect(visitOverviewHeading(page)).toBeVisible();
    await expect(leadCardHeading(page)).toBeVisible();
    // Do not change status or edit seeded visits.
  });

  test("ADMIN-VISITS-071 — visit and lead cards show expected labels", async ({
    page,
  }) => {
    await openSiteVisits(page);
    const seeded = await findSeededVisitRow(page);
    expect(seeded).not.toBeNull();

    await seeded!.scheduled.click();
    await expect(page.getByText("Site visits / Detail")).toBeVisible();
    await expect(visitFieldLabel(page, "Scheduled")).toBeVisible();
    await expect(visitFieldLabel(page, "Visited")).toBeVisible();
    await expect(visitFieldLabel(page, "Status")).toBeVisible();
    await expect(visitFieldLabel(page, "Lead status")).toBeVisible();
    await expect(visitFieldLabel(page, "Remarks")).toBeVisible();
    await expect(visitFieldLabel(page, "Contact")).toBeVisible();
    await expect(visitFieldLabel(page, "Phone")).toBeVisible();
    await expect(visitFieldLabel(page, "Project")).toBeVisible();
  });

  test("ADMIN-VISITS-072 — can change status inline on a QA visit @smoke", async ({
    page,
  }) => {
    contactName = await createQaLeadAndVisit(page);
    await expect(detailStatusSelect(page)).toHaveValue("scheduled");
    await expect(visitStatusBadge(page)).toHaveText("Scheduled");

    await changeVisitStatus(page, "confirmed");
    await expect(page.getByText("Site visits / Detail")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: `Visit · ${contactName}`, exact: true }),
    ).toBeVisible();
    await expect(visitStatusBadge(page)).toHaveText("Confirmed");
  });

  test("ADMIN-VISITS-073 — Contact link from visit detail opens that lead @smoke", async ({
    page,
  }) => {
    contactName = await createQaLeadAndVisit(page);

    await detailLeadLink(page).click();
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: contactName, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
  });

  test("ADMIN-VISITS-074 — Project link from visit detail opens that project", async ({
    page,
  }) => {
    contactName = await createQaLeadAndVisit(page, {
      remarks: "QA Autotest visit — open project from detail.",
    });

    await detailProjectLink(page).click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: QA_VISIT_PROJECT, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Projects / Detail")).toBeVisible();
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
