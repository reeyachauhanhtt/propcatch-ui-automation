import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(".env") });
const baseURL = process.env.BASE_URL || "https://propcatchwebapp.vercel.app";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

// 1. Auth gate for anonymous
const anon = await browser.newContext();
const anonPage = await anon.newPage();
await anonPage.goto(baseURL + "/visits");
console.log("ANON REDIRECT:", anonPage.url());
console.log("ANON HEADING:", await anonPage.locator("main h1, main h2").first().innerText().catch(() => "(none)"));
await anon.close();

// 2. Logged-in page
await page.goto(baseURL + "/login");
await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL);
await page.getByPlaceholder("At least 8 characters").fill(process.env.TEST_USER_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/^((?!\/login).)*$/, { timeout: 20000 });
await page.goto(baseURL + "/visits");
await page.waitForLoadState("networkidle").catch(()=>{});
console.log("URL:", page.url());

console.log("--- HEADINGS / TEXT ---");
const h = await page.locator("main h1, main h2, main h3").allInnerTexts();
console.log("headings:", JSON.stringify(h));
const subtitle = await page.locator("main .text-sm, main .text-xs, main p").first().allInnerTexts().catch(()=>[]);
console.log("first muted texts:", JSON.stringify(subtitle.slice(0,5)));

console.log("--- STRUCTURE: list items & sections ---");
console.log("main ul li count:", await page.locator("main ul li").count());
console.log("tabs/segmented:", await page.locator("main button").allInnerTexts());

// find any grouped sections like Upcoming / Past
const sectionHeads = await page.locator("main").evaluate(el => {
  const out = [];
  for (const n of el.querySelectorAll("h1,h2,h3,h4,div.font-semibold,div.font-medium,div.text-sm")) {
    const t = n.textContent.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 25);
});
console.log("section-like headings:", JSON.stringify(sectionHeads));

console.log("--- FIRST CARD (if any) ---");
const liCount = await page.locator("main ul li").count();
if (liCount > 0) {
  const first = await page.locator("main ul li").first().evaluate(el => {
    const out = [];
    const walk = (node, depth) => {
      if (node.nodeType === 3) { const t = node.textContent.trim(); if (t) out.push("  ".repeat(depth) + JSON.stringify(t)); return; }
      if (node.nodeType !== 1) return;
      const cls = typeof node.className === "string" ? "." + node.className.trim().split(/\s+/).join(".") : "";
      const href = node.tagName === "A" ? ` href="${node.getAttribute("href")}"` : "";
      out.push("  ".repeat(depth) + node.tagName.toLowerCase() + cls + href);
      for (const c of node.childNodes) walk(c, depth+1);
    };
    walk(el, 0);
    return out.join("\n");
  });
  console.log(first);
  console.log("--- LINKS in list ---");
  console.log(await page.locator("main ul a").evaluateAll(as => as.slice(0,5).map(a => ({ text: a.textContent.trim().slice(0,60), href: a.getAttribute("href") }))));
  console.log("--- CONTROLS in list ---");
  console.log("buttons:", await page.locator("main ul button").allInnerTexts());
} else {
  // empty state
  console.log("EMPTY STATE:", JSON.stringify(await page.locator("main").innerText().then(t => t.slice(0, 600))));
}
await browser.close();
