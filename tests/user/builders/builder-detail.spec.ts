import { test, expect } from "@playwright/test";
import {
  builderCardByName,
  builderCardProjectCount,
  builderH1,
  builderLogo,
  builderMonogram,
  builderProjectCards,
  builderTagline,
  cardLocality,
  cardPrice,
  cardStatusBadge,
  openBuilders,
  openBuilder,
  projectsHeading,
  statLabel,
  statValue,
  verifiedBadge,
  websiteLink,
} from "../../../pages/user/buildersPage";
import { addToCompareButton, cardName } from "../../../pages/user/projectListingPage";

/**
 * Builders — individual builder page (/b/<uuid>).
 *
 * A public page for one builder: a header card (logo or monogram, the builder
 * name, and OPTIONAL Verified badge / tagline / Website link), a 3-up stats row
 * (Years in business / Active projects / Delivered), and a "Projects by <name>"
 * section of project cards. Each project card is the same component as on
 * /projects: status badge, name, locality, price, and an "Add to compare"
 * button; clicking it opens the project details page.
 *
 * Field presence varies by seed data (see pages/buildersPage.ts): e.g. Skyline
 * Group and Elite Homes are verified; Acme Realty is not, has no tagline, and
 * has no Website link.
 */
test.describe("Builders - detail", () => {
  test.describe.configure({ timeout: 45_000 });

  test("BUILDER-010 - the builder's name is the page h1", async ({ page }) => {
    await openBuilder(page, "Shiv Developers");

    await expect(page).toHaveURL(/\/b\//);
    await expect(builderH1(page)).toHaveText("Shiv Developers");
  });

  test("BUILDER-011 - a builder with a logo shows it as the header image", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    const logo = builderLogo(page);
    await expect(logo).toHaveCount(1);
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("alt", "Shiv Developers logo");
  });

  test("BUILDER-012 - a builder without a logo falls back to a monogram", async ({
    page,
  }) => {
    await openBuilder(page, "Acme Realty");

    await expect(builderLogo(page)).toHaveCount(0);
    const monogram = (await builderMonogram(page).innerText()).trim();
    expect(monogram.length).toBeGreaterThan(0);
  });

  test("BUILDER-013 - verified builders show a Verified badge", async ({
    page,
  }) => {
    await openBuilder(page, "Skyline Group");

    await expect(verifiedBadge(page)).toBeVisible();
  });

  test("BUILDER-014 - unverified builders show no Verified badge", async ({
    page,
  }) => {
    await openBuilder(page, "Acme Realty");

    await expect(verifiedBadge(page)).toHaveCount(0);
  });

  test("BUILDER-015 - a builder with a tagline displays it", async ({
    page,
  }) => {
    await openBuilder(page, "Elite Homes");

    await expect(builderTagline(page)).toBeVisible();
    expect((await builderTagline(page).innerText()).trim().length).toBeGreaterThan(
      0,
    );
  });

  test("BUILDER-016 - the Website link opens in a new tab", async ({ page }) => {
    await openBuilder(page, "Elite Homes");

    const link = websiteLink(page);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", /^https?:\/\//);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("BUILDER-017 - a builder without a website shows no Website link", async ({
    page,
  }) => {
    await openBuilder(page, "Acme Realty");

    await expect(websiteLink(page)).toHaveCount(0);
  });

  test("BUILDER-018 - the stats row shows years in business, active projects, and delivered", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    for (const label of ["Years in business", "Active projects", "Delivered"]) {
      await expect(statLabel(page, label)).toBeVisible();
      const value = (await statValue(page, label).innerText()).trim();
      expect(value).toMatch(/^\d+$/);
    }
  });

  test("BUILDER-019 - the Projects by <name> section lists the builder's projects", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    await expect(projectsHeading(page)).toHaveText("Projects by Shiv Developers");
    await expect(builderProjectCards(page).first()).toBeVisible();
    expect(await builderProjectCards(page).count()).toBeGreaterThanOrEqual(1);
  });

  test("BUILDER-020 - each project card shows status, name, locality, and price", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    const cards = builderProjectCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      await expect(cardStatusBadge(card)).toBeVisible();
      const status = (await cardStatusBadge(card).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);

      const name = (await cardName(card).innerText()).trim();
      expect(name.length).toBeGreaterThan(0);

      await expect(cardLocality(card)).toBeVisible();
      await expect(cardPrice(card)).toBeVisible();
    }
  });

  test("BUILDER-021 - each project card has an Add to compare button", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    const cards = builderProjectCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      await expect(addToCompareButton(cards.nth(i))).toBeVisible();
      await expect(addToCompareButton(cards.nth(i))).toHaveAttribute(
        "aria-pressed",
        /^(true|false)$/,
      );
    }
  });

  test("BUILDER-022 - the listing's project count matches the detail section", async ({
    page,
  }) => {
    await openBuilders(page);

    const card = builderCardByName(page, "Shiv Developers");
    const projectsText = (await builderCardProjectCount(card).innerText()).trim();
    const expected = Number(projectsText.match(/^\d+/)?.[0]);
    expect(Number.isInteger(expected)).toBe(true);

    await card.click();
    await expect(page).toHaveURL(/\/b\//);

    await expect(builderProjectCards(page)).toHaveCount(expected);
  });

  test("BUILDER-023 - clicking a project card opens the project's details page", async ({
    page,
  }) => {
    await openBuilder(page, "Shiv Developers");

    const card = builderProjectCards(page).first();
    const project = (await cardName(card).innerText()).trim();

    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project);
  });
});
