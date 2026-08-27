import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

const ADMIN_URL = "https://propcatch-admin.vercel.app";
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const outDir = path.resolve("scripts/admin-audit");
fs.mkdirSync(outDir, { recursive: true });

function dump(name, data) {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data, null, 2));
  console.log(`wrote ${file}`);
}

async function snapshot(page) {
  const url = page.url();
  const title = await page.title();
  const headings = await page.locator("h1,h2,h3").allInnerTexts().catch(() => []);
  const buttons = await page
    .getByRole("button")
    .evaluateAll((els) => els.map((e) => e.textContent.trim().slice(0, 80)).filter(Boolean));
  const links = await page.locator("a[href]").evaluateAll((as) =>
    as.map((a) => ({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim().slice(0, 80),
    })),
  );
  const inputs = await page.locator("input,textarea,select").evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type"),
      name: el.getAttribute("name"),
      id: el.getAttribute("id"),
      placeholder: el.getAttribute("placeholder"),
      ariaLabel: el.getAttribute("aria-label"),
      required: el.required,
      disabled: el.disabled,
      value: (el.value || "").slice(0, 60),
    })),
  );
  const tables = await page.locator("table").count();
  const tableHeaders = await page.locator("thead th, table th").allInnerTexts().catch(() => []);
  const rowCount = await page.locator("tbody tr, table tbody tr").count();
  const comboboxes = await page.getByRole("combobox").allInnerTexts().catch(() => []);
  const searchboxes = await page.getByRole("searchbox").allInnerTexts().catch(() => []);
  const dialogs = await page.getByRole("dialog").count();
  const navText = await page
    .locator("nav, aside, [role=navigation]")
    .allInnerTexts()
    .catch(() => []);
  const mainText = (await page.locator("main").innerText().catch(() => page.locator("body").innerText()))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 80);
  const roles = {};
  for (const role of ["tab", "menuitem", "option", "checkbox", "switch", "radio", "row", "columnheader", "gridcell"]) {
    roles[role] = await page.getByRole(role).count();
  }
  return {
    url,
    title,
    headings,
    buttons: [...new Set(buttons)],
    links,
    inputs,
    tables,
    tableHeaders,
    rowCount,
    comboboxes,
    searchboxes,
    dialogs,
    navText: navText.map((t) => t.slice(0, 500)),
    mainText,
    roles,
  };
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: path.join(outDir, "video") },
});
const page = await ctx.newPage();
page.setDefaultTimeout(20000);

const network = [];
page.on("response", async (res) => {
  const u = res.url();
  if (u.includes("vercel") || u.includes("supabase") || u.includes("api") || u.includes("auth")) {
    network.push({ status: res.status(), method: res.request().method(), url: u.slice(0, 180) });
  }
});

console.log("===== LOGIN PAGE =====");
await page.goto(ADMIN_URL + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const loginSnap = await snapshot(page);
dump("01-login.json", loginSnap);
await page.screenshot({ path: path.join(outDir, "01-login.png"), fullPage: true });
console.log("login headings", loginSnap.headings);
console.log("login buttons", loginSnap.buttons);
console.log("login inputs", loginSnap.inputs);
console.log("login links", loginSnap.links);

console.log("===== LOGGED-OUT PROTECTED ROUTES =====");
const guessedRoutes = [
  "/",
  "/dashboard",
  "/projects",
  "/users",
  "/builders",
  "/enquiries",
  "/visits",
  "/leads",
  "/settings",
  "/profile",
  "/forgot-password",
  "/reset-password",
  "/signup",
];
const gating = [];
for (const route of guessedRoutes) {
  const p = await ctx.newPage();
  await p.goto(ADMIN_URL + route, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  gating.push({
    route,
    final: p.url().replace(ADMIN_URL, ""),
    heading: (await p.locator("h1,h2").allInnerTexts().catch(() => [])).slice(0, 3),
  });
  await p.close();
}
dump("02-gating.json", gating);
console.log(gating);

console.log("===== ATTEMPT LOGIN =====");
await page.goto(ADMIN_URL + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const emailInput = page.getByLabel("Email").or(page.locator('input[type="email"]')).first();
const passInput = page
  .getByLabel("Password")
  .or(page.locator('input[type="password"]'))
  .first();
await emailInput.fill(email);
await passInput.fill(password);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForTimeout(4000);
console.log("after login url", page.url());
await page.screenshot({ path: path.join(outDir, "02-after-login.png"), fullPage: true });
const afterLogin = await snapshot(page);
dump("03-after-login.json", afterLogin);
console.log("after login headings", afterLogin.headings);
console.log("after login buttons", afterLogin.buttons);
console.log("after login nav", afterLogin.navText);
console.log("after login main", afterLogin.mainText.slice(0, 40));

// Collect all in-app hrefs
const hrefs = [
  ...new Set(
    afterLogin.links
      .map((l) => l.href)
      .filter((h) => h && h.startsWith("/") && !h.startsWith("//")),
  ),
];
console.log("in-app hrefs", hrefs);

const pages = {};
for (const href of hrefs) {
  try {
    await page.goto(ADMIN_URL + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const snap = await snapshot(page);
    const slug = href.replace(/\W+/g, "_") || "root";
    dump(`page${slug}.json`, snap);
    await page.screenshot({ path: path.join(outDir, `page${slug}.png`), fullPage: true });
    pages[href] = {
      url: snap.url,
      headings: snap.headings,
      buttons: snap.buttons,
      tableHeaders: snap.tableHeaders,
      rowCount: snap.rowCount,
      inputs: snap.inputs.map((i) => i.placeholder || i.ariaLabel || i.name || i.type),
      mainText: snap.mainText.slice(0, 40),
      links: snap.links.filter((l) => l.href && l.href.startsWith("/")).slice(0, 30),
    };
    console.log("visited", href, snap.headings.slice(0, 5));
  } catch (e) {
    pages[href] = { error: String(e) };
    console.log("fail", href, e.message);
  }
}
dump("04-pages-summary.json", pages);

dump(
  "05-network.json",
  network.filter((n) => !n.url.includes("_next") && !n.url.includes("static")).slice(0, 200),
);

await ctx.close();
await browser.close();
console.log("DONE");
