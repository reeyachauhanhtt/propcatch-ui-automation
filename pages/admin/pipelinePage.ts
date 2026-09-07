import { expect, type Page } from "@playwright/test";
import { isDisposableContactName } from "./leadsPage";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Pipeline helpers for https://propcatch-admin.vercel.app/pipeline
 *
 * Verified 2026-09-04 against the live Admin portal:
 * - "Module 9 — Pipeline / CRM Workflow" — open leads grouped by stage.
 * - Heading: "Lead pipeline". Subtitle explains cards open the lead.
 * - Project filter (#filter-project → ?project=<uuid>). "Clear" returns to
 *   /pipeline (URL cleared; open-lead counts restore). The select must reset
 *   to "All projects" (empty value) — see ADMIN-PIPE-023.
 * - Pipeline funnel card: stage rows with counts + progress bars, plus
 *   "N open leads". Today's actions: Overdue follow-ups →
 *   /reminders?filter=overdue, Due today (follow-ups) → ?filter=due-today,
 *   Pending callbacks → ?filter=callbacks.
 * - Horizontal board (.overflow-x-auto): per-stage columns with lead cards
 *   linking to /leads/:id. Empty columns show "Empty".
 *
 * Read-only module for these specs — do not mutate seeded leads from here.
 */

/** Stable stage labels that always appear in the funnel / board. */
export const CORE_PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Booked",
  "Lost",
] as const;

export const TODAYS_ACTIONS = [
  {
    label: /Overdue follow-ups/i,
    href: "/reminders?filter=overdue",
    filter: "overdue",
    filteredLabel: /Filtered:\s*Overdue/i,
    chip: /^Overdue/i,
  },
  {
    label: /Due today \(follow-ups\)/i,
    href: "/reminders?filter=due-today",
    filter: "due-today",
    filteredLabel: /Filtered:\s*Due today/i,
    chip: /^Due today/i,
  },
  {
    label: /Pending callbacks/i,
    href: "/reminders?filter=callbacks",
    filter: "callbacks",
    filteredLabel: /Filtered:\s*Callbacks/i,
    chip: /^Callbacks/i,
  },
] as const;

export function main(page: Page) {
  return page.getByRole("main");
}

export function pipelineHeading(page: Page) {
  return page.getByRole("heading", { name: "Lead pipeline", exact: true });
}

export function pipelineModuleLabel(page: Page) {
  return main(page).getByText("Module 9 — Pipeline / CRM Workflow", {
    exact: true,
  });
}

export function pipelineSubtitle(page: Page) {
  return main(page).getByText(
    "Open leads grouped by stage. Click a card to open the lead and move it through the pipeline.",
  );
}

/* ---- Filters ---- */

export function filterProjectSelect(page: Page) {
  return page.locator("#filter-project");
}

export function clearFiltersButton(page: Page) {
  return main(page).getByRole("button", { name: "Clear", exact: true });
}

/* ---- Funnel + Today's actions ---- */

export function pipelineFunnelCard(page: Page) {
  return main(page)
    .locator("div.rounded-lg")
    .filter({ hasText: "Pipeline funnel" })
    .first();
}

export function pipelineFunnelHeading(page: Page) {
  return pipelineFunnelCard(page).getByText(/Pipeline funnel/);
}

export function openLeadsCountLabel(page: Page) {
  return pipelineFunnelCard(page).getByText(/\d+\s+open leads/);
}

export function funnelStageRow(page: Page, stage: string) {
  return pipelineFunnelCard(page)
    .locator('div[class*="space-y-0.5"]')
    .filter({
      has: page.locator("span", {
        hasText: new RegExp(`^${escapeRegExp(stage)}$`),
      }),
    })
    .first();
}

export function todaysActionsCard(page: Page) {
  return main(page)
    .locator("div.rounded-lg")
    .filter({ hasText: "Today's actions" })
    .first();
}

export function todaysActionsHeading(page: Page) {
  return main(page).getByText("Today's actions", { exact: true });
}

export function todaysActionLink(page: Page, label: RegExp) {
  return todaysActionsCard(page).getByRole("link", { name: label });
}

/* ---- Horizontal board ---- */

export function pipelineBoardScroller(page: Page) {
  return main(page).locator("div.min-w-0.overflow-x-auto").first();
}

export function pipelineBoard(page: Page) {
  return pipelineBoardScroller(page).locator(":scope > div").first();
}

export function pipelineColumns(page: Page) {
  return pipelineBoard(page).locator(":scope > div");
}

export function pipelineColumn(page: Page, stage: string) {
  return pipelineColumns(page)
    .filter({
      has: page.getByText(new RegExp(`^${escapeRegExp(stage)}$`)),
    })
    .first();
}

export function pipelineLeadCards(page: Page) {
  return main(page).locator('a[href*="/leads/"]');
}

export function pipelineLeadCard(page: Page, contactName: string) {
  return pipelineLeadCards(page).filter({
    hasText: new RegExp(`^${escapeRegExp(contactName)}\\b`, "m"),
  });
}

