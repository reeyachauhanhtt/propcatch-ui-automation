import { test, expect } from "@playwright/test";
import {
  cleanupQaBuilderByName,
  createBuilder,
  uniqueQaBuilderName,
} from "../../../pages/admin/buildersPage";
import {
  QA_PROJECT_BROCHURE,
  expectMediaUploaded,
  uploadMediaFile,
} from "../../../pages/admin/mediaPage";
import {
  approveDocumentButton,
  builderLinkInUploadedDocumentRow,
  openVerification,
  uploadedBuilderRowByName,
  uploadedBuilderRows,
} from "../../../pages/admin/verificationPage";

/**
 * Builder verification-document visibility and navigation.
 */
test.describe("Admin Verification builder documents", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let builderName = "";

  test.afterEach(async ({ page }) => {
    if (builderName) {
      await cleanupQaBuilderByName(page, builderName);
      builderName = "";
    }
  });

  test("ADMIN-VERIFY-070 — uploaded builder verification document appears in Verification", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName("Verification");
    await createBuilder(page, { name: builderName, hqCity: "Mumbai" });

    await uploadMediaFile(page, "builder.doc", QA_PROJECT_BROCHURE);
    await expectMediaUploaded(page, "builder.doc", "qa-brochure.pdf", {
      expectImage: false,
    });

    await openVerification(page);
    const item = uploadedBuilderRowByName(page, builderName);

    await expect(item).toBeVisible();
    await expect(item).toContainText(/1 doc/);
  });

  test("ADMIN-VERIFY-071 — clicking a verification builder opens its builder detail", async ({
    page,
  }) => {
    await openVerification(page);
    const builderLink = builderLinkInUploadedDocumentRow(
      uploadedBuilderRows(page).first(),
    );
    const href = await builderLink.getAttribute("href");

    await builderLink.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href ?? "")}/?$`));
    await expect(page).toHaveURL(/\/builders\/[0-9a-f-]+$/i);
  });

  test("ADMIN-VERIFY-072 — admin can approve a pending verification document", async ({
    page,
  }) => {
    builderName = uniqueQaBuilderName("Approval");
    await createBuilder(page, { name: builderName, hqCity: "Mumbai" });
    await uploadMediaFile(page, "builder.doc", QA_PROJECT_BROCHURE);
    await expectMediaUploaded(page, "builder.doc", "qa-brochure.pdf", {
      expectImage: false,
    });

    await openVerification(page);
    await expect(uploadedBuilderRowByName(page, builderName)).toBeVisible();
    await expect(approveDocumentButton(page)).toBeVisible({ timeout: 5_000 });
    await approveDocumentButton(page).click();
    await expect(page.getByText(/Approved/i)).toBeVisible();
  });
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
