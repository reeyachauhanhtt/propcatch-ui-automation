import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";
import {
  contactBuilderButton,
  openProject,
  requestCallbackButton,
  siteVisitButton,
  siteVisitEmailInput,
  siteVisitNameInput,
  siteVisitPhoneInput,
  siteVisitSubmitButton,
} from "./projectDetailsPage";

/**
 * Locators and helpers for the PropCatch My Enquiries page (/enquiries).
 *
 * /enquiries is AUTH-GATED: hitting it while signed out redirects to
 * /login?next=%2Fenquiries. It is reached from the Profile overview and the
 * footer.
 *
 * The page is a READ-ONLY, reverse-chronological list of every enquiry the
 * signed-in user has submitted. Each card is a link to the referenced
 * project's details page (/p/<id>) and shows: project name, a type badge
 * (Site visit / Callback / General / app:whatsapp), a date, a status badge,
 * and a preview of the enquiry message. There are no edit/cancel controls.
 *
 * Enquiries are created on the project details page via one of three modals
 * — Book a site visit, Request a callback, or Contact builder — which share
 * identical name/phone/email inputs (see project-details helpers).
 *
 * Verified 2026-08-21 against the live app.
 */

/** The known enquiry type badges. */
export const ENQUIRY_TYPES = [
  "Site visit",
  "Callback",
  "General",
  "app:whatsapp",
] as const;

/** Sign in and open the My Enquiries page. */
export async function openEnquiries(page: Page) {
  await loginAsUser(page);
  await page.goto("/enquiries");
  await expect(page).toHaveURL(/\/enquiries$/);
  await expect(enquiriesHeading(page)).toBeVisible();
}

/** The "My Enquiries" h1. */
export function enquiriesHeading(page: Page) {
  return page.getByRole("heading", { name: "My Enquiries", exact: true });
}

/** Subtitle under the heading. */
export function enquiriesSubtitle(page: Page) {
  return page.getByText(
    "Callbacks + site visits + general enquiries you've submitted.",
  );
}

/** Every enquiry card; each links to the referenced project's details page. */
export function enquiryCards(page: Page) {
  return page.locator('main a[href^="/p/"]');
}

/** The project name on an enquiry card. */
export function enquiryProjectName(
  card: ReturnType<typeof enquiryCards>,
) {
  return card.locator("div.truncate.font-semibold");
}

/** The enquiry type badge, e.g. "Site visit" / "Callback" / "General". */
export function enquiryTypeBadge(card: ReturnType<typeof enquiryCards>) {
  return card.locator("div.mt-1 span").first();
}

/** The submission date, e.g. "Aug 21, 2026". */
export function enquiryDate(card: ReturnType<typeof enquiryCards>) {
  return card.locator("div.mt-1 span").nth(1);
}

/** The status badge, e.g. "New". */
export function enquiryStatus(card: ReturnType<typeof enquiryCards>) {
  return card.locator("span.shrink-0");
}

/** The enquiry message preview. */
export function enquiryMessage(card: ReturnType<typeof enquiryCards>) {
  return card.locator("p.line-clamp-2");
}

/** Find the enquiry card for a unique message preview. */
export function enquiryCardByMessage(page: Page, message: string) {
  return enquiryCards(page).filter({ hasText: message }).first();
}

/* ----- Enquiry creation (from the project details page) ----- */

/** Fill and submit the shared enquiry modal, then wait for the confirmation. */
async function submitEnquiryModal(
  page: Page,
  message: string,
  messageField: string,
) {
  await siteVisitNameInput(page).fill("Automation Tester");
  await siteVisitPhoneInput(page).fill("9876543210");
  await siteVisitEmailInput(page).fill("tester@example.com");
  await page.getByPlaceholder(messageField).fill(message);
  await siteVisitSubmitButton(page).click();
  await expect(page.getByText("Enquiry sent")).toBeVisible();
}

/** Open Montessa Heights and submit a "Site visit" enquiry. */
export async function createSiteVisitEnquiry(page: Page, message: string) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await siteVisitButton(page).click();
  await submitEnquiryModal(page, message, "Preferred date / time?");
}

/** Open Montessa Heights and submit a "Callback" enquiry. */
export async function createCallbackEnquiry(page: Page, message: string) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await requestCallbackButton(page).click();
  await submitEnquiryModal(page, message, "When should we call?");
}

/** Open Montessa Heights and submit a "General" (contact builder) enquiry. */
export async function createGeneralEnquiry(page: Page, message: string) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await contactBuilderButton(page).click();
  await submitEnquiryModal(page, message, "Anything specific?");
}
