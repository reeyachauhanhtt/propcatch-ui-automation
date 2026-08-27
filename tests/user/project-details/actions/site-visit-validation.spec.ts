import { test, expect, type Page } from "@playwright/test";
import { loginAsUser } from "../../../../pages/user/auth";
import {
  openProject,
  siteVisitButton,
  siteVisitNameInput,
  siteVisitPhoneInput,
  siteVisitSubmitButton,
} from "../../../../pages/user/projectDetailsPage";

/**
 * Project Details — Site Visit form validation (authenticated).
 *
 * The dialog has no inline error messages; instead the Submit button stays
 * disabled until "Your name" and a valid 10-digit "Phone" are provided. Email
 * and message are optional. Validation is asserted purely via the Submit
 * button's disabled state.
 */
async function openSiteVisitForm(page: Page) {
  await loginAsUser(page);
  await openProject(page, "Montessa Heights");
  await siteVisitButton(page).click();
}

test.describe("Project Details - Actions - Site Visit validation", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-046 - submit is disabled until name and phone are provided", async ({
    page,
  }) => {
    await openSiteVisitForm(page);
    const submit = siteVisitSubmitButton(page);

    await expect(submit).toBeDisabled();

    await siteVisitNameInput(page).fill("Automation Tester");
    await expect(submit).toBeDisabled();

    await siteVisitNameInput(page).fill("");
    await siteVisitPhoneInput(page).fill("9876543210");
    await expect(submit).toBeDisabled();

    await siteVisitNameInput(page).fill("Automation Tester");
    await expect(submit).toBeEnabled();
  });

  test("PROJECT-DETAIL-047 - phone must be a 10-digit mobile number", async ({
    page,
  }) => {
    await openSiteVisitForm(page);
    const submit = siteVisitSubmitButton(page);
    await siteVisitNameInput(page).fill("Automation Tester");

    await siteVisitPhoneInput(page).fill("12345");
    await expect(submit).toBeDisabled();

    await siteVisitPhoneInput(page).fill("abcdefghij");
    await expect(submit).toBeDisabled();

    await siteVisitPhoneInput(page).fill("9876543210");
    await expect(submit).toBeEnabled();
  });

  test("PROJECT-DETAIL-048 - email and message are optional", async ({ page }) => {
    await openSiteVisitForm(page);

    await siteVisitNameInput(page).fill("Automation Tester");
    await siteVisitPhoneInput(page).fill("9876543210");

    // Email and message left empty — submit should still be enabled.
    await expect(siteVisitSubmitButton(page)).toBeEnabled();
  });
});
