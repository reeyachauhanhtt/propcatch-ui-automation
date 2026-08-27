import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";
import { openProject } from "./projectDetailsPage";

/**
 * Locators and helpers for the PropCatch Shortlist (/shortlist).
 *
 * Shortlisting is AUTH-GATED: the header icon is hidden from anonymous users,
 * /shortlist redirects to /login?next=%2Fshortlist, and an anonymous "Save to
 * shortlist" click redirects to /login?next=/p/<uuid>.
 *
 * The shortlist is SERVER-SIDE (Supabase) and toggled ONLY from the project
 * details page via "Save to shortlist" ⇄ "Saved to shortlist". The /shortlist
 * page is a read-only grid of cards (no remove control) with an "N saved
 * projects" subtitle. There is no header badge/count.
 *
 * Verified 2026-08-19 against the live app.
 */

/** The "Shortlist" h1 on /shortlist. */
export function shortlistHeading(page: Page) {
  return page.getByRole("heading", { name: "Shortlist", exact: true });
}

/** The "N saved projects" subtitle on /shortlist. */
export function shortlistCount(page: Page) {
  return page.getByText(/\d+ saved project/);
}

/** Project cards on /shortlist (each is a link to /p/<uuid>). */
export function shortlistCards(page: Page) {
  return page.locator('main a[href^="/p/"]');
}

/** The details-page shortlist toggle ("Save to shortlist" / "Saved to shortlist"). */
export function shortlistToggle(page: Page) {
  return page.getByRole("button", { name: /Save(d)? to shortlist/ });
}

/** Read the number from the "N saved projects" subtitle. */
export async function readShortlistCount(page: Page): Promise<number> {
  const text = await shortlistCount(page).innerText();
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : -1;
}

/** Sign in and open the Shortlist page. */
export async function openShortlist(page: Page) {
  await loginAsUser(page);
  await page.goto("/shortlist");
  await expect(shortlistHeading(page)).toBeVisible();
}

/**
 * Force the named project's shortlist state to `saved` (idempotent). Opens the
 * project details page and toggles only if the current state differs.
 */
export async function setShortlistState(
  page: Page,
  project: string,
  saved: boolean,
) {
  await openProject(page, project);
  const toggle = shortlistToggle(page);
  await expect(toggle).toBeVisible();
  const currentlySaved = (await toggle.innerText()).includes("Saved");
  if (currentlySaved !== saved) {
    await toggle.click();
    await expect(
      page.getByRole("button", {
        name: saved ? "Saved to shortlist" : "Save to shortlist",
        exact: true,
      }),
    ).toBeVisible();
  }
}
