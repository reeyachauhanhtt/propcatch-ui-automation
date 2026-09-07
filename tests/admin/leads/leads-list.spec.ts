import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  applyLeadFilters,
  clearFiltersButton,
  clearLeadFilters,
  collectContactNamesOnPage,
  collectLeadCreatedDates,
  collectLeadProjects,
  collectLeadSources,
  collectLeadStatuses,
  filterFromInput,
  filterProjectSelect,
  filterSourceSelect,
  filterStatusSelect,
  filterToInput,
  findSeededContactName,
  isDisposableContactName,
  leadContactLink,
  leadRows,
  leadsHeading,
  leadsModuleLabel,
  leadsSubtitle,
  leadsTable,
  newLeadHeading,
  newLeadLink,
  nextPageButton,
  openLeads,
  paginationLabel,
  previousPageButton,
  searchInput,
  searchLeads,
} from "../../../pages/admin/leadsPage";

test.describe("Admin Leads list, search, and filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openLeads(page);
  });

  test("ADMIN-LEADS-001 — leads list loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(leadsHeading(page)).toBeVisible();
    await expect(leadsModuleLabel(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Leads");
  });

  test("ADMIN-LEADS-002 — subtitle and New lead action are visible", async ({
    page,
  }) => {
    await expect(leadsSubtitle(page)).toBeVisible();
    await expect(newLeadLink(page)).toBeVisible();
    await expect(newLeadLink(page)).toHaveAttribute("href", "/leads/new");
  });

  test("ADMIN-LEADS-003 — table shows expected columns and at least one row", async ({
    page,
  }) => {
    const table = leadsTable(page);
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Contact" })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Project / Unit" }),
    ).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Source" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Assigned" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Created" })).toBeVisible();
    expect(await leadRows(page).count()).toBeGreaterThan(0);
  });

  test("ADMIN-LEADS-004 — pagination controls are present", async ({ page }) => {
    await expect(paginationLabel(page)).toBeVisible();
    await expect(previousPageButton(page)).toBeVisible();
    await expect(nextPageButton(page)).toBeVisible();
  });

  test("ADMIN-LEADS-005 — search and filter controls plus Clear are visible", async ({
    page,
  }) => {
    await expect(searchInput(page)).toBeVisible();
    await expect(filterStatusSelect(page)).toBeVisible();
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(filterSourceSelect(page)).toBeVisible();
    await expect(filterFromInput(page)).toBeVisible();
    await expect(filterToInput(page)).toBeVisible();
    await expect(clearFiltersButton(page)).toBeVisible();
  });

  test("ADMIN-LEADS-006 — + New lead opens the create form", async ({
    page,
  }) => {
    await newLeadLink(page).click();
    await expect(page).toHaveURL(/\/leads\/new/);
    await expect(newLeadHeading(page)).toBeVisible();
    await expect(page.getByText("Leads / New")).toBeVisible();
  });

  test("ADMIN-LEADS-007 — leads list remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expect(leadsHeading(page)).toBeVisible();
    await expect(leadsModuleLabel(page)).toBeVisible();
  });

  test("ADMIN-LEADS-008 — Contact link opens the lead detail page @smoke", async ({
    page,
  }) => {
    const rows = leadRows(page);
    const count = await rows.count();
    let name = "";
    let link = rows.first().locator('a[href*="/leads/"]').first();

    for (let i = 0; i < count; i++) {
      const candidate = rows.nth(i).locator('a[href*="/leads/"]').first();
      if ((await candidate.count()) === 0) {
        continue;
      }
      const text = (await candidate.innerText()).trim();
      if (!isDisposableContactName(text)) {
        name = text;
        link = candidate;
        break;
      }
    }
    expect(name.length).toBeGreaterThan(0);

    await link.click();
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    // Do not edit or delete seeded leads.
  });

  test("ADMIN-LEADS-010 — searching by contact name filters rows @smoke", async ({
    page,
  }) => {
    const name = await findSeededContactName(page);
    expect(name.length).toBeGreaterThan(0);

    await searchLeads(page, name);

    await expect(page).toHaveURL(/[?&]q=/);
    await expect(leadContactLink(page, name).first()).toBeVisible();
    const matches = await collectContactNamesOnPage(page);
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.toLowerCase()).toContain(name.toLowerCase());
    }
  });

  test("ADMIN-LEADS-011 — search with no matching contact yields an empty list", async ({
    page,
  }) => {
    await searchLeads(page, "zzzz-no-such-lead-qa");

    await expect(page).toHaveURL(/[?&]q=/);
    const matches = await collectContactNamesOnPage(page);
    expect(matches).toHaveLength(0);
  });

  test("ADMIN-LEADS-012 — Clear filters resets search back to the full list", async ({
    page,
  }) => {
    const before = await collectContactNamesOnPage(page);

    await searchLeads(page, "zzzz-no-such-lead-qa");
    await expect(searchInput(page)).toHaveValue("zzzz-no-such-lead-qa");

    await clearLeadFilters(page);

    await expect(page).toHaveURL(/\/leads\/?$/);
    const after = await collectContactNamesOnPage(page);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  test("ADMIN-LEADS-020 — status filter narrows to that status @smoke", async ({
    page,
  }) => {
    await applyLeadFilters(page, { status: "Lost" });

    await expect(page).toHaveURL(/[?&]status_id=/);
    const statuses = await collectLeadStatuses(page);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(status).toBe("Lost");
    }
  });

  test("ADMIN-LEADS-021 — project filter narrows to that project", async ({
    page,
  }) => {
    await applyLeadFilters(page, { project: "Montessa Heights" });

    await expect(page).toHaveURL(/[?&]project_id=/);
    const projects = await collectLeadProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toBe("Montessa Heights");
    }
  });

  test("ADMIN-LEADS-022 — source filter narrows to that source", async ({
    page,
  }) => {
    await applyLeadFilters(page, { source: "manual" });

    await expect(page).toHaveURL(/[?&]source=manual/);
    const sources = await collectLeadSources(page);
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.toLowerCase()).toBe("manual");
    }
  });

  test("ADMIN-LEADS-023 — from and to date filters narrow the created range", async ({
    page,
  }) => {
    await applyLeadFilters(page, { from: "2026-08-01", to: "2026-08-31" });

    await expect(page).toHaveURL(/[?&]from=2026-08-01/);
    await expect(page).toHaveURL(/[?&]to=2026-08-31/);
    const dates = await collectLeadCreatedDates(page);
    expect(dates.length).toBeGreaterThan(0);
    for (const date of dates) {
      expect(date >= "2026-08-01").toBe(true);
      expect(date <= "2026-08-31").toBe(true);
    }
  });

  test("ADMIN-LEADS-024 — Clear filters resets filters back to the full list", async ({
    page,
  }) => {
    const before = await collectContactNamesOnPage(page);

    await applyLeadFilters(page, { project: "Montessa Heights", status: "New" });
    await expect(page).toHaveURL(/[?&]project_id=/);

    await clearLeadFilters(page);

    await expect(page).toHaveURL(/\/leads\/?$/);
    const after = await collectContactNamesOnPage(page);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  test("ADMIN-LEADS-025 — different project filters return different lists", async ({
    page,
  }) => {
    const unfiltered = await collectLeadProjects(page);
    expect(unfiltered.length).toBeGreaterThan(1);

    await applyLeadFilters(page, { project: "Montessa Heights" });
    const montessa = await collectLeadProjects(page);
    expect(montessa.length).toBeGreaterThan(0);

    await clearLeadFilters(page);

    await applyLeadFilters(page, { project: "Palm Grove Villas" });
    const palmGrove = await collectLeadProjects(page);
    expect(palmGrove.length).toBeGreaterThan(0);

    const overlap = montessa.filter((name) => palmGrove.includes(name));
    expect(overlap).toHaveLength(0);
    expect(unfiltered.length).toBeGreaterThan(montessa.length);
  });
});
