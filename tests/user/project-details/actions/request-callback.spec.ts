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
 * Project Details — Request a callback (authenticated).
 *
 * "Request a callback" opens the same enquiry-form modal as Site Visit, with
 * name, phone, and email plus a "When should we call?" message field. Submitting
 * creates a "Callback" enquiry under My Enquiries (/enquiries). The shared
 * siteVisit* field helpers are reused because the three modals (Site Visit,
 * Callback, Contact builder) use identical name/phone/email inputs.
 */
async function openCallbackModal(page: Page) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await page.getByRole("button", { name: "Request a callback" }).click();
}

test.describe("Project Details - Actions - Request a callback", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-049 - request callback modal opens with the form", async ({
    page,
  }) => {
    await openCallbackModal(page);

    await expect(
      page.getByText("We'll call you back on the number below."),
    ).toBeVisible();
    await expect(siteVisitNameInput(page)).toBeVisible();
    await expect(siteVisitPhoneInput(page)).toBeVisible();
    await expect(siteVisitEmailInput(page)).toBeVisible();
    await expect(page.getByPlaceholder("When should we call?")).toBeVisible();
    await expect(siteVisitSubmitButton(page)).toBeVisible();

    await expect(
      siteVisitDialog(page).getByText("Montessa Heights", { exact: true }),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-050 - submitting a callback request shows a confirmation", async ({
    page,
  }) => {
    await openCallbackModal(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await siteVisitEmailInput(page).fill("tester@example.com");
    await page.getByPlaceholder("When should we call?").fill("After 5pm");

    await siteVisitSubmitButton(page).click();

    await expect(page.getByText("Enquiry sent")).toBeVisible();
    await expect(
      page.getByText(/We've forwarded your request a callback for Montessa Heights/),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-051 - submitted callback appears in My Enquiries as Callback", async ({
    page,
  }) => {
    const message = `Automated callback ${Date.now()}`;
    await openCallbackModal(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");
    await page.getByPlaceholder("When should we call?").fill(message);
    await siteVisitSubmitButton(page).click();
    await expect(page.getByText("Enquiry sent")).toBeVisible();

    await page.goto("/enquiries");
    const entry = page.locator("a", { hasText: message }).first();
    await expect(entry).toBeVisible();
    await expect(entry).toContainText("Callback");
    await expect(entry).toContainText("Montessa Heights");
  });
});
