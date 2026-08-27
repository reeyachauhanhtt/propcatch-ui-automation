import { expect, type Locator, type Page } from "@playwright/test";
import { projectCardByName } from "./projectListingPage";

/**
 * Locators and helpers for the PropCatch Project Details page (/p/<uuid>).
 *
 * The details page is PUBLIC (server-rendered, no auth gate) and is reached by
 * clicking a project card on /projects. Verified 2026-08-19 against the live
 * app. Sections that render per project: key facts (Configuration / Area range
 * / Price / Possession / RERA), About, Amenities, Floor plans, Downloads, and
 * an EMI calculator. Images, floor plans and brochures are OPTIONAL — some
 * projects (e.g. "Montessa Heights") have none.
 */

/** Navigate from /projects and open the named project's details page. */
export async function openProject(page: Page, name: string) {
  await page.goto("/projects");
  await projectCardByName(page, name).first().click();
  await expect(page).toHaveURL(/\/p\//);
}

/** The h1 project name. */
export function projectName(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

/** Status badge — Ready to Move / Under Construction / New Launch. */
export function statusBadge(page: Page) {
  return page.getByText(/^(Ready to Move|Under Construction|New Launch)$/);
}

/** Location line, e.g. "Andheri West, Mumbai". */
export function locationText(page: Page) {
  return page.getByText(/,\s*(Mumbai|Ahmedabad|Surat)/).first();
}

/** "By <builder> →" link in the project header. */
export function builderLink(page: Page) {
  return page.getByRole("link", { name: /^By / });
}

/** Share button in the project header. */
export function shareButton(page: Page) {
  return page.getByRole("button", { name: "Share", exact: true });
}

/**
 * Value of a key-fact card, e.g. factValue(page, "Configuration") → "3 BHK".
 * The label sits in a <div>; the value is the immediately following <div>.
 */
export function factValue(page: Page, label: string): Locator {
  return page
    .getByText(label, { exact: true })
    .locator("xpath=following-sibling::div[1]");
}

/** Amenities section (the <section> containing the "Amenities" heading). */
export function amenitiesHeading(page: Page) {
  return page.getByRole("heading", { name: "Amenities" });
}

export function amenitiesSection(page: Page) {
  return amenitiesHeading(page).locator("xpath=..");
}

/** "About" section heading (present when the project has a description). */
export function aboutHeading(page: Page) {
  return page.getByRole("heading", { name: "About" });
}

/** "Floor plans" section heading (present when the project has floor plans). */
export function floorPlansHeading(page: Page) {
  return page.getByRole("heading", { name: "Floor plans" });
}

/** "Downloads" section heading (present when the project has documents). */
export function downloadsHeading(page: Page) {
  return page.getByRole("heading", { name: /Downloads/i });
}

/** EMI calculator heading. */
export function emiHeading(page: Page) {
  return page.getByRole("heading", { name: "EMI calculator" });
}

/** Call action link (tel:). */
export function callLink(page: Page) {
  return page.locator('a[href^="tel:"]');
}

/** WhatsApp action button. */
export function whatsAppButton(page: Page) {
  return page.getByRole("button", { name: /WhatsApp/ });
}

/** Site Visit CTA. */
export function siteVisitButton(page: Page) {
  return page.getByRole("button", { name: "Book a site visit" });
}

/** Contact builder CTA. */
export function contactBuilderButton(page: Page) {
  return page.getByRole("button", { name: "Contact builder" });
}

/** Request a callback CTA. */
export function requestCallbackButton(page: Page) {
  return page.getByRole("button", { name: "Request a callback" });
}

/** Save to shortlist CTA. */
export function saveToShortlistButton(page: Page) {
  return page.getByRole("button", { name: "Save to shortlist" });
}

/* ----- Site Visit modal (authenticated "Book a site visit" flow) ----- */

/** The site-visit dialog that opens when "Book a site visit" is clicked. */
export function siteVisitDialog(page: Page) {
  return page.getByRole("dialog");
}

/** "Your name *" field. */
export function siteVisitNameInput(page: Page) {
  return page.getByPlaceholder("Full name");
}

/** "Phone *" field (10-digit mobile). */
export function siteVisitPhoneInput(page: Page) {
  return page.getByPlaceholder("10-digit mobile");
}

/** "Email" field (optional). */
export function siteVisitEmailInput(page: Page) {
  return page.getByPlaceholder("you@example.com");
}

/** "Message" field (optional) — free-text preferred date/time. */
export function siteVisitMessageInput(page: Page) {
  return page.getByPlaceholder("Preferred date / time?");
}

/** "Submit" button inside the site-visit dialog. */
export function siteVisitSubmitButton(page: Page) {
  return page.getByRole("button", { name: "Submit" });
}
