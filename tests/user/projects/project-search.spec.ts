import { test, expect } from "@playwright/test";
import {
  emptyStateMessage,
  expectCardCountMatchesLabel,
  expectFullListing,
  expectShownOfTotal,
  projectCardByName,
  projectCards,
  readCountFromLabel,
  searchInput,
} from "../../../pages/user/projectListingPage";

/**
 * Project search behaviour on /projects (PUBLIC, no auth gate).
 */
test.describe("Project Listing - Search", () => {
  test.describe.configure({ timeout: 45_000 });

  // ------------------------------------------------------------------
  // 4. Search
  // ------------------------------------------------------------------

  test("PROJECT-007 - project search input is visible", async ({ page }) => {
    await page.goto("/projects");

    await expect(searchInput(page)).toBeVisible();
    await expect(searchInput(page)).toHaveAttribute(
      "placeholder",
      /Search project, locality, builder/,
    );
  });

  test("PROJECT-008 - searching an exact project name shows the project", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("Montessa Heights");

    await expectShownOfTotal(page, 1, total);
    await expect(projectCardByName(page, "Montessa Heights")).toHaveCount(1);
  });

  test("PROJECT-009 - searching a partial project name shows matching projects", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("Palm");

    // The list re-renders asynchronously after typing; poll until it settles.
    // ("Palm" matches exactly two projects by name: Palm Grove Villas and
    // Palm Residency.)
    await expect
      .poll(async () =>
        (
          await page.locator('a[href^="/p/"] h3').allInnerTexts()
        ).every((name) => name.includes("Palm")),
      )
      .toBe(true);
    await expectShownOfTotal(page, 2, total);
    const names = await page.locator('a[href^="/p/"] h3').allInnerTexts();
    expect(names.length).toBe(2);
    for (const name of names) {
      expect(name).toContain("Palm");
    }
    await expectCardCountMatchesLabel(page);
  });

  test("PROJECT-010 - searching a non-existing project name shows the empty state", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("zzzz-no-such-project");

    await expectShownOfTotal(page, 0, total);
    await expect(emptyStateMessage(page)).toBeVisible();
  });

  test("PROJECT-011 - clearing the search restores the project listing", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("Montessa");
    await expect(projectCards(page)).toHaveCount(1);

    await searchInput(page).fill("");
    await expectFullListing(page, total);
  });

  test("PROJECT-012 - empty search input keeps the full listing", async ({
    page,
  }) => {
    await page.goto("/projects");

    await expect(searchInput(page)).toHaveValue("");
    await expectFullListing(page);
  });

  test("PROJECT-013 - search with leading/trailing spaces still matches", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("  Montessa Heights  ");

    await expect(projectCardByName(page, "Montessa Heights")).toHaveCount(1);
    await expectShownOfTotal(page, 1, total);
  });

  // ------------------------------------------------------------------
  // 11. Empty states
  // ------------------------------------------------------------------

  test("PROJECT-028 - search with no results shows an empty state and recovers", async ({
    page,
  }) => {
    await page.goto("/projects");
    const { total } = await readCountFromLabel(page);

    await searchInput(page).fill("zzzz-no-such-project");
    await expect(emptyStateMessage(page)).toBeVisible();
    await expect(projectCards(page)).toHaveCount(0);

    await searchInput(page).fill("");
    await expectFullListing(page, total);
  });
});
