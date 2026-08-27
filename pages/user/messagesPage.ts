import { expect, type Page } from "@playwright/test";
import { loginAsUser } from "./auth";

/**
 * Locators and helpers for the PropCatch Messages page (/messages).
 *
 * /messages is AUTH-GATED: hitting it while signed out redirects to
 * /login?next=%2Fmessages. It is reached from the Profile overview and has no
 * header link.
 *
 * The page is a READ-ONLY list of conversations, one per project you've
 * contacted. Each row is a link to that project's conversation
 * (/messages/project/<id>) and shows the project name, a relative date, and a
 * preview of the latest message (or "No messages yet — say hi."). There are no
 * compose / reply / archive controls on this page.
 *
 * Verified 2026-08-21 against the live app.
 */

/** The "Messages" h1. */
export function messagesHeading(page: Page) {
  return page.getByRole("heading", { name: "Messages", exact: true });
}

/** Subtitle under the heading. */
export function messagesSubtitle(page: Page) {
  return page.getByText(
    "Conversations with builders and their sales teams.",
  );
}

/** Every conversation row; each links to /messages/project/<id>. */
export function conversationItems(page: Page) {
  return page.locator('main a[href^="/messages/project/"]');
}

/** The project name shown on a conversation row. */
export function conversationName(row: ReturnType<typeof conversationItems>) {
  return row.locator("div.truncate.font-semibold");
}

/**
 * The message timestamp: a relative date ("Aug 19") for older items or a
 * time of day ("1:02 PM") for messages from today.
 */
export function conversationDate(row: ReturnType<typeof conversationItems>) {
  return row.locator("time");
}

/** The latest-message preview line. */
export function conversationPreview(
  row: ReturnType<typeof conversationItems>,
) {
  return row.locator("div.truncate.text-sm");
}

/** Sign in and open the Messages page. */
export async function openMessages(page: Page) {
  await loginAsUser(page);
  await page.goto("/messages");
  await expect(page).toHaveURL(/\/messages$/);
  await expect(messagesHeading(page)).toBeVisible();
}

/**
 * The conversation thread page (/messages/project/<id>).
 *
 * Each row on /messages links to a full-height thread: a header (back link +
 * project name + subtitle), a scrollable message list, and a composer
 * (message textarea + icon-only send button, disabled while empty).
 * Verified 2026-08-21 against the live app.
 */

/** Open the most recent conversation's thread. */
export async function openFirstConversation(page: Page) {
  await openMessages(page);
  await conversationItems(page).first().click();
  await expect(page).toHaveURL(/\/messages\/project\/[\w-]+$/);
  await expect(messageComposerInput(page)).toBeVisible();
}

/** The header back link (returns to /messages). */
export function threadBackLink(page: Page) {
  return page.locator("main header a");
}

/** The project name shown in the thread header. */
export function threadProjectName(page: Page) {
  return page.locator("main header div.truncate.font-semibold");
}

/** The composer's message textarea. */
export function messageComposerInput(page: Page) {
  return page.locator("main textarea");
}

/** The composer's icon-only send button. */
export function messageSendButton(page: Page) {
  return page.locator("main button");
}

/** The scrollable message list area. */
export function messageList(page: Page) {
  return page.locator("main .space-y-2.overflow-y-auto");
}
