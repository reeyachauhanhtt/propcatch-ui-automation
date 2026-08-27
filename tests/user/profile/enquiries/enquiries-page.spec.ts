import { test, expect } from "@playwright/test";
import {
  ENQUIRY_TYPES,
  enquiryCards,
  enquiryDate,
  enquiryMessage,
  enquiryProjectName,
  enquiryStatus,
  enquiryTypeBadge,
  enquiriesHeading,
  enquiriesSubtitle,
  openEnquiries,
} from "../../../../pages/user/enquiriesPage";

/**
 * Enquiries — page content (/enquiries).
 *
 * The page is a read-only, reverse-chronological list of the signed-in user's
 * enquiries. Each card links to the referenced project and shows the project
 * name, a type badge, a date, a status badge, and a message preview. There
 * are no edit / cancel / filter controls.
 */
test.describe("Enquiries - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("ENQ-004 - the page shows its heading and subtitle", async ({
    page,
  }) => {
    await openEnquiries(page);

    await expect(enquiriesHeading(page)).toBeVisible();
    await expect(enquiriesSubtitle(page)).toBeVisible();
  });

  test("ENQ-005 - enquiries are listed with project, type, date, status and message", async ({
    page,
  }) => {
    await openEnquiries(page);

    const cards = enquiryCards(page);
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const project = (await enquiryProjectName(card).innerText()).trim();
      expect(project.length).toBeGreaterThan(0);

      const type = (await enquiryTypeBadge(card).innerText()).trim();
      expect(ENQUIRY_TYPES).toContain(type);

      await expect(enquiryDate(card)).toHaveText(
        /^[A-Za-z]{3} \d{1,2}, \d{4}$/,
      );

      const status = (await enquiryStatus(card).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);

      // Message preview is optional (some entries, e.g. whatsapp log entries,
      // have no free-text message).
      if ((await enquiryMessage(card).count()) > 0) {
        const message = (await enquiryMessage(card).innerText()).trim();
        expect(message.length).toBeGreaterThan(0);
      }
    }
  });

  test("ENQ-006 - each enquiry type badge is one of the known types", async ({
    page,
  }) => {
    await openEnquiries(page);

    const cards = enquiryCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const type = (await enquiryTypeBadge(cards.nth(i)).innerText()).trim();
      expect(
        ENQUIRY_TYPES,
        `unexpected enquiry type "${type}"`,
      ).toContain(type);
    }
  });

  test("ENQ-007 - each enquiry links to the referenced project's details page", async ({
    page,
  }) => {
    await openEnquiries(page);

    const cards = enquiryCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveAttribute("href", /^\/p\/[\w-]+$/);
    }
  });

  test("ENQ-008 - clicking an enquiry opens the referenced project", async ({
    page,
  }) => {
    await openEnquiries(page);

    const card = enquiryCards(page).first();
    const project = (await enquiryProjectName(card).innerText()).trim();

    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project);
  });

  test("ENQ-009 - the enquiries list is read-only (no controls)", async ({
    page,
  }) => {
    await openEnquiries(page);

    await expect(page.locator("main button")).toHaveCount(0);
    await expect(
      page.locator("main input, main textarea, main select"),
    ).toHaveCount(0);
  });
});
