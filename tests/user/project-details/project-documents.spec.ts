import { test, expect } from "@playwright/test";
import { downloadsHeading, openProject } from "../../../pages/user/projectDetailsPage";

/**
 * Project Details — documents / brochures.
 *
 * Documents are OPTIONAL: only "Azure Crest Residences" (in the seeded set)
 * exposes a brochure under the "Downloads" section. The brochure is a PDF link
 * that opens in a new tab. No download/delete behaviour is asserted here.
 */
test.describe("Project Details - Documents", () => {
  test.describe.configure({ timeout: 45_000 });

  test("PROJECT-DETAIL-031 - Downloads section is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(downloadsHeading(page)).toBeVisible();
  });

  test("PROJECT-DETAIL-032 - brochure document is displayed", async ({ page }) => {
    await openProject(page, "Azure Crest Residences");

    await expect(
      page.getByRole("link", { name: "Azure-Crest-Brochure.pdf" }),
    ).toBeVisible();
  });

  test("PROJECT-DETAIL-033 - brochure links to a PDF and opens in a new tab", async ({
    page,
  }) => {
    await openProject(page, "Azure Crest Residences");

    const brochure = page.getByRole("link", { name: "Azure-Crest-Brochure.pdf" });
    await expect(brochure).toHaveAttribute("href", /\.pdf/);
    await expect(brochure).toHaveAttribute("target", "_blank");
  });
});
