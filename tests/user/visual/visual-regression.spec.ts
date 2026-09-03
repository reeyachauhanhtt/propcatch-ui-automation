import { test, expect } from "@playwright/test";
import { openBuilders } from "../../../pages/user/buildersPage";
import { heroHeading, featuredSection } from "../../../pages/user/homePage";

/**
 * Visual regression testing — concept demonstration.
 *
 * Playwright compares a rendered page/element against a stored *baseline* image
 * using `expect(...).toHaveScreenshot()`. The lifecycle is:
 *
 *   1. FIRST RUN  — no baseline exists, so Playwright writes the PNG under
 *      `tests/user/visual/visual-regression.spec.ts-snapshots/` and the test
 *      PASSES. This run *records* the reference.
 *   2. LATER RUNS — the page is re-rendered and pixel-diffed against the
 *      baseline. If the difference exceeds the configured tolerance the test
 *      FAILS and the HTML report shows an image diff (expected / actual / diff).
 *   3. INTENTIONAL CHANGE — regenerate the baseline after a deliberate UI change:
 *      `npx playwright test tests/user/visual --update-snapshots`
 *
 * Screenshots are inherently browser-specific, so baselines are stored
 * per-project (the file name carries `-chromium-`). Run this spec with
 * `--project=chromium` (i.e. `npm test`), not firefox/webkit, unless you
 * generate separate baselines for those engines too.
 *
 * Determinism is the whole game for visual regression:
 *   - `animations: "disabled"` freezes CSS transitions/animations so the frame
 *     is stable the moment the assertion runs.
 *   - `mask` hides volatile regions (prices, dates, avatars, carousels) so they
 *     don't cause false positives.
 *   - `maxDiffPixelRatio` / `maxDiffPixels` / `threshold` set how much visual
 *     change is tolerated before the test is flagged.
 */

test.describe("Visual regression - concept", () => {
  test.describe.configure({ timeout: 45_000 });

  test("VISUAL-001 - a full page matches its baseline", async ({ page }) => {
    // /builders is public, read-only, and backed by stable seeded data (8
    // builders), which makes it a reliable full-page reference.
    await openBuilders(page);

    await expect(page).toHaveScreenshot("builders-full-page.png", {
      fullPage: true, // capture the whole scrollable page, not just the viewport
      animations: "disabled",
      maxDiffPixelRatio: 0.01, // tolerate up to 1% of pixels differing
    });
  });

  test("VISUAL-002 - a single element matches its baseline", async ({ page }) => {
    // Element-level snapshots are cheaper and less brittle than whole pages:
    // they assert one component and ignore everything around it.
    await page.goto("/");
    await expect(heroHeading(page)).toBeVisible();

    await expect(heroHeading(page)).toHaveScreenshot("homepage-hero.png", {
      animations: "disabled",
    });
  });

  test("VISUAL-003 - mask volatile regions so only the stable layout is compared", async ({
    page,
  }) => {
    // The homepage's featured section is data-driven and can change between
    // deploys; masking it keeps this snapshot focused on stable chrome.
    await page.goto("/");
    await expect(heroHeading(page)).toBeVisible();

    await expect(page).toHaveScreenshot("homepage-masked.png", {
      fullPage: true,
      animations: "disabled",
      mask: [
        featuredSection(page), // "Featured under construction" — dynamic content
        page.getByRole("contentinfo"), // footer
      ],
    });
  });
});
