import { test, expect } from "@playwright/test";
import { cardName, projectCards } from "../../../pages/user/projectListingPage";
import {
  COMPARE_FIELDS,
  compareHeading,
  compareProjectNameLink,
  compareTable,
  openCompareWithSelection,
  slotsLabel,
} from "../../../pages/user/comparePage";

/**
 * Compare — page layout (/compare). The page is PUBLIC and URL-driven.
 *
 * Layout: an <h1> "Compare", a "N of 3 slots used" subtitle, and a comparison
 * table with one header column per project and one row per attribute (Status,
 * Location, Builder, Price, Configuration, Area range, Possession, RERA,
 * Total units).
 */
test.describe("Compare - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("COMPARE-006 - opening Compare after selecting projects shows them", async ({
    page,
  }) => {
    await page.goto("/projects");
    const cards = projectCards(page);
    const name0 = await cardName(cards.nth(0)).innerText();
    const name1 = await cardName(cards.nth(1)).innerText();

    await openCompareWithSelection(page, 2);

    await expect(page).toHaveURL(/\/compare\?p=.*&p=/);
    await expect(compareHeading(page)).toBeVisible();
    await expect(slotsLabel(page)).toHaveText("2 of 3 slots used");
    await expect(compareProjectNameLink(page, name0)).toBeVisible();
    await expect(compareProjectNameLink(page, name1)).toBeVisible();
  });

  test("COMPARE-007 - the compared project names are shown", async ({ page }) => {
    const cards = projectCards(page);
    await page.goto("/projects");
    const name0 = await cardName(cards.nth(0)).innerText();
    const name1 = await cardName(cards.nth(1)).innerText();
    const name2 = await cardName(cards.nth(2)).innerText();

    await openCompareWithSelection(page, 3);

    await expect(page.locator("main")).toContainText(name0);
    await expect(page.locator("main")).toContainText(name1);
    await expect(page.locator("main")).toContainText(name2);
  });

  test("COMPARE-008 - the comparison table shows the project attributes", async ({
    page,
  }) => {
    await openCompareWithSelection(page, 2);

    await expect(compareTable(page)).toBeVisible();
    for (const label of COMPARE_FIELDS) {
      await expect(
        compareTable(page).getByText(new RegExp(`^${label}$`, "i")),
      ).toBeVisible();
    }
  });

  test("COMPARE-009 - multiple projects are shown side-by-side", async ({
    page,
  }) => {
    await openCompareWithSelection(page, 3);

    await expect(slotsLabel(page)).toHaveText("3 of 3 slots used");
    // One header column (card + remove control) per compared project.
    await expect(
      page.getByRole("button", { name: /Remove .+ from compare/ }),
    ).toHaveCount(3);
    const columns = await compareTable(page).locator("thead th").count();
    expect(columns).toBe(4); // 1 label column + 3 project columns
  });

  test("COMPARE-010 - navigating back from Compare returns to the projects page", async ({
    page,
  }) => {
    await openCompareWithSelection(page, 2);

    await page
      .getByRole("banner")
      .getByRole("link", { name: "Projects", exact: true })
      .click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(
      page.getByRole("heading", { name: "Projects", exact: true }),
    ).toBeVisible();
  });
});
