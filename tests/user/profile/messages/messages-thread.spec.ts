import { test, expect } from "@playwright/test";
import {
  messageComposerInput,
  messageList,
  messageSendButton,
  openFirstConversation,
  threadBackLink,
  threadProjectName,
} from "../../../../pages/user/messagesPage";

/**
 * Messages — conversation thread (/messages/project/<id>).
 *
 * Each row on /messages opens a full-height thread with a header (back link,
 * project name), a scrollable message list, and a composer: a message
 * textarea plus an icon-only send button that is disabled until the user
 * types. Sending posts the message to the conversation. There are no tests
 * here for reading other people's replies — only the send path.
 */
test.describe("Messages - conversation thread", () => {
  test.describe.configure({ timeout: 45_000 });

  test("MSG-008 - the conversation thread shows the project header and a composer", async ({
    page,
  }) => {
    await openFirstConversation(page);

    // Header names the project and offers a way back to the list.
    const projectName = (await threadProjectName(page).innerText()).trim();
    expect(projectName.length).toBeGreaterThan(0);
    await expect(threadBackLink(page)).toBeVisible();

    // Composer: message input + send button, disabled while empty.
    await expect(messageComposerInput(page)).toBeVisible();
    await expect(messageSendButton(page)).toBeDisabled();
  });

  test("MSG-009 - the thread back link returns to the Messages list", async ({
    page,
  }) => {
    await openFirstConversation(page);

    await threadBackLink(page).click();

    await expect(page).toHaveURL(/\/messages$/);
  });

  test("MSG-010 - typing a message enables the send button", async ({
    page,
  }) => {
    await openFirstConversation(page);

    await expect(messageSendButton(page)).toBeDisabled();
    await messageComposerInput(page).fill("Automated message 010");
    await expect(messageSendButton(page)).toBeEnabled();
  });

  test("MSG-011 - sending a message posts it to the conversation", async ({
    page,
  }) => {
    await openFirstConversation(page);

    const text = `Automated message ${Date.now()}`;
    await messageComposerInput(page).fill(text);
    await messageSendButton(page).click();

    // The composer clears and the message appears in the thread.
    await expect(messageComposerInput(page)).toHaveValue("");
    await expect(messageList(page).getByText(text)).toBeVisible();
  });

  test("MSG-012 - a sent message persists across a reload", async ({
    page,
  }) => {
    await openFirstConversation(page);

    const text = `Automated message ${Date.now()}`;
    await messageComposerInput(page).fill(text);
    await messageSendButton(page).click();
    await expect(messageList(page).getByText(text)).toBeVisible();

    await page.reload();

    await expect(messageList(page).getByText(text)).toBeVisible();
  });
});