/* ---- Reminders (asserted after Today's actions navigation) ---- */

export function remindersHeading(page: Page) {
  return page.getByRole("heading", { name: "Reminders", exact: true });
}

export function remindersModuleLabel(page: Page) {
  return main(page).getByText("Module 14 — Follow-up reminders", {
    exact: true,
  });
}

export function remindersFilteredLabel(page: Page) {
  return main(page).getByText(/^Filtered:/);
}

export function remindersFilterChip(page: Page, name: RegExp) {
  return main(page).getByRole("link", { name });
}

/* ---- Navigation / actions ---- */

export async function openPipeline(page: Page) {
  await page.goto("/pipeline");
  await expectPipelineLoaded(page);
}

export async function expectPipelineLoaded(page: Page) {
  await expect(page).toHaveURL(/\/pipeline\/?(\?.*)?$/);
  await expect(pipelineHeading(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

/**
 * Project filter auto-applies via ?project=<uuid> on change.
 * Pass the visible option label (e.g. "Montessa Heights").
 */
export async function applyPipelineProjectFilter(page: Page, project: string) {
  await filterProjectSelect(page).selectOption({ label: project });
  await expect(page).toHaveURL(/[?&]project=/, { timeout: 15_000 });
  await expect(pipelineHeading(page)).toBeVisible();
  await expect(openLeadsCountLabel(page)).toBeVisible();
}

/**
 * Clear returns to /pipeline with no query params and restores open-lead counts.
 * Callers that care about control state should also assert the select is empty
 * (ADMIN-PIPE-023).
 */
export async function clearPipelineFilters(page: Page) {
  await clearFiltersButton(page).click();
  await expect(page).toHaveURL(/\/pipeline\/?$/, { timeout: 15_000 });
  await expectPipelineLoaded(page);
}

export async function collectOpenLeadsCount(page: Page) {
  const text = ((await openLeadsCountLabel(page).textContent()) ?? "").trim();
  const match = text.match(/(\d+)\s+open leads/);
  return match ? Number(match[1]) : -1;
}

export async function collectFunnelStageNames(page: Page) {
  const rows = pipelineFunnelCard(page).locator('div[class*="space-y-0.5"]');
  const count = await rows.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = (
      (await rows.nth(i).locator("span").first().textContent()) ?? ""
    ).trim();
    if (name) {
      names.push(name);
    }
  }
  return names;
}

/** Contact names from visible board cards (first text line of each link). */
export async function collectPipelineContactNames(page: Page) {
  const cards = pipelineLeadCards(page);
  const count = await cards.count();
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = ((await cards.nth(i).innerText()) ?? "").trim();
    const name = text.split("\n")[0]?.trim() ?? "";
    if (name && name !== "Empty") {
      names.push(name);
    }
  }
  return names;
}

/**
 * Project labels from board cards. Cards render:
 * name / phone / project[/unit] / assignee / age — take the line that is not
 * phone digits, assignee (👤…), or age (Nd|today).
 */
export async function collectPipelineCardProjects(page: Page) {
  const cards = pipelineLeadCards(page);
  const count = await cards.count();
  const projects: string[] = [];

  for (let i = 0; i < count; i++) {
    const lines = ((await cards.nth(i).innerText()) ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const projectLine = lines.find((line, index) => {
      if (index === 0) return false;
      if (/^[\d+\s()-]+$/.test(line)) return false;
      if (/^👤/.test(line) || /^unassigned$/i.test(line)) return false;
      if (/^(\d+d|today)$/i.test(line)) return false;
      return true;
    });
    if (projectLine) {
      projects.push(projectLine.replace(/\s*·\s*.*$/, "").trim());
    }
  }
  return projects;
}

/** First non-disposable board card suitable for a read-only detail click. */
export async function findSeededPipelineCard(page: Page) {
  const cards = pipelineLeadCards(page);
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const text = ((await card.innerText()) ?? "").trim();
    const name = text.split("\n")[0]?.trim() ?? "";
    if (!name || name === "Empty" || isDisposableContactName(name)) {
      continue;
    }
    const href = (await card.getAttribute("href")) ?? "";
    if (!/\/leads\/[0-9a-f-]+/i.test(href)) {
      continue;
    }
    return { card, name, href };
  }

  return null;
}

export async function expectRemindersFilterApplied(
  page: Page,
  filter: (typeof TODAYS_ACTIONS)[number],
) {
  await expect(page).toHaveURL(
    new RegExp(
      `/reminders\\?filter=${escapeRegExp(filter.filter)}(?:&|$)`,
    ),
    { timeout: 15_000 },
  );
  await expect(remindersHeading(page)).toBeVisible();
  await expect(remindersModuleLabel(page)).toBeVisible();
  await expect(remindersFilteredLabel(page)).toHaveText(filter.filteredLabel);
  const chip = remindersFilterChip(page, filter.chip);
  await expect(chip).toBeVisible();
  await expect(chip).toHaveClass(/bg-primary/);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
