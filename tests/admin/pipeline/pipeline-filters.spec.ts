import { test, expect } from "@playwright/test";
import {
  applyPipelineProjectFilter,
  clearPipelineFilters,
  collectOpenLeadsCount,
  collectPipelineCardProjects,
  filterProjectSelect,
  openPipeline,
  pipelineLeadCards,
} from "../../../pages/admin/pipelinePage";

test.describe("Admin Pipeline filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openPipeline(page);
  });

  test("ADMIN-PIPE-020 — project filter narrows funnel and board cards @smoke", async ({
    page,
  }) => {
    const beforeCount = await collectOpenLeadsCount(page);
    expect(beforeCount).toBeGreaterThan(0);

    await applyPipelineProjectFilter(page, "Montessa Heights");

    await expect(page).toHaveURL(/[?&]project=/);
    await expect(filterProjectSelect(page)).toHaveValue(/.+/);

    const filteredCount = await collectOpenLeadsCount(page);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(beforeCount);

    const projects = await collectPipelineCardProjects(page);
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project).toBe("Montessa Heights");
    }
  });

  test("ADMIN-PIPE-021 — different project filters return different card sets", async ({
    page,
  }) => {
    await applyPipelineProjectFilter(page, "Montessa Heights");
    const montessa = await collectPipelineCardProjects(page);
    expect(montessa.length).toBeGreaterThan(0);

    await clearPipelineFilters(page);

    await applyPipelineProjectFilter(page, "Palm Grove Villas");
    const palmGrove = await collectPipelineCardProjects(page);
    expect(palmGrove.length).toBeGreaterThan(0);

    for (const project of montessa) {
      expect(project).toBe("Montessa Heights");
    }
    for (const project of palmGrove) {
      expect(project).toBe("Palm Grove Villas");
    }
  });

  test("ADMIN-PIPE-022 — Clear restores the unfiltered pipeline @smoke", async ({
    page,
  }) => {
    const beforeCount = await collectOpenLeadsCount(page);
    const beforeCards = await pipelineLeadCards(page).count();

    await applyPipelineProjectFilter(page, "Montessa Heights");
    await expect(page).toHaveURL(/[?&]project=/);
    const filteredCount = await collectOpenLeadsCount(page);
    expect(filteredCount).toBeLessThan(beforeCount);

    await clearPipelineFilters(page);

    await expect(page).toHaveURL(/\/pipeline\/?$/);
    const afterCount = await collectOpenLeadsCount(page);
    const afterCards = await pipelineLeadCards(page).count();
    expect(afterCount).toBe(beforeCount);
    expect(afterCards).toBeGreaterThanOrEqual(beforeCards);
  });

  test("ADMIN-PIPE-023 — Clear resets the project dropdown to All projects", async ({
    page,
  }) => {
    await applyPipelineProjectFilter(page, "Montessa Heights");
    await expect(page).toHaveURL(/[?&]project=/);
    await expect(filterProjectSelect(page)).not.toHaveValue("");
    await expect(
      filterProjectSelect(page).locator("option:checked"),
    ).toHaveText("Montessa Heights");

    await clearPipelineFilters(page);

    // Results / URL clear correctly; the control must also reset.
    await expect(page).toHaveURL(/\/pipeline\/?$/);
    await expect(filterProjectSelect(page)).toHaveValue("");
    await expect(
      filterProjectSelect(page).locator("option:checked"),
    ).toHaveText("All projects");
  });
});
