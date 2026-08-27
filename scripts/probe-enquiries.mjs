import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(".env") });
const baseURL = process.env.BASE_URL || "https://propcatchwebapp.vercel.app";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(baseURL + "/login");
await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL);
await page.getByPlaceholder("At least 8 characters").fill(process.env.TEST_USER_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/^((?!\/login).)*$/, { timeout: 20000 });
await page.goto(baseURL + "/enquiries");
await page.waitForLoadState("networkidle").catch(()=>{});
const cards = page.locator("main ul li");
console.log("TOTAL CARDS:", await cards.count());
const types = await cards.locator("div.mt-1 span:first-child").allInnerTexts();
const statuses = await cards.locator("span.shrink-0").allInnerTexts();
const dates = await cards.locator("div.mt-1 span").nth(0).allInnerTexts();
console.log("DISTINCT TYPES:", JSON.stringify([...new Set(types.map(t=>t.trim()))]));
console.log("DISTINCT STATUSES:", JSON.stringify([...new Set(statuses.map(s=>s.trim()))]));
console.log("DATE FORMATS:", JSON.stringify([...new Set(dates.map(d=>d.trim()))].slice(0,8)));
// first card full structure
console.log("--- FIRST CARD ---");
const first = await cards.first().evaluate(el => {
  const out = [];
  const walk = (node, depth) => {
    if (node.nodeType === 3) { const t = node.textContent.trim(); if (t) out.push("  ".repeat(depth) + JSON.stringify(t)); return; }
    if (node.nodeType !== 1) return;
    const cls = typeof node.className === "string" ? "." + node.className.trim().split(/\s+/).join(".") : "";
    out.push("  ".repeat(depth) + node.tagName.toLowerCase() + cls);
    for (const c of node.childNodes) walk(c, depth+1);
  };
  walk(el, 0);
  return out.join("\n");
});
console.log(first);
console.log("--- CONTROLS ---");
console.log("main buttons:", await page.locator("main button").count(), "| inputs:", await page.locator("main input, main textarea, main select").count());
console.log("hrefs sample:", await page.locator("main ul a").evaluateAll(as => as.slice(0,3).map(a=>a.getAttribute("href"))));
await browser.close();
