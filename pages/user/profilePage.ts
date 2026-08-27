import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";

/**
 * Locators and helpers for the PropCatch Profile page (/profile).
 *
 * /profile is AUTH-GATED: the header icon is hidden from anonymous users, and
 * hitting /profile while signed out redirects to /login?next=%2Fprofile.
 *
 * The page is a READ-ONLY "Account Overview": an account card (avatar, display
 * name, email) followed by a flat list of navigation links to the other
 * account sub-sections and the legal pages, then a "Sign out" button. There
 * are NO forms, inputs, or edit controls on this page.
 *
 * Verified 2026-08-20 against the live app.
 */

/** The account card at the top of /profile (avatar + name + email). */
export function accountCard(page: Page) {
  return page
    .locator("main .card-elev")
    .filter({ has: page.locator("img") })
    .first();
}

/** The avatar <img>; its `alt` is the user's display name. */
export function accountAvatar(page: Page) {
  return accountCard(page).locator("img");
}

/** The display name (a .text-lg font-semibold div). */
export function accountName(page: Page) {
  return accountCard(page).locator("div.text-lg");
}

/** The account email (a .text-sm muted div). */
export function accountEmail(page: Page) {
  return accountCard(page).locator("div.text-sm");
}

/** A single navigation link on /profile, matched by its exact title text. */
export function profileNavLink(page: Page, title: string) {
  return page.locator("main a", { has: page.getByText(title, { exact: true }) });
}

/** The "Sign out" button. */
export function signOutButton(page: Page) {
  return page.getByRole("button", { name: "Sign out", exact: true });
}

/**
 * Every navigation link on /profile, in display order. These are the only
 * links the profile overview surfaces; their destinations live in their own
 * modules (or future profile subsections), so profile tests only assert their
 * presence, destination, and subtitle — never the target module's behaviour.
 */
export const PROFILE_LINKS: Array<{
  title: string;
  href: string;
  subtitle: string;
}> = [
  {
    title: "Notifications",
    href: "/notifications",
    subtitle: "Enquiry + saved-search alerts",
  },
  { title: "Messages", href: "/messages", subtitle: "Threads with builders" },
  {
    title: "My Enquiries",
    href: "/enquiries",
    subtitle: "Callbacks + site visits",
  },
  {
    title: "Site Visits",
    href: "/visits",
    subtitle: "Upcoming + past bookings",
  },
  {
    title: "Saved Searches",
    href: "/saved-searches",
    subtitle: "Alerts when new matches go live",
  },
  {
    title: "Privacy Policy",
    href: "/legal/privacy",
    subtitle: "How we use your data",
  },
  {
    title: "Terms of Service",
    href: "/legal/terms",
    subtitle: "Rules for using EstateVue",
  },
  {
    title: "Data Deletion Request",
    href: "/legal/data-deletion",
    subtitle: "Permanently delete your account",
  },
];

/** Sign in and open the Profile page. */
export async function openProfile(page: Page) {
  await loginAsUser(page);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(accountCard(page)).toBeVisible();
}
