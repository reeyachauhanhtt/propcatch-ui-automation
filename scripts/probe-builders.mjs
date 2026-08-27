import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(".env") });
const baseURL = process.env.BASE_URL || "https://propcatchwebapp.vercel.app";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(baseURL + "/builders", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const builderLinks = await page.locator("main a[href^='/b/']").evaluateAll(as => as.map(a => ({href: a.getAttribute("href"), name: a.querySelector("div.truncate")?.textContent.trim(), count: a.querySelector(".text-muted-foreground")?.textContent.trim()})));
for (const b of builderLinks) {
  const p = await ctx.newPage();
  await p.goto(baseURL + b.href, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(900);
  const h1 = await p.locator("h1").innerText().catch(()=>"?");
  const verified = await p.getByText("Verified", { exact: true }).count();
  const web = await p.locator('main a[href^="http"]').count();
  const tagline = await p.locator("main section p.text-muted-foreground").first().innerText().catch(()=>"(none)");
  const stats = await p.locator("main .grid div").filter({ has: p.locator("div.text-xs") }).evaluateAll(cs => cs.map(c => ({label: c.querySelector("div.text-xs")?.textContent.trim(), val: c.querySelector("div.text-base")?.textContent.trim()})));
  const projLinks = await p.locator("main a[href^='/p/']").count();
  const projHeading = await p.locator("main h2").innerText().catch(()=>"(none)");
  console.log(`${b.name} | h1="${h1}" | verified=${verified} | webLinks=${web} | projCards=${projLinks} | h2="${projHeading}"`);
  console.log(`    tagline="${tagline.slice(0,55)}"`);
  console.log(`    stats=${JSON.stringify(stats)}`);
  await p.close();
}
// logged-in vs logged-out check for /builders
await page.goto(baseURL + "/login", { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL);
await page.getByPlaceholder("At least 8 characters").fill(process.env.TEST_USER_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/^((?!\/login).)*$/, { timeout: 20_000 });
await page.goto(baseURL + "/builders", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
console.log("\nLOGGED-IN /builders: h1=", await page.locator("h1").innerText(), "| cards=", await page.locator("main a[href^='/b/']").count(), "| btns=", await page.locator("main button").count());
await browser.close();
