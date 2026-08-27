import { test, expect } from "@playwright/test";
import {
  conversationDate,
  conversationItems,
  conversationName,
  conversationPreview,
  messagesHeading,
  messagesSubtitle,
  openMessages,
} from "../../../../pages/user/messagesPage";

/**
 * Messages — page content (/messages).
 *
 * The page is a read-only list of conversations with builders, one per
 * project. Each row links to that project's conversation and shows the
 * project name, a relative date, and a preview of the latest message. There
 * are no compose / reply / archive controls.
 */
test.describe("Messages - page", () => {
  test.describe.configure({ timeout: 45_000 });

  test("MSG-004 - the page shows its heading and subtitle", async ({ page }) => {
    await openMessages(page);

    await expect(messagesHeading(page)).toBeVisible();
    await expect(messagesSubtitle(page)).toBeVisible();
  });

  test("MSG-005 - conversations are listed with name, date and message preview", async ({
    page,
  }) => {
    await openMessages(page);

    const rows = conversationItems(page);
    await expect(rows.first()).toBeVisible();

    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);

      const name = (await conversationName(row).innerText()).trim();
      expect(name.length).toBeGreaterThan(0);

      // Timestamp is a relative date ("Aug 19", optionally with a year) for
      // older items, or a time of day ("1:02 PM") for messages from today.
      await expect(conversationDate(row)).toHaveText(
        /^(?:[A-Za-z]{3} \d{1,2}(?:, \d{4})?|\d{1,2}:\d{2} [AP]M)$/,
      );

      // Preview is either "No messages yet — say hi." or the last message.
      const preview = (await conversationPreview(row).innerText()).trim();
      expect(preview.length).toBeGreaterThan(0);
    }
  });

  test("MSG-006 - each conversation links to its project's thread", async ({
    page,
  }) => {
    await openMessages(page);

    const rows = conversationItems(page);
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toHaveAttribute(
        "href",
        /^\/messages\/project\/[\w-]+$/,
      );
    }
  });

  test("MSG-007 - the conversation list is read-only (no controls)", async ({
    page,
  }) => {
    await openMessages(page);

    await expect(page.locator("main button")).toHaveCount(0);
    await expect(
      page.locator("main input, main textarea, main select"),
    ).toHaveCount(0);
  });
});
