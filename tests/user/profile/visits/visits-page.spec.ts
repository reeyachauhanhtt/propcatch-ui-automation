import { test, expect } from "@playwright/test";
import {
  openVisits,
  pastSectionHeading,
  visitCards,
  visitDateLine,
  visitLink,
  visitLocality,
  visitProjectName,
  visitStatusBadge,
  visitsHeading,
  visitsSubtitle,
} from "../../../../pages/user/visitsPage";

/**
 * Site Visits — page content (/visits).
 *
 * A read-only list of the signed-in user's site visits. Each card shows the
 * project name, a date/time line, the project locality, and a status badge, and
 * the whole card links to the project's details page. The "Past" section always
 * renders; the "Upcoming" section only appears while the account has future-dated
 * visits, which the seeded account does not (see pages/visitsPage.ts).
 *
 * Status values come straight from the backend and include raw values (e.g.
 * "no_show"), so assertions check the badge is present and non-empty rather than
 * pinning a fixed set of statuses.
 */
test.describe("Site Visits - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("VISIT-004 - the page shows its heading, subtitle and the Past section", async ({
    page,
  }) => {
    await openVisits(page);

    await expect(visitsHeading(page)).toBeVisible();
    await expect(visitsSubtitle(page)).toBeVisible();
    await expect(pastSectionHeading(page)).toBeVisible();
  });

  test("VISIT-005 - past visits are listed with a project name and date/time", async ({
    page,
  }) => {
    await openVisits(page);

    const cards = visitCards(page);
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const name = (await visitProjectName(card).innerText()).trim();
      expect(name.length).toBeGreaterThan(0);

      const date = (await visitDateLine(card).innerText()).trim();
      expect(date).toMatch(/\d{4}/); // contains a year, e.g. "Aug 20, 2026, 3:30 AM"
    }
  });

  test("VISIT-006 - each visit card shows the project locality", async ({
    page,
  }) => {
    await openVisits(page);

    const cards = visitCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const locality = (await visitLocality(cards.nth(i)).innerText()).trim();
      expect(locality.length).toBeGreaterThan(0);
    }
  });

  test("VISIT-007 - each visit card has a non-empty status badge", async ({
    page,
  }) => {
    await openVisits(page);

    const cards = visitCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(visitStatusBadge(cards.nth(i))).toBeVisible();
      const status = (await visitStatusBadge(cards.nth(i)).innerText()).trim();
      expect(status.length).toBeGreaterThan(0);
    }
  });

  test("VISIT-008 - each visit card links to its project's details page", async ({
    page,
  }) => {
    await openVisits(page);

    const cards = visitCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(visitLink(cards.nth(i))).toHaveAttribute(
        "href",
        /^\/p\/[\w-]+$/,
      );
    }
  });

  test("VISIT-009 - clicking a visit card opens the referenced project", async ({
    page,
  }) => {
    await openVisits(page);

    const card = visitCards(page).first();
    const project = (await visitProjectName(card).innerText()).trim();

    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project);
  });

  test("VISIT-010 - the visits page is read-only (no controls)", async ({
    page,
  }) => {
    await openVisits(page);

    await expect(page.locator("main button")).toHaveCount(0);
    await expect(
      page.locator("main input, main textarea, main select"),
    ).toHaveCount(0);
  });
});
