import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const baseURL = process.env.BASE_URL || "https://propcatchwebapp.vercel.app";

const routes = [
  "/messages",
  "/enquiries",
  "/visits",
  "/saved-searches",
  "/legal/privacy",
  "/legal/terms",
  "/legal/data-deletion",
];

const browser = await chromium.launch({ headless: true });

// ---- 1) LOGGED-OUT: gating check ----
console.log("########## LOGGED-OUT GATING ##########");
for (const route of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(baseURL + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const finalUrl = page.url();
  const hasSignIn = await page
    .getByRole("banner")
    .getByRole("link", { name: "Sign in" })
    .count();
  const mainText = (await page.locator("main").innerText().catch(() => ""))
    .split("\n")[0];
  console.log(
    `${route}  =>  ${finalUrl.replace(baseURL, "")}  | headerSignIn=${hasSignIn} | mainFirstLine="${mainText}"`
  );
  await ctx.close();
}

// ---- 2) LOGGED-IN: hrefs + interactivity ----
console.log("\n########## LOGGED-IN HREFS / STATE ##########");
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(baseURL + "/login");
await page.getByLabel("Email").fill(email);
await page.getByPlaceholder("At least 8 characters").fill(password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/^((?!\/login).)*$/, { timeout: 20_000 });

// /messages hrefs
await page.goto(baseURL + "/messages");
const msgHrefs = await page.locator("main ul a").evaluateAll((as) =>
  as.slice(0, 5).map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 40) }))
);
console.log("\n/messages first 5 links:", JSON.stringify(msgHrefs, null, 1));
console.log(
  "  time elements:",
  await page.locator("main time").count(),
  "| buttons:",
  await page.locator("main button").count()
);

// /enquiries hrefs
await page.goto(baseURL + "/enquiries");
const enqHrefs = await page.locator("main ul a").evaluateAll((as) =>
  as.slice(0, 4).map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 40) }))
);
console.log("\n/enquiries first 4 links:", JSON.stringify(enqHrefs, null, 1));
console.log("  badges:", await page.locator("main ul a span.rounded-full").count());

// /visits sections + hrefs
await page.goto(baseURL + "/visits");
const visitSections = await page.locator("main section").count();
const sectionTitles = await page.locator("main section h2").allInnerTexts();
const visitHrefs = await page.locator("main ul a").evaluateAll((as) =>
  as.slice(0, 3).map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 40) }))
);
console.log("\n/visits sections:", visitSections, "titles:", sectionTitles);
console.log("  first 3 links:", JSON.stringify(visitHrefs, null, 1));

// /saved-searches interactivity
await page.goto(baseURL + "/saved-searches");
const sCount = await page.locator("main ul li").count();
const sState = await page
  .locator("main ul li")
  .evaluateAll((lis) =>
    lis.map((li) => ({
      title: li.querySelector("div.truncate.font-semibold")?.textContent.trim(),
      criteria: li.querySelector("div.mt-1")?.textContent.trim(),
      hasDelete: !!li.querySelector("button"),
      checkbox: li.querySelector("input")?.checked ?? null,
      label: li.querySelector("label span")?.textContent.trim(),
    }))
  );
console.log("\n/saved-searches cards:", JSON.stringify(sState, null, 1));

await ctx.close();
await browser.close();
