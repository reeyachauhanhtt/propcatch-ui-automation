import { test, expect } from "@playwright/test";
import {
  addToCompareButton,
  compareTray,
  projectCards,
  removeFromCompareButton,
} from "../../../pages/user/projectListingPage";

/**
 * Compare — selection on the /projects listing (PUBLIC, no auth gate).
 *
 * Each project card carries an "Add to compare" toggle (aria-label). Selecting
 * a card flips the toggle to "Remove from compare" (aria-pressed="true") and
 * surfaces a fixed bottom tray "Compare N project(s) →". A card is a boolean
 * toggle — there is no duplicate selection.
 */
test.describe("Compare - selection", () => {
  test.describe.configure({ timeout: 45_000 });

  test("COMPARE-001 - compare control is available on project cards", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await expect(cards.first()).toBeVisible();
    await expect(addToCompareButton(cards.first())).toBeVisible();
    // Every listed card exposes the compare toggle.
    const total = await cards.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      await expect(addToCompareButton(cards.nth(i))).toBeVisible();
    }
  });

  test("COMPARE-002 - selecting one project updates the compare state", async ({
    page,
  }) => {
    await page.goto("/projects");

    const card = projectCards(page).nth(0);
    await addToCompareButton(card).click();

    // The same toggle flips to "Remove from compare".
    await expect(removeFromCompareButton(card)).toBeVisible();
    await expect(removeFromCompareButton(card)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(compareTray(page)).toHaveText(/Compare 1 project/);
  });

  test("COMPARE-003 - selecting multiple projects updates the count", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();

    await expect(
      page.locator('a[href^="/p/"] button[aria-pressed="true"]'),
    ).toHaveCount(2);
    await expect(compareTray(page)).toHaveText(/Compare 2 projects/);
  });

  test("COMPARE-004 - deselecting a project updates the compare state", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();
    await expect(compareTray(page)).toHaveText(/Compare 2 projects/);

    await removeFromCompareButton(cards.nth(0)).click();

    await expect(
      page.locator('a[href^="/p/"] button[aria-pressed="true"]'),
    ).toHaveCount(1);
    await expect(compareTray(page)).toHaveText(/Compare 1 project/);
    // The deselected card reverts to "Add to compare".
    await expect(addToCompareButton(cards.nth(0))).toBeVisible();
  });

  test("COMPARE-005 - re-clicking a selected project toggles it off (no duplicates)", async ({
    page,
  }) => {
    await page.goto("/projects");

    const card = projectCards(page).nth(0);
    await addToCompareButton(card).click();
    await expect(removeFromCompareButton(card)).toBeVisible();

    // The same card is now a "Remove from compare" toggle — clicking it again
    // deselects the project rather than adding a duplicate.
    await removeFromCompareButton(card).click();

    await expect(
      page.locator('a[href^="/p/"] button[aria-pressed="true"]'),
    ).toHaveCount(0);
    await expect(addToCompareButton(card)).toBeVisible();
    await expect(compareTray(page)).toHaveCount(0);
  });
});
