import { expect, type Page } from "@playwright/test";

/**
 * Locators and helpers for the PropCatch Map page (/map).
 *
 * PUBLIC route (loads anonymously and while signed in). Leaflet map with
 * OpenStreetMap tiles, zoom controls, a coordinates summary line, and pin
 * markers for projects that have coordinates.
 *
 * LIVE-APP STATE (verified 2026-08-26):
 * - Heading "Map"; summary like "18 of 21 projects have coordinates".
 * - Markers use `.leaflet-marker-icon` (role=button, alt="Marker").
 * - Clicking a pin does NOT open a popup or navigate to `/p/<id>` (no-op).
 * - Header city selector updates the city label but does NOT change the map
 *   summary or marker set in a measurable way — do not assert filter behaviour.
 */

export async function openMap(page: Page) {
  await page.goto("/map");
  await expect(page).toHaveURL(/\/map$/);
  await expect(mapHeading(page)).toBeVisible();
}

export function mapHeading(page: Page) {
  return page.getByRole("heading", { name: "Map", exact: true });
}

/** e.g. "18 of 21 projects have coordinates" */
export function coordinatesSummary(page: Page) {
  return page.getByText(/\d+ of \d+ projects have coordinates/);
}

export function leafletContainer(page: Page) {
  return page.locator(".leaflet-container");
}

export function zoomInButton(page: Page) {
  return page.getByRole("button", { name: "Zoom in" });
}

export function zoomOutButton(page: Page) {
  return page.getByRole("button", { name: "Zoom out" });
}

/** Project pin icons in the Leaflet marker pane. */
export function mapMarkers(page: Page) {
  return page.locator(
    '.leaflet-marker-pane img.leaflet-marker-icon[alt="Marker"]',
  );
}

export async function expectMapLoaded(page: Page) {
  await expect(page).toHaveURL(/\/map$/);
  await expect(mapHeading(page)).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(leafletContainer(page)).toBeVisible();
  await expect(page.getByText(/Something broke|Application error/i)).toHaveCount(
    0,
  );
}
