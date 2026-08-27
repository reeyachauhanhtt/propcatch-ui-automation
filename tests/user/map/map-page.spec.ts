import { test, expect } from "@playwright/test";
import { anonymousStorageState } from "../../../pages/user/auth";
import { openMapViewLink } from "../../../pages/user/homePage";
import {
  coordinatesSummary,
  expectMapLoaded,
  leafletContainer,
  mapHeading,
  mapMarkers,
  openMap,
  zoomInButton,
  zoomOutButton,
} from "../../../pages/user/mapPage";
import { mapViewLink, projectsHeading } from "../../../pages/user/projectListingPage";

/**
 * Map page (/map).
 *
 * Public Leaflet map of projects with coordinates. Pin clicks currently do not
 * open project detail (verified 2026-08-26) — MAP-004 asserts markers only.
 */
test.describe("Map page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("MAP-001 - /map loads with heading and no app error @smoke", async ({
    page,
  }) => {
    await openMap(page);
    await expectMapLoaded(page);
    await expect(page).toHaveTitle(/Map view/i);
  });

  test("MAP-002 - reachable from homepage Open map view and projects Map view", async ({
    page,
  }) => {
    await page.goto("/");
    await openMapViewLink(page).click();
    await expectMapLoaded(page);

    await page.goto("/projects");
    await expect(projectsHeading(page)).toBeVisible();
    await mapViewLink(page).click();
    await expectMapLoaded(page);
  });

  test("MAP-003 - core map UI is present (container, summary, zoom)", async ({
    page,
  }) => {
    await openMap(page);

    await expect(leafletContainer(page)).toBeVisible();
    await expect(coordinatesSummary(page)).toBeVisible();
    await expect(zoomInButton(page)).toBeVisible();
    await expect(zoomOutButton(page)).toBeVisible();
    await expect(page.getByText("Leaflet")).toBeVisible();
  });

  test("MAP-004 - project pins are shown; pin click does not open /p/<id>", async ({
    page,
  }) => {
    await openMap(page);

    // Live app: pins render, but clicking them does not open a popup or
    // navigate to project detail (observed 2026-08-26). Assert presence only.
    await expect(mapMarkers(page).first()).toBeVisible({ timeout: 15_000 });
    const count = await mapMarkers(page).count();
    expect(count).toBeGreaterThan(0);

    await mapMarkers(page).first().click({ force: true });
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.locator(".leaflet-popup")).toHaveCount(0);
    await expect(page.locator('a[href^="/p/"]')).toHaveCount(0);
  });

  test.describe("anonymous access", () => {
    test.use({ storageState: anonymousStorageState });

    test("MAP-005 - anonymous visitor can open /map", async ({ page }) => {
      await page.goto("/map");

      await expect(page).toHaveURL(/\/map$/);
      await expect(mapHeading(page)).toBeVisible();
      await expect(leafletContainer(page)).toBeVisible();
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Sign in" }),
      ).toBeVisible();
    });
  });

  // MAP-006 omitted: header city selector updates its label but does not
  // materially change the map summary or marker set (verified 2026-08-26).
});
