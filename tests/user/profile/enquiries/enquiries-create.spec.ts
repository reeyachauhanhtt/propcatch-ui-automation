import { test, expect } from "@playwright/test";
import {
  createCallbackEnquiry,
  createGeneralEnquiry,
  createSiteVisitEnquiry,
  enquiryCardByMessage,
  enquiryMessage,
  enquiryProjectName,
  enquiryStatus,
  enquiryTypeBadge,
  openEnquiries,
} from "../../../../pages/user/enquiriesPage";

/**
 * Enquiries — creating each enquiry type.
 *
 * Every enquiry type is created from the project details page (Book a site
 * visit / Request a callback / Contact builder) and then appears in My
 * Enquiries with the matching type badge. Serialized: the app's enquiry
 * inserts are not safe under concurrent submission (Supabase RLS), and these
 * tests write real rows to the shared account.
 */
test.describe("Enquiries - create", () => {
  test.describe.configure({ timeout: 45_000, mode: "serial" });

  test("ENQ-010 - submitting a site visit request creates a Site visit enquiry", async ({
    page,
  }) => {
    const message = `Automated site visit ${Date.now()}`;
    await createSiteVisitEnquiry(page, message);

    await openEnquiries(page);
    const card = enquiryCardByMessage(page, message);
    await expect(card).toBeVisible();

    await expect(enquiryProjectName(card)).toHaveText("Montessa Heights");
    await expect(enquiryTypeBadge(card)).toHaveText("Site visit");
    await expect(enquiryStatus(card)).toHaveText("New");
    await expect(enquiryMessage(card)).toContainText(message);
  });

  test("ENQ-011 - submitting a callback request creates a Callback enquiry", async ({
    page,
  }) => {
    const message = `Automated callback ${Date.now()}`;
    await createCallbackEnquiry(page, message);

    await openEnquiries(page);
    const card = enquiryCardByMessage(page, message);
    await expect(card).toBeVisible();

    await expect(enquiryProjectName(card)).toHaveText("Montessa Heights");
    await expect(enquiryTypeBadge(card)).toHaveText("Callback");
    await expect(enquiryStatus(card)).toHaveText("New");
    await expect(enquiryMessage(card)).toContainText(message);
  });

  test("ENQ-012 - submitting a contact builder request creates a General enquiry", async ({
    page,
  }) => {
    const message = `Automated contact ${Date.now()}`;
    await createGeneralEnquiry(page, message);

    await openEnquiries(page);
    const card = enquiryCardByMessage(page, message);
    await expect(card).toBeVisible();

    await expect(enquiryProjectName(card)).toHaveText("Montessa Heights");
    await expect(enquiryTypeBadge(card)).toHaveText("General");
    await expect(enquiryStatus(card)).toHaveText("New");
    await expect(enquiryMessage(card)).toContainText(message);
  });
});
