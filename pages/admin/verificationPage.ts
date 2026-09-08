import { expect, type Locator, type Page } from "@playwright/test";
import { expectAdminShellVisible } from "./shell";

/**
 * Admin Verification helpers for /verification.
 *
 * The module's test cases are currently skipped until the live UI contract is
 * confirmed. Keep all selectors here so they can be updated in one place when
 * the module is activated.
 */

export function main(page: Page) {
  return page.getByRole("main");
}

export function verificationHeading(page: Page) {
  return page.getByRole("heading", { name: "Verification", exact: true });
}

export function contentApprovalsHeading(page: Page) {
  return main(page).getByText("Content approvals", { exact: true });
}

export function builderVerificationsHeading(page: Page) {
  return main(page).getByText("Builder verifications", { exact: true });
}

export function queueEmptyHeading(page: Page) {
  return main(page).getByRole("heading", { name: "Queue is empty", exact: true });
}

export function uploadedBuilderRows(page: Page) {
  return buildersWithUploadedDocuments(page).locator("li");
}

export function uploadedBuilderRowByName(page: Page, builderName: string) {
  return uploadedBuilderRows(page).filter({
    hasText: builderName,
  });
}

export function verificationFilterTab(
  page: Page,
  filter: "pending" | "approved" | "rejected" | "all",
) {
  return main(page).getByRole("button", { name: filter, exact: true });
}

export function buildersWithUploadedDocuments(page: Page) {
  return page.getByTestId("builders-with-pending-docs");
}

export function builderLinkInUploadedDocumentRow(row: Locator) {
  return row.locator('a[href*="/builders/"]').first();
}

export function approveDocumentButton(page: Page) {
  return main(page).getByRole("button", { name: "Approve", exact: true });
}

export async function openVerification(page: Page) {
  await page.goto("/verification");
  await expectVerificationListLoaded(page);
}

export async function expectVerificationListLoaded(page: Page) {
  await expect(page).toHaveURL(/\/verification\/?(\?.*)?$/);
  await expect(verificationHeading(page)).toBeVisible();
  await expectAdminShellVisible(page);
}

export async function switchVerificationTab(
  page: Page,
  filter: "pending" | "approved" | "rejected" | "all",
) {
  await verificationFilterTab(page, filter).click();
  await expect(verificationFilterTab(page, filter)).toHaveClass(/bg-primary/);
}
