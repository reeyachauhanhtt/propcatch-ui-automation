import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(".env") });

const ADMIN = process.env.ADMIN_BASE_URL || "https://propcatch-admin.vercel.app";
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;
const outDir = path.resolve("scripts/admin-audit/logged-in");
fs.mkdirSync(outDir, { recursive: true });

function save(name, data) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 2));
  console.log("wrote", name);
}

async function snap(page, label) {
  await page.waitForTimeout(800);
  const headings = await page.locator("h1,h2,h3").allInnerTexts().catch(() => []);
  const buttons = [
    ...new Set(
      await page
        .getByRole("button")
        .evaluateAll((els) => els.map((e) => (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)).filter(Boolean)),
    ),
  ];
  const links = await page.locator("a[href]").evaluateAll((as) =>
    as.map((a) => ({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
    })),
  );
  const inputs = await page.locator("input,textarea,select").evaluateAll((els) =>
    els
      .filter((el) => el.type !== "hidden")
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type"),
        name: el.getAttribute("name"),
        id: el.id,
        placeholder: el.getAttribute("placeholder"),
        label:
          el.labels?.[0]?.textContent?.trim() ||
          el.getAttribute("aria-label") ||
          null,
        required: el.required,
        disabled: el.disabled,
      })),
  );
  const tableHeaders = await page.locator("thead th, table th").allInnerTexts().catch(() => []);
  const rowCount = await page.locator("tbody tr").count();
  const nav = await page.locator("nav, aside, [data-sidebar], [role=navigation]").allInnerTexts().catch(() => []);
  const mainLines = (await page.locator("main").innerText().catch(() => page.locator("body").innerText()))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 60);
  const roles = {};
  for (const role of ["tab", "combobox", "searchbox", "dialog", "checkbox", "switch", "menuitem", "option", "row"]) {
    roles[role] = await page.getByRole(role).count();
  }
  const testids = await page.locator("[data-testid]").evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-testid")),
  );
  return {
    label,
    url: page.url(),
    title: await page.title(),
    headings,
    buttons,
    links: links.filter((l) => l.href && (l.href.startsWith("/") || l.href.startsWith(ADMIN))),
    inputs,
    tableHeaders,
    rowCount,
    nav: nav.map((t) => t.slice(0, 800)),
    mainLines,
    roles,
    testids: [...new Set(testids)],
  };
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

console.log("===== LOGIN =====");
await page.goto(ADMIN + "/login", { waitUntil: "domcontentloaded" });
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForTimeout(4000);
console.log("after login", page.url());
await page.screenshot({ path: path.join(outDir, "00-after-login.png"), fullPage: true });

if (page.url().includes("/login")) {
  const body = await page.locator("body").innerText();
  save("00-login-failed.json", { url: page.url(), body: body.slice(0, 500) });
  console.error("LOGIN FAILED");
  await browser.close();
  process.exit(1);
}

await page.context().storageState({ path: path.join(outDir, "admin-storage.json") });
const home = await snap(page, "post-login");
save("01-home.json", home);
await page.screenshot({ path: path.join(outDir, "01-home.png"), fullPage: true });

// Collect nav hrefs from sidebar/nav
const navHrefs = [
  ...new Set(
    (
      await page.locator("nav a[href], aside a[href], [role=navigation] a[href]").evaluateAll((as) =>
        as.map((a) => a.getAttribute("href")),
      )
    ).filter((h) => h && h.startsWith("/")),
  ),
];
console.log("nav hrefs", navHrefs);
save("02-nav-hrefs.json", navHrefs);

// Also collect any top-level links in shell
const allAppHrefs = [
  ...new Set(
    home.links.map((l) => l.href.replace(ADMIN, "")).filter((h) => h.startsWith("/") && !h.startsWith("/login")),
  ),
];
console.log("all app hrefs", allAppHrefs);

const routes = [...new Set([...navHrefs, ...allAppHrefs, "/dashboard", "/projects", "/builders", "/users", "/leads", "/units", "/site-visits", "/pricing", "/pipeline", "/verification", "/reports", "/settings"])];

