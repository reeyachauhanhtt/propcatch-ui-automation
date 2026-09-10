import { test, expect } from "@playwright/test";
import {
  builderCardByName,
  builderCardLogo,
  builderCardMonogram,
  builderCardProjectCount,
  builderCards,
  builderH1,
  builderName,
  buildersHeading,
  buildersSubtitle,
  openBuilders,
} from "../../../pages/user/buildersPage";

/**
 * Builders — listing page (/builders).
 *
 * A public, read-only directory of real-estate builders. The page shows the h1
 * "Builders" with a "N verified · N listed" summary, then one card per builder
 * sorted alphabetically. Each card links to /b/<uuid> and shows a monogram or
 * logo, the builder name, and an "N projects" count. There is no search, no
 * filters, and no other control.
 *
 * Seeded data (verified 2026-08-26): 8 builders, 5 of them verified.
 */
test.describe("Builders - listing", () => {
  test.describe.configure({ timeout: 45_000 });

  test("BUILDERS-001 - the page shows the heading and the verified/listed summary", async ({
    page,
  }) => {
    await openBuilders(page);

    await expect(buildersHeading(page)).toBeVisible();
    await expect(buildersSubtitle(page)).toBeVisible();
  });

  test("BUILDERS-002 - the listing is public and loads without signing in", async ({
    page,
  }) => {
    await page.goto("/builders");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/\/builders$/);
    await expect(buildersHeading(page)).toBeVisible();
  });

  test("BUILDERS-003 - all seeded builders are listed", async ({ page }) => {
    await openBuilders(page);

    const subtitle = (await buildersSubtitle(page).innerText()).trim();
    const listed = Number(subtitle.match(/(\d+) listed/)?.[1]);
    expect(listed).toBeGreaterThan(0);
    await expect(builderCards(page)).toHaveCount(listed);

    const seeded = [
      "Acme Realty",
      "Elite Homes",
      "Happy Homes",
      "PrimeBuild Infra",
      "Shiv Developers",
      "Skyline Group",
      "UrbanEdge Realty",
      "Vertex Commercial Spaces",
    ];
    for (const name of seeded) {
      await expect(builderCardByName(page, name)).toBeVisible();
    }
  });

  test("BUILDERS-004 - builders are sorted alphabetically", async ({ page }) => {
    await openBuilders(page);

    const names = (
      await builderCards(page).locator("div.truncate.font-semibold").allInnerTexts()
    ).map((n) => n.trim());

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test("BUILDERS-005 - each card shows a name, project count, and links to /b/<uuid>", async ({
    page,
  }) => {
    await openBuilders(page);

    const cards = builderCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const name = (await builderName(card).innerText()).trim();
      expect(name.length).toBeGreaterThan(0);

      const projects = (await builderCardProjectCount(card).innerText()).trim();
      expect(projects).toMatch(/^\d+ projects?$/);

      await expect(card).toHaveAttribute("href", /^\/b\/[\w-]+$/);
    }
  });

  test("BUILDERS-006 - each card shows a logo image or a monogram", async ({
    page,
  }) => {
    await openBuilders(page);

    const cards = builderCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const hasLogo = (await builderCardLogo(card).count()) === 1;
      const monogram = (await builderCardMonogram(card).innerText()).trim();

      // Builders either show a logo image or fall back to their initials.
      expect(hasLogo || monogram.length > 0).toBe(true);
    }
  });

  test("BUILDERS-007 - the listing is read-only (no controls)", async ({
    page,
  }) => {
    await openBuilders(page);

    await expect(page.locator("main button")).toHaveCount(0);
    await expect(
      page.locator("main input, main textarea, main select"),
    ).toHaveCount(0);
  });

  test("BUILDERS-008 - clicking a builder card opens that builder's detail page", async ({
    page,
  }) => {
    await openBuilders(page);

    const card = builderCards(page).first();
    const name = (await builderName(card).innerText()).trim();

    await card.click();

    await expect(page).toHaveURL(/\/b\//);
    await expect(builderH1(page)).toHaveText(name);
  });
});
