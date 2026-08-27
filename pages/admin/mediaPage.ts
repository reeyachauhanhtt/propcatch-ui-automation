import { expect, type Page } from "@playwright/test";
import path from "path";

/** Disposable logo used for builder media upload tests. */
export const QA_BUILDER_LOGO = path.join(
  __dirname,
  "../../test-data/images/qa-builder-logo.png",
);

export const QA_PROJECT_HERO = path.join(
  __dirname,
  "../../test-data/images/qa-project-hero.png",
);

export const QA_PROJECT_GALLERY = path.join(
  __dirname,
  "../../test-data/images/qa-project-gallery.png",
);

export const QA_PROJECT_FLOOR_PLAN = path.join(
  __dirname,
  "../../test-data/images/qa-project-floor-plan.png",
);

export const QA_PROJECT_BROCHURE = path.join(
  __dirname,
  "../../test-data/docs/qa-brochure.pdf",
);

export const PROJECT_MEDIA_SLOTS = [
  "project.hero",
  "project.gallery",
  "project.brochure",
  "project.floor_plan",
  "project.rera_doc",
] as const;

export function mediaSection(page: Page, slot: string) {
  return page.getByTestId(`media-section-${slot}`);
}

export function mediaUploaderInput(page: Page, slot: string) {
  return page.getByTestId(`media-uploader-input-${slot}`);
}

export function mediaUploaderButton(page: Page, slot: string) {
  return page.getByTestId(`media-uploader-btn-${slot}`);
}

export function mediaCards(page: Page, slot: string) {
  return mediaSection(page, slot).locator('[data-testid^="media-card-"]');
}

export async function uploadMediaFile(
  page: Page,
  slot: string,
  filePath: string,
) {
  const section = mediaSection(page, slot);
  await expect(section).toBeVisible();
  await mediaUploaderInput(page, slot).setInputFiles(filePath);
}

export async function expectMediaUploaded(
  page: Page,
  slot: string,
  fileName?: string,
  options: { expectImage?: boolean } = {},
) {
  const { expectImage = true } = options;
  const section = mediaSection(page, slot);
  await expect(mediaCards(page, slot).first()).toBeVisible({
    timeout: 30_000,
  });
  if (expectImage) {
    await expect(section.locator("img").first()).toBeVisible();
  }
  await expect(section.getByText("No file yet.", { exact: true })).toHaveCount(0);
  await expect(
    section.getByText("No files uploaded yet.", { exact: true }),
  ).toHaveCount(0);
  if (fileName) {
    await expect(
      mediaCards(page, slot).getByText(new RegExp(fileName, "i")).first(),
    ).toBeVisible();
  }
}

export async function deleteFirstMediaInSlot(page: Page, slot: string) {
  const section = mediaSection(page, slot);
  await expect(mediaCards(page, slot).first()).toBeVisible();

  // Admin media delete uses window.confirm("Delete <filename>?")
  page.once("dialog", (dialog) => {
    void dialog.accept();
  });

  await section.locator('[data-testid^="media-delete-"]').first().click();
  await expect(mediaCards(page, slot)).toHaveCount(0, { timeout: 30_000 });
  await expect(
    section
      .getByText("No file yet.", { exact: true })
      .or(section.getByText("No files uploaded yet.", { exact: true })),
  ).toBeVisible({ timeout: 10_000 });
}
