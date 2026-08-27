import { test, expect } from "@playwright/test";
import {
  callLink,
  openProject,
  shareButton,
  whatsAppButton,
} from "../../../../pages/user/projectDetailsPage";

/**
 * Project Details — direct contact and share actions.
 *
 * These actions work without sign-in: Share, Call (tel:), and WhatsApp. Only
 * their presence and href are asserted here, not any downstream behaviour.
 */
test.describe("Project Details - Actions - Contact channels", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-034 - Share button is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(shareButton(page)).toBeVisible();
  });

  test("PROJECT-DETAIL-040 - Call action links to a phone number", async ({
    page,
  }) => {
    await openProject(page, "Montessa Heights");

    await expect(callLink(page)).toBeVisible();
    await expect(callLink(page)).toHaveAttribute("href", /^tel:/);
  });

  test("PROJECT-DETAIL-041 - WhatsApp action is displayed", async ({ page }) => {
    await openProject(page, "Montessa Heights");

    await expect(whatsAppButton(page)).toBeVisible();
  });
});
