import { test, expect, type Page } from "@playwright/test";
import { openUserContext } from "../../pages/crossPlatform";
import {
  leadRows,
  openLeads,
  searchLeads,
  softDeleteLead,
} from "../../pages/admin/leadsPage";
import { loginAsUser } from "../../pages/user/auth";
import {
  contactBuilderButton,
  openProject,
  requestCallbackButton,
  siteVisitButton,
  siteVisitEmailInput,
  siteVisitNameInput,
  siteVisitPhoneInput,
  siteVisitSubmitButton,
} from "../../pages/user/projectDetailsPage";

const QA_CONTACT_NAME = "QA Autotest Xapp";
const QA_PROJECT = "Montessa Heights";

type EnquiryScenario = {
  action: "site visit" | "callback" | "contact builder";
  open: (page: Page) => Promise<void>;
  messagePlaceholder: string;
  listSource: string;
  detailSource: string;
};

const SCENARIOS: EnquiryScenario[] = [
  {
    action: "site visit",
    open: async (page) => {
      await siteVisitButton(page).click();
    },
    messagePlaceholder: "Preferred date / time?",
    listSource: "app:site_visit",
    detailSource: "App:Site Visit",
  },
  {
    action: "callback",
    open: async (page) => {
      await requestCallbackButton(page).click();
    },
    messagePlaceholder: "When should we call?",
    listSource: "app:callback",
    detailSource: "App:Callback",
  },
  {
    action: "contact builder",
    open: async (page) => {
      await contactBuilderButton(page).click();
    },
    messagePlaceholder: "Anything specific?",
    listSource: "app:general",
    detailSource: "App:General",
  },
];

/**
 * User enquiry → Admin Leads + Pipeline propagation.
 *
 * Each scenario submits a disposable QA enquiry in an authenticated user
 * context, verifies the resulting Admin lead and pipeline card, then deletes
 * that exact lead by its unique phone number. Seeded leads are never changed.
 */
test.describe("User → Admin lead generation", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  let cleanupPhone = "";

  test.afterEach(async ({ page }) => {
    if (cleanupPhone) {
      await cleanupLeadByPhone(page, cleanupPhone);
      cleanupPhone = "";
    }
  });

  for (const [index, scenario] of SCENARIOS.entries()) {
    test(`XAPP-LEAD-00${index + 1} — user ${scenario.action} creates an Admin lead and pipeline card${index === 0 ? " @smoke" : ""}`, async ({
      page,
      browser,
    }) => {
      const phone = uniqueQaPhone(index);
      const message = `QA Autotest ${scenario.action} ${Date.now()}`;
      cleanupPhone = phone;

      const { context, page: userPage } = await openUserContext(browser);
      try {
        await submitUserEnquiry(userPage, scenario, {
          phone,
          message,
        });
      } finally {
        await context.close();
      }

      const { row, href } = await expectGeneratedAdminLead(page, {
        phone,
        source: scenario.listSource,
      });

      await expect(row.locator("td").nth(0)).toContainText(QA_CONTACT_NAME);
      await expect(row.locator("td").nth(1)).toContainText(QA_PROJECT);
      await expect(row.locator("td").nth(3)).toHaveText("New");

      await row.locator(`a[href="${href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}/?$`));
      await expect(
        page.getByRole("heading", { name: QA_CONTACT_NAME, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(phone, { exact: true }).first()).toBeVisible();
      await expect(
        page.getByText(scenario.detailSource, { exact: true }),
      ).toBeVisible();
      await expect(page.getByText(message, { exact: false })).toBeVisible();

      await page.goto("/pipeline");
      const pipelineCard = page.locator(`main a[href="${href}"]`);
      await expect(pipelineCard).toBeVisible({ timeout: 20_000 });
      await expect(pipelineCard).toContainText(QA_CONTACT_NAME);
      await expect(pipelineCard).toContainText(phone);
      await expect(pipelineCard).toContainText(QA_PROJECT);
    });
  }

  test("XAPP-LEAD-004 — WhatsApp enquiry propagates to Admin Leads", async () => {
    test.skip(
      true,
      "WhatsApp opens an external handoff without a per-run contact form, so the resulting shared-account lead cannot be identified and safely deleted.",
    );
  });
});

async function submitUserEnquiry(
  page: Page,
  scenario: EnquiryScenario,
  data: { phone: string; message: string },
) {
  await loginAsUser(page);
  await openProject(page, QA_PROJECT);
  await scenario.open(page);

  await siteVisitNameInput(page).fill(QA_CONTACT_NAME);
  await siteVisitPhoneInput(page).fill(data.phone);
  await siteVisitEmailInput(page).fill(
    `qa.xapp.${data.phone}@example.com`,
  );
  await page.getByPlaceholder(scenario.messagePlaceholder).fill(data.message);
  await expect(siteVisitSubmitButton(page)).toBeEnabled();
  await siteVisitSubmitButton(page).click();
  await expect(page.getByText("Enquiry sent")).toBeVisible({
    timeout: 20_000,
  });
}

async function expectGeneratedAdminLead(
  page: Page,
  expected: { phone: string; source: string },
) {
  await openLeads(page);
  await searchLeads(page, expected.phone);

  const row = leadRows(page).filter({ hasText: expected.phone }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row.locator("td").nth(2)).toHaveText(expected.source);

  const link = row.locator('a[href^="/leads/"]').first();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/leads\/[0-9a-f-]+$/i);
  return { row, href: href! };
}

/** Delete only leads whose detail contains this run's unique phone number. */
async function cleanupLeadByPhone(page: Page, phone: string) {
  await openLeads(page);
  await searchLeads(page, phone);

  const matchingRows = leadRows(page).filter({ hasText: phone });
  const hrefs = await matchingRows
    .locator('a[href^="/leads/"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );

  for (const href of [...new Set(hrefs)]) {
    await page.goto(href);
    await expect(page.getByText("Leads / Detail")).toBeVisible();
    await expect(page.getByText(phone, { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: QA_CONTACT_NAME, exact: true }),
    ).toBeVisible();
    await softDeleteLead(page);
  }
}

function uniqueQaPhone(offset: number) {
  const suffix = String(Date.now() + offset).slice(-9);
  return `9${suffix}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
