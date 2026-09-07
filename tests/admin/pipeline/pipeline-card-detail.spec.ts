import { test, expect } from "@playwright/test";
import {
  findSeededPipelineCard,
  openPipeline,
} from "../../../pages/admin/pipelinePage";

/**
 * Board card → lead detail. Read-only — never edit or delete seeded leads.
 */
test.describe("Admin Pipeline card opens lead detail", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openPipeline(page);
  });

  test("ADMIN-PIPE-040 — clicking a board card opens that lead's detail @smoke", async ({
    page,
  }) => {
    const seeded = await findSeededPipelineCard(page);
    expect(seeded).not.toBeNull();
    const { card, name, href } = seeded!;

    await card.click();

    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}/?$`));
    await expect(page).toHaveURL(/\/leads\/[0-9a-f-]+$/i);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit", exact: true })).toBeVisible();
    // Do not edit or delete seeded leads.
  });

  test("ADMIN-PIPE-041 — lead detail from pipeline shows overview chrome", async ({
    page,
  }) => {
    const seeded = await findSeededPipelineCard(page);
    expect(seeded).not.toBeNull();

    await seeded!.card.click();
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByText(/contact name/i).first()).toBeVisible();
    await expect(page.getByText(/^project$/i).first()).toBeVisible();
    await expect(page.getByText(/^status$/i).first()).toBeVisible();
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
