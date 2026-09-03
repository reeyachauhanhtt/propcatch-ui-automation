import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openBuilders } from "../../../pages/user/buildersPage";

/**
 * Accessibility (a11y) testing — concept demonstration, powered by axe-core
 * (@axe-core/playwright), the same WCAG engine Playwright's docs recommend.
 *
 * Axe injects itself into the rendered page and runs the Web Content
 * Accessibility Guidelines (WCAG 2.0/2.1/2.2) ruleset against the live DOM.
 * Every finding is a "violation" carrying:
 *
 *   - id        → rule id, e.g. "color-contrast", "button-name", "image-alt"
 *   - impact    → severity: critical | serious | moderate | minor
 *   - helpUrl   → Deque University doc explaining the rule and how to fix it
 *   - nodes[]   → the exact offending elements (selector + html + failure summary)
 *
 * Typical gating strategy: fail CI on `critical` (and often `serious`), while
 * logging `moderate`/`minor` for triage. The scan needs a real browser (the DOM
 * must render), so run it under `--project=chromium` like the rest of the suite.
 */

/** Render an axe violation list as a compact, readable report. */
function summarize(violations: Array<Record<string, any>>): string {
  if (violations.length === 0) return "0 violations";
  const lines = violations.map((v) => {
    const nodes = v.nodes
      .slice(0, 3)
      .map((n: { target: string[] }) => `      - ${n.target.join(" ")}`)
      .join("\n");
    const more =
      v.nodes.length > 3 ? `\n      … +${v.nodes.length - 3} more` : "";
    const noun = v.nodes.length === 1 ? "node" : "nodes";
    return `  [${v.impact}] ${v.id} — ${v.description} (${v.nodes.length} ${noun})\n${nodes}${more}`;
  });
  const noun = violations.length === 1 ? "violation" : "violations";
  return `${violations.length} ${noun}\n${lines.join("\n")}`;
}

test.describe("Accessibility (axe-core)", () => {
  test.describe.configure({ timeout: 45_000 });

  test("A11Y-001 - a full-page scan reports every violation and gates on critical", async ({
    page,
  }, testInfo) => {
    await openBuilders(page);

    const results = await new AxeBuilder({ page }).analyze();

    const summary = summarize(results.violations);
    console.log(`\nA11Y scan of /builders:\n${summary}`);
    await testInfo.attach("axe-summary", {
      body: summary,
      contentType: "text/plain",
    });

    // CI gate: fail only on critical issues; serious/moderate are logged above
    // and triaged separately so a noisy live app doesn't block every PR.
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical.map((v) => v.id),
      "no critical WCAG violations",
    ).toEqual([]);
  });

  test("A11Y-002 - scope the scan to a single component (the header)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();

    // `include` restricts axe to one subtree — cheaper and focused on the
    // component a team owns, without noise from the rest of the page.
    const results = await new AxeBuilder({ page }).include("header").analyze();

    console.log(`\nA11Y scan of <header>:\n${summarize(results.violations)}`);
    expect(results.violations.filter((v) => v.impact === "critical")).toEqual(
      [],
    );
  });

  test("A11Y-003 - focus on one standard or one rule", async ({ page }) => {
    await openBuilders(page);

    // Run only the WCAG 2.1 AA rules — the most common legal baseline.
    const aa = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
    console.log(`\nA11Y (wcag2aa only):\n${summarize(aa.violations)}`);

    // Or isolate a single rule (e.g. color contrast) and allow-list the rest.
    const contrast = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    console.log(
      `\nA11Y (color-contrast only):\n${summarize(contrast.violations)}`,
    );
  });
});
