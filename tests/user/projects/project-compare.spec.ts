import { test, expect } from "@playwright/test";
import {
  addToCompareButton,
  cardName,
  compareTray,
  projectCards,
  removeFromCompareButton,
} from "../../../pages/user/projectListingPage";

/**
 * Project comparison behaviour on /projects (PUBLIC, no auth gate).
 */
test.describe("Project Listing - Compare", () => {
  test.describe.configure({ timeout: 45_000 });

  // ------------------------------------------------------------------
  // 9. Compare projects
  // ------------------------------------------------------------------

  test("PROJECT-022 - selecting one project for comparison updates the compare bar", async ({
    page,
  }) => {
    await page.goto("/projects");

    const card = projectCards(page).nth(0);
    await addToCompareButton(card).click();

    // After selection the same button relabels to "Remove from compare".
    await expect(removeFromCompareButton(card)).toBeVisible();
    await expect(removeFromCompareButton(card)).toHaveAttribute("aria-pressed", "true");
    await expect(compareTray(page)).toHaveText(/Compare 1 project/);
  });

  test("PROJECT-023 - selecting multiple projects for comparison", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();

    await expect(page.locator('a[href^="/p/"] button[aria-pressed="true"]')).toHaveCount(2);
    await expect(compareTray(page)).toHaveText(/Compare 2 projects/);
  });

  test("PROJECT-024 - opening Compare shows the selected projects", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    const name0 = await cardName(cards.nth(0)).innerText();
    const name1 = await cardName(cards.nth(1)).innerText();
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();

    await compareTray(page).click();

    await expect(page).toHaveURL(/\/compare\?p=/);
    await expect(page.getByText(/2 of 3 slots used/)).toBeVisible();
    await expect(page.locator("main")).toContainText(name0);
    await expect(page.locator("main")).toContainText(name1);
  });

  test("PROJECT-025 - removing a project from comparison", async ({ page }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();
    await expect(compareTray(page)).toHaveText(/Compare 2 projects/);

    await removeFromCompareButton(cards.nth(0)).click();

    await expect(page.locator('a[href^="/p/"] button[aria-pressed="true"]')).toHaveCount(1);
    await expect(compareTray(page)).toHaveText(/Compare 1 project/);
  });

  test("PROJECT-026 - clearing all comparison selections hides the compare bar", async ({
    page,
  }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    await addToCompareButton(cards.nth(0)).click();
    await addToCompareButton(cards.nth(1)).click();
    await expect(compareTray(page)).toHaveText(/Compare 2 projects/);

    await removeFromCompareButton(cards.nth(0)).click();
    await removeFromCompareButton(cards.nth(1)).click();

    await expect(page.locator('a[href^="/p/"] button[aria-pressed="true"]')).toHaveCount(0);
    await expect(compareTray(page)).toHaveCount(0);
  });

  test("PROJECT-027 - comparison is limited to 3 projects", async ({ page }) => {
    await page.goto("/projects");

    const cards = projectCards(page);
    for (let i = 0; i < 3; i++) {
      await addToCompareButton(cards.nth(i)).click();
    }
    await expect(page.locator('a[href^="/p/"] button[aria-pressed="true"]')).toHaveCount(3);
    await expect(compareTray(page)).toHaveText(/Compare 3 projects/);

    await addToCompareButton(cards.nth(3)).click();
    await expect(page.locator('a[href^="/p/"] button[aria-pressed="true"]')).toHaveCount(3);
    await expect(addToCompareButton(cards.nth(3))).toHaveAttribute(
      "aria-label",
      "Add to compare",
    );
  });
});
