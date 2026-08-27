import { test, expect } from "@playwright/test";
import {
  openSavedSearches,
  savedSearchCards,
  savedSearchCriteria,
  savedSearchDeleteButton,
  savedSearchName,
  savedSearchNotifyLabel,
  savedSearchNotifyToggle,
  savedSearchesHeading,
  savedSearchesSubtitle,
} from "../../../../pages/user/savedSearchesPage";

/**
 * Saved Searches — page content (/saved-searches).
 *
 * A list of the signed-in user's saved searches. Each card shows a name and a
 * criteria line, a "Notify on new matches" toggle, and a Delete button. Cards
 * are plain list items (they don't link anywhere). Live-app note (2026-08-21):
 * the toggle works and persists; "Save this search" and Delete are rendered but
 * currently no-ops, so this spec only asserts the toggle's behaviour.
 */
test.describe("Saved Searches - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("SS-004 - the page shows its heading and subtitle", async ({ page }) => {
    await openSavedSearches(page);

    await expect(savedSearchesHeading(page)).toBeVisible();
    await expect(savedSearchesSubtitle(page)).toBeVisible();
  });

  test("SS-005 - saved searches are listed with a name and criteria", async ({
    page,
  }) => {
    await openSavedSearches(page);

    const cards = savedSearchCards(page);
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = (await savedSearchName(card).innerText()).trim();
      expect(name.length).toBeGreaterThan(0);

      const criteria = (await savedSearchCriteria(card).innerText()).trim();
      expect(criteria.length).toBeGreaterThan(0);
    }
  });

  test("SS-006 - each saved search has a Notify toggle and a Delete button", async ({
    page,
  }) => {
    await openSavedSearches(page);

    const cards = savedSearchCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await expect(savedSearchNotifyLabel(card)).toContainText(
        "Notify on new matches",
      );
      await expect(savedSearchNotifyToggle(card)).toBeVisible();
      await expect(savedSearchDeleteButton(card)).toBeVisible();
    }
  });

  test("SS-007 - the Notify toggle updates and persists across a reload", async ({
    page,
  }) => {
    await openSavedSearches(page);

    const card = savedSearchCards(page).first();
    const toggle = savedSearchNotifyToggle(card);
    await expect(toggle).toBeVisible();

    const initial = await toggle.isChecked();
    const flipped = !initial;

    await savedSearchNotifyLabel(card).click();
    await expect(toggle).toBeChecked({ checked: flipped });

    // The preference persists.
    await page.reload();
    await expect(savedSearchNotifyToggle(savedSearchCards(page).first())).toBeChecked(
      { checked: flipped },
    );

    // Restore the original state so the shared account is left as found.
    await savedSearchNotifyLabel(savedSearchCards(page).first()).click();
    await expect(savedSearchNotifyToggle(savedSearchCards(page).first())).toBeChecked(
      { checked: initial },
    );
  });

  test("SS-008 - the saved searches list is otherwise read-only", async ({
    page,
  }) => {
    await openSavedSearches(page);

    // Cards are plain list items — they don't link anywhere.
    await expect(page.locator("main a")).toHaveCount(0);
    // The only controls are the per-card toggles and Delete buttons.
    await expect(
      page.locator("main input[type='checkbox']").first(),
    ).toBeVisible();
  });
});
