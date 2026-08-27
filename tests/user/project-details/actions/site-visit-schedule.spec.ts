import { test, expect, type Page } from "@playwright/test";
import { loginAsUser } from "../../../../pages/user/auth";
import {
  openProject,
  siteVisitButton,
  siteVisitDialog,
  siteVisitEmailInput,
  siteVisitMessageInput,
  siteVisitNameInput,
  siteVisitPhoneInput,
  siteVisitSubmitButton,
} from "../../../../pages/user/projectDetailsPage";

/**
 * Project Details — Site Visit scheduling (authenticated).
 *
 * Clicking "Book a site visit" while signed in opens a dialog with name*,
 * phone*, email and message fields. Submitting creates a "Site visit" enquiry
 * that appears under My Enquiries (/enquiries). There is no fixed date/time
 * slot picker — the message field carries the preferred time.
 *
 * Edit and cancel are intentionally NOT covered here: no such controls exist
 * in the user-facing UI (see report).
 */
async function openSiteVisitForm(page: Page) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await siteVisitButton(page).click();
}

test.describe("Project Details - Actions - Site Visit schedule", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-043 - site visit modal opens with the booking form", async ({
    page,
  }) => {
    await openSiteVisitForm(page);

    await expect(
      page.getByText("We'll reach out to confirm a slot."),
    ).toBeVisible();
    await expect(siteVisitNameInput(page)).toBeVisible();
    await expect(siteVisitPhoneInput(page)).toBeVisible();
    await expect(siteVisitEmailInput(page)).toBeVisible();
    await expect(siteVisitMessageInput(page)).toBeVisible();
    await expect(siteVisitSubmitButton(page)).toBeVisible();

    // The project being visited is echoed inside the dialog.
    await expect(
      siteVisitDialog(page).getByText("Montessa Heights", { exact: true }),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-044 - submitting a site visit request shows a confirmation", async ({
    page,
  }) => {
    await openSiteVisitForm(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await siteVisitEmailInput(page).fill("tester@example.com");
    await siteVisitMessageInput(page).fill("Saturday morning");

    await siteVisitSubmitButton(page).click();

    await expect(page.getByText("Enquiry sent")).toBeVisible();
    await expect(
      page.getByText(/We've forwarded your book a site visit for Montessa Heights/),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-045 - submitted site visit appears in My Enquiries", async ({
    page,
  }) => {
    const message = `Automated site visit ${Date.now()}`;
    await openSiteVisitForm(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await siteVisitMessageInput(page).fill(message);
    await siteVisitSubmitButton(page).click();
    await expect(page.getByText("Enquiry sent")).toBeVisible();

    await page.goto("/enquiries");
    const entry = page.locator("a", { hasText: message }).first();
    await expect(entry).toBeVisible();
    await expect(entry).toContainText("Site visit");
    await expect(entry).toContainText("Montessa Heights");
  });

  test("PROJECT-DETAIL-049 - a scheduled site visit enquiry opens the referenced project", async ({
    page,
  }) => {
    const message = `Automated site visit ${Date.now()}`;
    await openSiteVisitForm(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await siteVisitEmailInput(page).fill("tester@example.com");
    await siteVisitMessageInput(page).fill(message);
    await siteVisitSubmitButton(page).click();
    await expect(page.getByText("Enquiry sent")).toBeVisible();

    await page.goto("/enquiries");
    const entry = page.locator("a", { hasText: message }).first();
    await expect(entry).toBeVisible();
    await expect(entry).toContainText("Site visit");
    await expect(entry).toContainText("Montessa Heights");

    // The freshly created enquiry is for this specific project.
    await entry.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Montessa Heights",
    );
  });
});
