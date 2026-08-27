import { test, expect } from "@playwright/test";
import { anonymousStorageState, loginAsUser, headerProfileLink, headerSignInLink } from "../../../pages/user/auth";
import {
  addToCompareButton,
  cardName,
  compareTray,
  projectCards,
} from "../../../pages/user/projectListingPage";
import {
  browseProjectsLink,
  compareHeading,
  compareProjectNameLink,
  emptyStateHeading,
  openCompareWithSelection,
  slotsLabel,
} from "../../../pages/user/comparePage";

/**
 * Compare — validation & edge cases.
 *
 * The compare page is PUBLIC and URL-driven. There is NO minimum-project
 * requirement (one project is allowed), a hard maximum of 3 projects, and no
 * localStorage/server persistence — only the query string. Refreshing keeps
 * the comparison; navigating to a fresh /compare resets it.
 */
test.describe("Compare - validation", () => {
  test.describe.configure({ timeout: 45_000 });

  test("COMPARE-015 - opening Compare without a selection shows an empty state", async ({
    page,
  }) => {
    await page.goto("/compare");

    await expect(page).toHaveURL(/\/compare$/);
    await expect(emptyStateHeading(page)).toBeVisible();
    await expect(
      page.getByText(
        /Pick up to 3 projects from the browse page and open Compare/,
      ),
    ).toBeVisible();
    await expect(browseProjectsLink(page)).toBeVisible();
    await expect(browseProjectsLink(page)).toHaveAttribute("href", "/projects");
  });

  test("COMPARE-016 - comparing a single project is allowed (no minimum)", async ({
    page,
  }) => {
    await openCompareWithSelection(page, 1);

    await expect(slotsLabel(page)).toHaveText("1 of 3 slots used");
    await expect(
      page.getByRole("button", { name: /Remove .+ from compare/ }),
    ).toHaveCount(1);
  });

  test("COMPARE-017 - selecting the maximum of 3 projects works", async ({
    page,
  }) => {
    await openCompareWithSelection(page, 3);

    await expect(slotsLabel(page)).toHaveText("3 of 3 slots used");
    await expect(
      page.getByRole("button", { name: /Remove .+ from compare/ }),
    ).toHaveCount(3);
  });

  test("COMPARE-018 - selecting a 4th project is prevented", async ({ page }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    for (let i = 0; i < 3; i++) {
      await addToCompareButton(cards.nth(i)).click();
    }
    await expect(compareTray(page)).toHaveText(/Compare 3 projects/);

    // Attempting to add a 4th project is silently ignored.
    await addToCompareButton(cards.nth(3)).click();

    await expect(
      page.locator('a[href^="/p/"] button[aria-pressed="true"]'),
    ).toHaveCount(3);
    await expect(addToCompareButton(cards.nth(3))).toHaveAttribute(
      "aria-label",
      "Add to compare",
    );
    await expect(compareTray(page)).toHaveText(/Compare 3 projects/);
  });

  test("COMPARE-019 - refreshing the compare page preserves the comparison", async ({
    page,
  }) => {
    const cards = projectCards(page);
    await page.goto("/projects");
    const name0 = await cardName(cards.nth(0)).innerText();
    const name1 = await cardName(cards.nth(1)).innerText();

    await openCompareWithSelection(page, 2);
    await page.reload();

    await expect(page).toHaveURL(/\/compare\?p=.*&p=/);
    await expect(slotsLabel(page)).toHaveText("2 of 3 slots used");
    await expect(compareProjectNameLink(page, name0)).toBeVisible();
    await expect(compareProjectNameLink(page, name1)).toBeVisible();
  });

  test("COMPARE-020 - navigating away and back preserves the comparison", async ({
    page,
  }) => {
    const cards = projectCards(page);
    await page.goto("/projects");
    const name0 = await cardName(cards.nth(0)).innerText();

    await openCompareWithSelection(page, 2);

    // Navigate to a compared project's details page, then come back via
    // browser history — the query-string comparison is preserved.
    await compareProjectNameLink(page, name0).click();
    await expect(page).toHaveURL(/\/p\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/compare\?p=.*&p=/);
    await expect(slotsLabel(page)).toHaveText("2 of 3 slots used");
    await expect(compareProjectNameLink(page, name0)).toBeVisible();
  });

  test.describe("Unauthenticated access", () => {
    test.use({ storageState: anonymousStorageState });

    test("COMPARE-021 - an unauthenticated user can access the public Compare page", async ({
      page,
    }) => {
      await page.goto("/compare");

      await expect(page).toHaveURL(/\/compare$/);
      await expect(emptyStateHeading(page)).toBeVisible();
      // Public: no redirect to /login; the anonymous header shows "Sign in".
      await expect(headerSignInLink(page)).toBeVisible();
      await expect(headerProfileLink(page)).toHaveCount(0);
    });
  });

  test("COMPARE-022 - an authenticated user can use Compare", async ({ page }) => {
    await loginAsUser(page);

    await page.goto("/compare");

    await expect(emptyStateHeading(page)).toBeVisible();
    await expect(headerProfileLink(page)).toBeVisible();
    await expect(headerSignInLink(page)).toHaveCount(0);
  });
});
