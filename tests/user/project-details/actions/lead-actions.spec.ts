import { test, expect } from "@playwright/test";
import {
  contactBuilderButton,
  openProject,
  requestCallbackButton,
  saveToShortlistButton,
} from "../../../../pages/user/projectDetailsPage";
import { anonymousStorageState } from "../../../../pages/user/auth";


// This file asserts anonymous / login-gate behaviour; do not reuse saved session.
test.use({ storageState: anonymousStorageState });

/**
 * Project Details — sign-in gated lead actions.
 *
 * These CTAs (Contact builder, Request a callback, Save to shortlist) require
 * sign-in: clicking them as an anonymous visitor redirects to
 * /login?next=<project>.
 */
test.describe("Project Details - Actions - Lead actions", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-037 - Contact builder is gated behind sign-in", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await contactBuilderButton(page).click();

    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("PROJECT-DETAIL-038 - Request a callback is gated behind sign-in", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await requestCallbackButton(page).click();

    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("PROJECT-DETAIL-039 - Save to shortlist is gated behind sign-in", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await saveToShortlistButton(page).click();

    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("PROJECT-DETAIL-042 - sign-in gate notice is shown for gated actions", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await expect(
      page.getByText(/Sign in to book a visit or contact the builder/),
    ).toBeVisible();
  });
});
