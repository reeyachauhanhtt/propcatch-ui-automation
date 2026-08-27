import { test, expect } from "@playwright/test";
import { cardName, projectCards } from "../../../pages/user/projectListingPage";
import {
  compareHeading,
  compareProjectNameLink,
  openCompareWithSelection,
} from "../../../pages/user/comparePage";

/**
 * Compare — project actions from the compare page.
 *
 * Actions verified as present and functional on /compare:
 *   - COMPARE-014: open a compared project's details page (name is a link).
 *
 * Actions intentionally NOT tested here because they do not work / do not
 * exist in the current app (see the task report):
 *   - COMPARE-011 (remove a project from the compare page): the per-column
 *     "Remove <Name> from compare" button is rendered but NON-FUNCTIONAL —
 *     clicking it changes nothing (no URL / slots / DOM change). Removal only
 *     works via the "Remove from compare" toggle on the /projects listing.
 *   - COMPARE-012 (remove all): not reachable — the only remove control on the
 *     compare page is the broken button above.
 *   - COMPARE-013 (add another project from the compare page): no such control
 *     exists on /compare; there is no "Add project"/"Add another" button or
 *     link.
 */
test.describe("Compare - project actions", () => {
  test.describe.configure({ timeout: 45_000 });

  test("COMPARE-014 - a compared project links to its details page", async ({
    page,
  }) => {
    await page.goto("/projects");
    const name = await cardName(projectCards(page).nth(0)).innerText();

    await openCompareWithSelection(page, 2);

    const link = compareProjectNameLink(page, name);
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  });

  test("COMPARE-014b - the compare header shows a per-project remove control", async ({
    page,
  }) => {
    await page.goto("/projects");
    const name = await cardName(projectCards(page).nth(0)).innerText();

    await openCompareWithSelection(page, 1);

    await expect(compareHeading(page)).toBeVisible();
    // The remove control is rendered and correctly labelled for the project.
    await expect(
      page.getByRole("button", { name: `Remove ${name} from compare` }),
    ).toBeVisible();
  });
});
