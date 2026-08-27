import { test, expect } from "@playwright/test";
import { loginAsUser } from "../../../pages/user/auth";
import {
  openShortlist,
  readShortlistCount,
  setShortlistState,
  shortlistCards,
  shortlistCount,
  shortlistHeading,
} from "../../../pages/user/shortlistPage";

const PROJECT = "Montessa Heights";

/**
 * Shortlist — add/remove, page, and persistence.
 *
 * These tests mutate shared (server-side) shortlist state on the test account,
 * so they run SERIALLY. Each mutating test signs in once, forces its own
 * precondition with setShortlistState(), and cleans up, so the suite is
 * idempotent regardless of leftover state from a prior run.
 */
test.describe("Shortlist", () => {
  test.describe.configure({ mode: "serial", timeout: 45_000 });

  test("SHORT-005 - the details page shows a shortlist control", async ({
    page,
  }) => {
    await loginAsUser(page);
    await setShortlistState(page, PROJECT, false);

    await expect(
      page.getByRole("button", { name: "Save to shortlist", exact: true }),
    ).toBeVisible();
  });

  test("SHORT-006 - saving toggles the control to 'Saved to shortlist'", async ({
    page,
  }) => {
    await loginAsUser(page);
    await setShortlistState(page, PROJECT, false);

    await page
      .getByRole("button", { name: "Save to shortlist", exact: true })
      .click();

    await expect(
      page.getByRole("button", { name: "Saved to shortlist", exact: true }),
    ).toBeVisible();
    // Saving does not navigate away from the details page.
    await expect(page).toHaveURL(/\/p\//);

    await setShortlistState(page, PROJECT, false);
  });

  test("SHORT-007 - a saved project appears on the shortlist page", async ({
    page,
  }) => {
    await loginAsUser(page);
    await setShortlistState(page, PROJECT, true);

    await page.goto("/shortlist");
    await expect(shortlistHeading(page)).toBeVisible();
    await expect(shortlistCount(page)).toBeVisible();
    await expect(
      page.locator("main").getByText(PROJECT, { exact: true }),
    ).toBeVisible();

    await setShortlistState(page, PROJECT, false);
  });

  test("SHORT-008 - removing a project decrements the shortlist count", async ({
    page,
  }) => {
    await loginAsUser(page);
    await setShortlistState(page, PROJECT, true);
    await page.goto("/shortlist");
    const before = await readShortlistCount(page);

    await setShortlistState(page, PROJECT, false);
    await page.goto("/shortlist");

    const after = await readShortlistCount(page);
    expect(after).toBe(before - 1);
    await expect(
      page.locator("main").getByText(PROJECT, { exact: true }),
    ).toHaveCount(0);
  });

  test("SHORT-009 - the shortlist page shows the count and project cards", async ({
    page,
  }) => {
    await openShortlist(page);

    await expect(shortlistHeading(page)).toBeVisible();
    await expect(shortlistCount(page)).toHaveText(/\d+ saved project/);
    await expect(shortlistCards(page).first()).toBeVisible();
  });

  test("SHORT-010 - a shortlisted card opens its project details page", async ({
    page,
  }) => {
    await openShortlist(page);

    const card = shortlistCards(page).first();
    const name = (await card.getByRole("heading", { level: 3 }).innerText()).trim();

    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  });

  test("SHORT-011 - the shortlist persists across a reload", async ({ page }) => {
    await loginAsUser(page);
    await setShortlistState(page, PROJECT, true);
    await page.goto("/shortlist");
    const before = await readShortlistCount(page);

    await page.reload();

    await expect(shortlistCount(page)).toHaveText(`${before} saved projects`);
    await expect(
      page.locator("main").getByText(PROJECT, { exact: true }),
    ).toBeVisible();

    await setShortlistState(page, PROJECT, false);
  });
});
