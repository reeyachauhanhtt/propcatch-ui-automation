import { test, expect } from "@playwright/test";
import { openHomepageLoggedIn } from "../../../pages/user/auth";
import {
  exploreHeading,
  featuredHeading,
  heroHeading,
  projectCardByName,
  projectCards,
} from "../../../pages/user/homePage";

test.describe("Homepage projects", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ page }) => {
    await openHomepageLoggedIn(page);
  });

  test("HOMEPAGE-047 - project cards display name, location, status, and price", async ({
    page,
  }) => {
    const card = projectCardByName(page, "Montessa Heights").first();
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: "Montessa Heights" })).toBeVisible();
    await expect(card.getByText(/Mumbai/i)).toBeVisible();
    await expect(card.getByText(/Ready to Move/i)).toBeVisible();
    await expect(card.getByText(/₹|Price on request/i)).toBeVisible();
  });

  test("HOMEPAGE-048 - clicking a project card opens project details", async ({
    page,
  }) => {
    const card = projectCardByName(page, "Azure Crest Residences").first();
    await expect(card).toBeVisible();
    await card.click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(
      page.getByRole("heading", { name: "Azure Crest Residences" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
  });

  test("HOMEPAGE-049 - back from project details returns to the homepage", async ({
    page,
  }) => {
    await projectCardByName(page, "Palm Grove Villas").first().click();
    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { name: "Palm Grove Villas" })).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(heroHeading(page)).toBeVisible();
    await expect(exploreHeading(page)).toBeVisible();
  });

  test("HOMEPAGE-050 - user can open more than one project from the homepage", async ({
    page,
  }) => {
    await projectCardByName(page, "Montessa Heights").first().click();
    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { name: "Montessa Heights" })).toBeVisible();

    await page.goBack();
    await expect(heroHeading(page)).toBeVisible();

    await projectCardByName(page, "Vertex Business Park").first().click();
    await expect(page).toHaveURL(/\/p\//);
    await expect(
      page.getByRole("heading", { name: "Vertex Business Park" }),
    ).toBeVisible();
  });

  test("HOMEPAGE-051 - project images load when an image is present", async ({
    page,
  }) => {
    const image = page.getByRole("img", { name: "Azure Crest Residences" }).first();
    await expect(image).toBeVisible();
    await expect
      .poll(async () =>
        image.evaluate((el) => {
          const img = el as HTMLImageElement;
          return img.complete && img.naturalWidth > 0;
        }),
      )
      .toBe(true);
  });

  test("HOMEPAGE-052 - Add to compare toggles to Remove from compare", async ({
    page,
  }) => {
    const card = projectCardByName(page, "Vertex Business Park").first();
    const compareBtn = card.getByRole("button", { name: /compare/i });

    await expect(compareBtn).toHaveAttribute("aria-label", "Add to compare");
    await compareBtn.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(compareBtn).toHaveAttribute("aria-label", "Remove from compare");

    await compareBtn.click();
    await expect(compareBtn).toHaveAttribute("aria-label", "Add to compare");
  });

  test("HOMEPAGE-053 - featured carousel changes the active slide", async ({
    page,
  }) => {
    const slide1 = page.getByRole("button", { name: "Go to slide 1" });
    const slide2 = page.getByRole("button", { name: "Go to slide 2" });
    const slide3 = page.getByRole("button", { name: "Go to slide 3" });

    await expect(slide1).toHaveClass(/bg-accent/);

    await slide2.click();
    await expect(slide2).toHaveClass(/bg-accent/);
    await expect(slide1).not.toHaveClass(/w-6 bg-accent/);

    await slide3.click();
    await expect(slide3).toHaveClass(/bg-accent/);
    await expect(slide2).not.toHaveClass(/w-6 bg-accent/);
  });

  test("HOMEPAGE-054 - featured project card opens project details", async ({
    page,
  }) => {
    await expect(featuredHeading(page)).toBeVisible();
    await projectCardByName(page, "Skyline Heights").first().click();

    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole("heading", { name: "Skyline Heights" })).toBeVisible();
  });

  test("HOMEPAGE-055 - explore projects includes a count that is not broken", async ({
    page,
  }) => {
    const countLabel = page.getByText(/\d+ projects available/);
    await expect(countLabel).toBeVisible();
    await expect(countLabel).not.toHaveText(/undefined|null|NaN/i);
    expect(await projectCards(page).count()).toBeGreaterThan(0);
  });
});