const pagesSummary = {};
for (const route of routes) {
  try {
    await page.goto(ADMIN + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    if (page.url().includes("/login")) {
      pagesSummary[route] = { error: "redirected-to-login" };
      continue;
    }
    const s = await snap(page, route);
    const slug = route.replace(/\W+/g, "_") || "root";
    save(`page${slug}.json`, s);
    await page.screenshot({ path: path.join(outDir, `page${slug}.png`), fullPage: true });
    pagesSummary[route] = {
      url: s.url,
      headings: s.headings,
      buttons: s.buttons,
      tableHeaders: s.tableHeaders,
      rowCount: s.rowCount,
      inputs: s.inputs,
      mainLines: s.mainLines.slice(0, 35),
      roles: s.roles,
      testids: s.testids,
      internalLinks: s.links.filter((l) => l.href.startsWith("/") && l.href !== route).slice(0, 40),
    };
    console.log("OK", route, s.headings.slice(0, 4), "rows", s.rowCount, "btns", s.buttons.slice(0, 8));
  } catch (e) {
    pagesSummary[route] = { error: String(e) };
    console.log("FAIL", route, e.message);
  }
}
save("03-pages-summary.json", pagesSummary);

// For each list page, try opening first row / New / Create without saving
async function exploreActions(route, actionNames) {
  const notes = [];
  await page.goto(ADMIN + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  for (const name of actionNames) {
    const btn = page.getByRole("button", { name: new RegExp(name, "i") }).first();
    const link = page.getByRole("link", { name: new RegExp(name, "i") }).first();
    const target = (await btn.count()) ? btn : (await link.count()) ? link : null;
    if (!target) {
      notes.push({ action: name, found: false });
      continue;
    }
    await target.click().catch(() => {});
    await page.waitForTimeout(1200);
    const dialogCount = await page.getByRole("dialog").count();
    const s = await snap(page, `${route}-${name}`);
    const slug = `action_${route.replace(/\W+/g, "_")}_${name.replace(/\W+/g, "_")}`;
    save(`${slug}.json`, s);
    await page.screenshot({ path: path.join(outDir, `${slug}.png`), fullPage: true });
    notes.push({
      action: name,
      found: true,
      url: s.url,
      dialog: dialogCount > 0,
      headings: s.headings,
      inputs: s.inputs,
      buttons: s.buttons,
    });
    // Cancel / close without saving
    const cancel = page.getByRole("button", { name: /cancel|close|back/i }).first();
    if (await cancel.count()) {
      await cancel.click().catch(() => {});
      await page.waitForTimeout(500);
    } else if (dialogCount) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    } else {
      await page.goto(ADMIN + route, { waitUntil: "domcontentloaded" });
    }
  }
  // Open first table row / first detail link if present
  const detail = page.locator('tbody tr a, main a[href*="' + route + '/"]').first();
  if (await detail.count()) {
    const href = await detail.getAttribute("href");
    await detail.click().catch(() => {});
    await page.waitForTimeout(1500);
    const s = await snap(page, `${route}-first-detail`);
    const slug = `detail_${route.replace(/\W+/g, "_")}`;
    save(`${slug}.json`, s);
    await page.screenshot({ path: path.join(outDir, `${slug}.png`), fullPage: true });
    notes.push({
      action: "first-detail",
      href,
      url: s.url,
      headings: s.headings,
      buttons: s.buttons,
      inputs: s.inputs,
      tableHeaders: s.tableHeaders,
      mainLines: s.mainLines.slice(0, 40),
    });
  }
  return notes;
}

const actionExplore = {};
for (const route of ["/projects", "/builders", "/users", "/leads", "/units", "/site-visits", "/pricing", "/pipeline", "/verification", "/reports", "/settings", "/dashboard"]) {
  if (!pagesSummary[route] || pagesSummary[route].error) continue;
  console.log("===== ACTIONS", route, "=====");
  actionExplore[route] = await exploreActions(route, [
    "New",
    "Add",
    "Create",
    "Invite",
    "Import",
    "Export",
    "Upload",
    "Filter",
    "Search",
  ]);
}
save("04-actions.json", actionExplore);

// Search boxes on list pages
const searchNotes = {};
for (const route of ["/projects", "/builders", "/users", "/leads", "/units", "/site-visits"]) {
  await page.goto(ADMIN + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const search = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();
  if (await search.count()) {
    await search.fill("zzzz-no-match-qa");
    await page.waitForTimeout(1200);
    searchNotes[route] = {
      hasSearch: true,
      afterInvalid: (await page.locator("main").innerText()).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 25),
      rowCount: await page.locator("tbody tr").count(),
    };
    await search.fill("");
    await page.waitForTimeout(800);
  } else {
    searchNotes[route] = { hasSearch: false };
  }
}
save("05-search.json", searchNotes);

await browser.close();
console.log("DONE logged-in audit");
