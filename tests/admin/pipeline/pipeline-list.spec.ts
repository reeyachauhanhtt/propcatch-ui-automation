import { test, expect } from "@playwright/test";
import { expectSidebarItemActive } from "../../../pages/admin/shell";
import {
  CORE_PIPELINE_STAGES,
  clearFiltersButton,
  collectFunnelStageNames,
  collectOpenLeadsCount,
  filterProjectSelect,
  funnelStageRow,
  openPipeline,
  pipelineBoardScroller,
  pipelineColumn,
  pipelineColumns,
  pipelineFunnelHeading,
  pipelineHeading,
  pipelineLeadCards,
  pipelineModuleLabel,
  pipelineSubtitle,
  todaysActionsHeading,
} from "../../../pages/admin/pipelinePage";

test.describe("Admin Pipeline list — funnel and board", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openPipeline(page);
  });

  test("ADMIN-PIPE-001 — pipeline page loads with heading and shell @smoke", async ({
    page,
  }) => {
    await expect(pipelineHeading(page)).toBeVisible();
    await expect(pipelineModuleLabel(page)).toBeVisible();
    await expect(pipelineSubtitle(page)).toBeVisible();
    await expect(page).toHaveTitle(/PropCatch Admin/i);
    await expectSidebarItemActive(page, "Pipeline");
  });

  test("ADMIN-PIPE-002 — project filter and Clear control are visible", async ({
    page,
  }) => {
    await expect(filterProjectSelect(page)).toBeVisible();
    await expect(clearFiltersButton(page)).toBeVisible();
  });

  test("ADMIN-PIPE-003 — pipeline funnel lists core stages with open-lead count @smoke", async ({
    page,
  }) => {
    await expect(pipelineFunnelHeading(page)).toBeVisible();
    const openCount = await collectOpenLeadsCount(page);
    expect(openCount).toBeGreaterThan(0);

    const stages = await collectFunnelStageNames(page);
    expect(stages.length).toBeGreaterThan(0);
    for (const stage of CORE_PIPELINE_STAGES) {
      expect(stages).toContain(stage);
      await expect(funnelStageRow(page, stage)).toBeVisible();
    }
  });

  test("ADMIN-PIPE-004 — Today's actions section is visible beside the funnel", async ({
    page,
  }) => {
    await expect(todaysActionsHeading(page)).toBeVisible();
  });

  test("ADMIN-PIPE-005 — horizontal board shows stage columns and lead cards @smoke", async ({
    page,
  }) => {
    const scroller = pipelineBoardScroller(page);
    await expect(scroller).toBeVisible();

    const columnCount = await pipelineColumns(page).count();
    expect(columnCount).toBeGreaterThan(0);

    for (const stage of CORE_PIPELINE_STAGES) {
      await expect(pipelineColumn(page, stage)).toBeVisible();
    }

    const cards = pipelineLeadCards(page);
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toHaveAttribute("href", /\/leads\/[0-9a-f-]+/i);
  });

  test("ADMIN-PIPE-006 — board scroller is horizontally scrollable", async ({
    page,
  }) => {
    const scroller = pipelineBoardScroller(page);
    await expect(scroller).toBeVisible();

    const metrics = await scroller.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);

    await scroller.evaluate((el) => {
      el.scrollLeft = Math.min(400, el.scrollWidth - el.clientWidth);
    });
    await expect
      .poll(async () => scroller.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
  });

  test("ADMIN-PIPE-007 — pipeline remains loaded after refresh", async ({
    page,
  }) => {
    await page.reload();
    await expect(pipelineHeading(page)).toBeVisible();
    await expect(pipelineModuleLabel(page)).toBeVisible();
    await expect(pipelineFunnelHeading(page)).toBeVisible();
  });
});
