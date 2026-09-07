import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  STATUS_LEGEND,
  VISIT_STATUS_VALUES,
  applySiteVisitFilters,
  clearFiltersButton,
  clearSiteVisitFilters,
  collectVisitProjects,
  collectVisitScheduledDates,
  collectVisitStatuses,
  filterFromInput,
  filterProjectSelect,
  filterStatusSelect,
  filterToInput,
  findSeededVisitRow,
  newVisitHeading,
  newVisitLink,
  nextPageButton,
  openSiteVisits,
  openStatusLegend,
  paginationLabel,
  previousPageButton,
  siteVisitsHeading,
  siteVisitsModuleLabel,
  siteVisitsSubtitle,
  siteVisitsTable,
  statusLegend,
  statusLegendToggle,
  visitRows,
} from "../../../pages/admin/siteVisitsPage";

test.describe("Admin Site visits list and filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openSiteVisits(page);
  });

  test("ADMIN-VISITS-001 — site visits list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(siteVisitsHeading(page)).toBeVisible();
    await expect(siteVisitsModuleLabel(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Site visits");
  });

  test("ADMIN-VISITS-002 — subtitle and Schedule visit action are visible", async ({
    page,
  }) => {
    await expect(siteVisitsSubtitle(page)).toBeVisible();
    await expect(newVisitLink(page)).toBeVisible();
    await expect(newVisitLink(page)).toHaveAttribute("href", "/site-visits/new");
  });

  test("ADMIN-VISITS-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = siteVisitsTable(page);
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Scheduled" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Contact" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Project" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Visited" }),
    ).toBeVisible();
    expect(await visitRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-VISITS-004 — pagination controls are present", async ({ page }) => {
    await expect(paginationLabel(page)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-VISITS-005 — filter controls, Clear, and Status legend are visible", async ({
    page,
  }) => {
    await expect(filterStatusSelect(page)).toBeVisible();
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterFromInput(page)).toBeVisible();
    await expect(filterToInput(page)).toBeVisible();
    await expect(clearFiltersButton(page)).toBeVisible();
    await expect(statusLegendToggle(page)).toBeVisible();
  });

  test("ADMIN-VISITS-006 — + Schedule visit opens the create form", async ({
    page,
  }) => {
    await newVisitLink(page).click();
    await expect(page).toHaveURL(/\/site-visits\/new/);
    await expect(newVisitHeading(page)).toBeVisible();
    await expect(page.getByText("Site visits / New")).toBeVisible();
  });

  test("ADMIN-VISITS-007 — site visits list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expect(siteVisitsHeading(page)).toBeVisible();
    await expect(siteVisitsModuleLabel(page)).toBeVisible();
  });

  test("ADMIN-VISITS-008 — Scheduled link opens the visit detail page @smoke", async ({
    page,
  }) => {
    const seeded = await findSeededVisitRow(page);
    expect(seeded).not.toBeNull();
    const { name, href, scheduled } = seeded!;

    await scheduled.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}/?$`));
    await expect(page).toHaveURL(/\/site-visits\/[0-9a-f-]+$/i);
    await expect(
      page.getByRole("heading", { name: `Visit · ${name}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Site visits / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    // Do not edit or change status on seeded visits.
  });

  test("ADMIN-VISITS-009 — Status legend explains what each status means @smoke", async ({
    page,
  }) => {
    await expect(statusLegendToggle(page)).toBeVisible();
    await expect(statusLegend(page)).toHaveCount(0);

    await openStatusLegend(page);

    const panel = statusLegend(page);
    await expect(panel).toBeVisible();
    for (const entry of STATUS_LEGEND) {
      await expect(panel.getByText(entry.label, { exact: true })).toBeVisible();
      await expect(panel.getByText(entry.meaning, { exact: true })).toBeVisible();
    }
  });

  test("ADMIN-VISITS-020 — status filter narrows to that status @smoke", async ({
    page,
  }) => {
    const values = await filterStatusSelect(page)
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      );
    expect(values).toEqual(["", ...VISIT_STATUS_VALUES]);

    await applySiteVisitFilters(page, { status: "completed" });

    await expect(page).toHaveURL(/[?&]status=completed/);
    const statuses = await collectVisitStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Completed");
    }
  });

  test("ADMIN-VISITS-021 — project filter narrows to that project", async ({
    page,
  }) => {
    await applySiteVisitFilters(page, { project: "Prime Plaza" });

    await expect(page).toHaveURL(/[?&]project=/);
    const projects = await collectVisitProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toBe("Prime Plaza");
    }
  });

  test("ADMIN-VISITS-022 — from and to date filters narrow the scheduled range", async ({
    page,
  }) => {
    await applySiteVisitFilters(page, { from: "2026-08-01", to: "2026-08-31" });

    await expect(page).toHaveURL(/[?&]from=2026-08-01/);
    await expect(page).toHaveURL(/[?&]to=2026-08-31/);
    const dates = await collectVisitScheduledDates(page);
    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) {
      expect(date >= "2026-08-01").toBe(true);
      expect(date <= "2026-08-31").toBe(true);
    }
  });

  test("ADMIN-VISITS-023 — Clear restores the unfiltered list @smoke", async ({
    page,
  }) => {
    const before = await collectVisitProjects(page);

    await applySiteVisitFilters(page, { project: "Prime Plaza", status: "completed" });
    await expect(page).toHaveURL(/[?&]project=/);

    await clearSiteVisitFilters(page);

    await expect(page).toHaveURL(/\/site-visits\/?$/);
    const after = await collectVisitProjects(page);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  test("ADMIN-VISITS-024 — Clear resets status and project dropdowns", async ({
    page,
  }) => {
    await applySiteVisitFilters(page, { project: "Prime Plaza", status: "completed" });
    await expect(filterStatusSelect(page)).toHaveValue("completed");
    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      "Prime Plaza",
    );

    await clearSiteVisitFilters(page);

    await expect(filterStatusSelect(page)).toHaveValue("");
    await expect(filterStatusSelect(page).locator("option:checked")).toHaveText(
      "All statuses",
    );
    await expect(filterProjectSelect(page)).toHaveValue("");
    await expect(filterProjectSelect(page).locator("option:checked")).toHaveText(
      "All projects",
    );
  });

  test("ADMIN-VISITS-025 — different project filters return different lists", async ({
    page,
  }) => {
    await applySiteVisitFilters(page, { project: "Prime Plaza" });
    const primePlaza = await collectVisitProjects(page);
    expect(primePlaza.length).toBeGreaterThan(0);

    await clearSiteVisitFilters(page);

    await applySiteVisitFilters(page, { project: "Azure Crest Residences" });
    const azureCrest = await collectVisitProjects(page);
    expect(azureCrest.length).toBeGreaterThan(0);

    for (const project of primePlaza) {
      expect(project).toBe("Prime Plaza");
    }
    for (const project of azureCrest) {
      expect(project).toBe("Azure Crest Residences");
    }
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
