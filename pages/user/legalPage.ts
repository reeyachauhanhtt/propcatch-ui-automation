import { expect, type Page } from "@playwright/test";

/**
 * Locators and helpers for the PropCatch legal pages.
 *
 * All three routes are PUBLIC (no auth gate):
 *   /legal/privacy       — heading "Privacy Policy"
 *   /legal/terms         — heading "Terms of Service"
 *   /legal/data-deletion — heading "Delete My Account" with an optional reason
 *                          textarea and "Submit deletion request" CTA
 *
 * Reachable from the homepage footer and from /profile account links.
 *
 * Do NOT submit the data-deletion form against the shared test user — that
 * permanently deletes the account. Specs assert presence of the CTA only.
 *
 * Verified 2026-08-26 against the live app.
 */

export type LegalRoute = "privacy" | "terms" | "data-deletion";

const LEGAL_META: Record<
  LegalRoute,
  { path: string; heading: string; title: RegExp }
> = {
  privacy: {
    path: "/legal/privacy",
    heading: "Privacy Policy",
    title: /Privacy Policy/i,
  },
  terms: {
    path: "/legal/terms",
    heading: "Terms of Service",
    title: /Terms of Service/i,
  },
  "data-deletion": {
    path: "/legal/data-deletion",
    heading: "Delete My Account",
    title: /Delete My Account/i,
  },
};

export function legalPath(route: LegalRoute) {
  return LEGAL_META[route].path;
}

export function legalHeading(page: Page, route: LegalRoute) {
  return page.getByRole("heading", {
    name: LEGAL_META[route].heading,
    exact: true,
  });
}

export async function openLegal(page: Page, route: LegalRoute) {
  await page.goto(LEGAL_META[route].path);
  await expect(page).toHaveURL(new RegExp(`${LEGAL_META[route].path}$`));
  await expect(legalHeading(page, route)).toBeVisible();
}

export async function expectLegalLoaded(page: Page, route: LegalRoute) {
  await expect(page).toHaveURL(new RegExp(`${LEGAL_META[route].path}$`));
  await expect(page).toHaveTitle(LEGAL_META[route].title);
  await expect(legalHeading(page, route)).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
    0,
  );
}

export function deletionReasonField(page: Page) {
  return page.getByLabel("Reason (optional)");
}

export function submitDeletionButton(page: Page) {
  return page.getByRole("button", { name: "Submit deletion request" });
}
