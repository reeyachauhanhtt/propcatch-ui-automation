import { test, expect, type Page } from "@playwright/test";
import { loginAsUser } from "../../../../pages/user/auth";
import {
  openProject,
  siteVisitDialog,
  siteVisitEmailInput,
  siteVisitNameInput,
  siteVisitPhoneInput,
  siteVisitSubmitButton,
} from "../../../../pages/user/projectDetailsPage";

/**
 * Project Details — Contact builder (authenticated).
 *
 * "Contact builder" opens the same enquiry-form modal as Site Visit, with
 * name, phone, and email plus an "Anything specific?" message field. Submitting
 * creates a "General" enquiry under My Enquiries (/enquiries). The shared
 * siteVisit* field helpers are reused because the three modals (Site Visit,
 * Callback, Contact builder) use identical name/phone/email inputs.
 */
async function openContactModal(page: Page) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await page.getByRole("button", { name: "Contact builder" }).click();
}

test.describe("Project Details - Actions - Contact builder", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-052 - contact builder modal opens with the form", async ({
    page,
  }) => {
    await openContactModal(page);

    await expect(
      page.getByText("Our team will get back to you shortly."),
    ).toBeVisible();
    await expect(siteVisitNameInput(page)).toBeVisible();
    await expect(siteVisitPhoneInput(page)).toBeVisible();
    await expect(siteVisitEmailInput(page)).toBeVisible();
    await expect(page.getByPlaceholder("Anything specific?")).toBeVisible();
    await expect(siteVisitSubmitButton(page)).toBeVisible();

    await expect(
      siteVisitDialog(page).getByText("Montessa Heights", { exact: true }),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-053 - submitting a contact builder request shows a confirmation", async ({
    page,
  }) => {
    await openContactModal(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await siteVisitEmailInput(page).fill("tester@example.com");
    await page.getByPlaceholder("Anything specific?").fill("3 BHK enquiry");

    await siteVisitSubmitButton(page).click();

    await expect(page.getByText("Enquiry sent")).toBeVisible();
    await expect(
      page.getByText(/We've forwarded your contact builder for Montessa Heights/),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-054 - submitted contact builder appears in My Enquiries as General", async ({
    page,
  }) => {
    const message = `Automated contact ${Date.now()}`;
    await openContactModal(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await page.getByPlaceholder("Anything specific?").fill(message);
    await siteVisitSubmitButton(page).click();
    await expect(page.getByText("Enquiry sent")).toBeVisible();

    await page.goto("/enquiries");
    const entry = page.locator("a", { hasText: message }).first();
    await expect(entry).toBeVisible();
    await expect(entry).toContainText("General");
    await expect(entry).toContainText("Montessa Heights");
  });
});
