import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ADMIN_URL = "https://propcatch-admin.vercel.app";
const outDir = path.resolve("scripts/admin-audit");

const CANDIDATES = [
  "/", "/login", "/forgot-password", "/reset-password", "/update-password",
  "/dashboard", "/home", "/overview",
  "/projects", "/projects/new", "/projects/create", "/projects/import", "/projects/export",
  "/projects/drafts", "/projects/archived",
  "/builders", "/builders/new", "/builders/create", "/builders/import",
  "/users", "/users/new", "/users/invite", "/users/roles",
  "/leads", "/leads/new", "/leads/import", "/leads/pipeline",
  "/settings", "/settings/profile", "/settings/account", "/settings/team",
  "/settings/roles", "/settings/general", "/settings/security", "/settings/notifications",
  "/settings/integrations", "/settings/appearance", "/settings/branding",
  "/units", "/units/new",
  "/reports", "/reports/leads", "/reports/projects",
  "/site-visits", "/site-visits/new", "/visits", "/bookings", "/appointments",
  "/pricing", "/pricing/new",
  "/pipeline", "/kanban", "/deals",
  "/verification", "/verify", "/approvals",
  "/inventory", "/towers", "/amenities", "/amenities/new",
  "/documents", "/media", "/gallery", "/files", "/uploads", "/assets",
  "/notifications", "/messages", "/inbox", "/chat", "/threads", "/whatsapp",
  "/cities", "/localities", "/locations",
  "/configurations", "/config", "/masters", "/lookups",
  "/audit", "/activity", "/logs",
  "/callbacks", "/enquiries", "/inquiries", "/requests",
  "/shortlists", "/compare", "/favourites", "/saved-searches",
  "/reviews", "/faqs", "/cms", "/content", "/banners", "/featured",
  "/team", "/roles", "/permissions", "/staff", "/admins", "/members", "/invite",
  "/brokers", "/agents", "/partners", "/developers",
  "/account", "/profile", "/logout", "/sign-out",
  "/analytics", "/stats", "/metrics",
  "/calendar", "/map", "/search", "/help", "/support",
  "/legal", "/legal/privacy", "/legal/terms",
  "/onboarding", "/invites",
  "/floor-plans", "/floorplans", "/brochures", "/rera", "/compliance",
  "/contacts", "/customers", "/buyers",
  "/integrations", "/webhooks", "/api-keys",
  "/email", "/sms", "/campaigns", "/channels",
  "/tasks", "/follow-ups", "/followups", "/reminders", "/notes",
  "/payments", "/billing", "/subscriptions", "/plans", "/coupons", "/offers",
  "/property-types", "/typologies", "/categories", "/tags", "/seo",
  "/drafts", "/archived", "/trash", "/publish",
  "/tickets", "/feedback",
  "/images", "/videos", "/tours", "/virtual-tours",
  "/security", "/sessions", "/appearance", "/branding", "/theme",
  "/organizations", "/companies", "/developer",
  "/auth/callback", "/auth/confirm", "/auth/reset",
  "/set-password", "/change-password",
  "/signup", "/register", "/sign-up",
  "/admin", "/portal", "/app",
  "/p", "/b", "/u",
  "/health", "/status", "/maintenance",
  "/import", "/export",
  "/opportunities", "/kanban",
  "/amenities", "/configuration",
  "/project-types", "/possession",
  "/rera-details", "/highlights",
  "/specifications", "/usp",
  "/nearby", "/connectivity",
  "/banks", "/loan",
  "/faqs",
  "/testimonials",
  "/team-members",
  "/roles-permissions",
  "/audit-log", "/audit-logs",
  "/activity-log",
  "/lead-sources",
  "/lead-status",
  "/assignment",
  "/reassign",
  "/bulk",
  "/bulk-upload",
  "/csv",
  "/excel",
];

const nestedGuesses = [
  "/projects/abc",
  "/projects/00000000-0000-0000-0000-000000000000",
  "/projects/abc/edit",
  "/projects/abc/units",
  "/projects/abc/media",
  "/projects/abc/documents",
  "/projects/abc/pricing",
  "/builders/abc",
  "/builders/abc/edit",
  "/users/abc",
  "/users/abc/edit",
  "/leads/abc",
  "/leads/abc/edit",
  "/units/abc",
  "/site-visits/abc",
  "/reports/abc",
];

const all = [...new Set([...CANDIDATES, ...nestedGuesses])];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const classified = { public: [], gated: [], notFound: [], other: [] };

for (const route of all) {
  const page = await ctx.newPage();
  await page.goto(ADMIN_URL + route, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
  const final = page.url().replace(ADMIN_URL, "") || "/";
  const title = await page.title();
  const h1 = (await page.locator("h1,h2,.text-2xl").allInnerTexts().catch(() => [])).slice(0, 4);
  const bodyStart = (await page.locator("body").innerText().catch(() => "")).split("\n").map(s => s.trim()).filter(Boolean).slice(0, 8);
  const rec = { route, final, title, h1, bodyStart };

  if (/\/login/.test(final) && route !== "/login") classified.gated.push(rec);
  else if (h1.some((t) => /404|could not be found/i.test(t)) || title.includes("404")) classified.notFound.push(route);
  else if (["/login", "/forgot-password", "/reset-password"].includes(final.split("?")[0]) || route === final.split("?")[0]) {
    if (["/login", "/forgot-password", "/reset-password"].includes(route) || final === route)
      classified.public.push(rec);
    else classified.other.push(rec);
  } else classified.other.push(rec);
  await page.close();
}

fs.writeFileSync(path.join(outDir, "07-browser-routes.json"), JSON.stringify({
  public: classified.public,
  gated: classified.gated,
  notFoundCount: classified.notFound.length,
  notFound: classified.notFound,
  other: classified.other,
}, null, 2));

console.log("PUBLIC", classified.public.map((r) => r.route));
console.log("GATED", classified.gated.map((r) => `${r.route} -> ${r.final}`));
console.log("OTHER", classified.other);
console.log("404 count", classified.notFound.length);

// Deep-dive public pages
const page = await ctx.newPage();
for (const route of ["/login", "/forgot-password", "/reset-password"]) {
  await page.goto(ADMIN_URL + route, { waitUntil: "networkidle" });
  const html = await page.content();
  fs.writeFileSync(path.join(outDir, `html${route.replace(/\W+/g, "_")}.html`), html);
  await page.screenshot({ path: path.join(outDir, `shot${route.replace(/\W+/g, "_")}.png`), fullPage: true });
}

// Login validation: empty submit, invalid email, wrong password, no-access user
async function loginAttempt(email, password, name) {
  await page.goto(ADMIN_URL + "/login", { waitUntil: "networkidle" });
  if (email != null) await page.locator("#email").fill(email);
  if (password != null) await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(2500);
  const rec = {
    name,
    url: page.url(),
    alert: await page.getByRole("alert").innerText().catch(() => null),
    status: await page.getByRole("status").innerText().catch(() => null),
    emailError: await page.locator("#email-error").innerText().catch(() => null),
    passwordError: await page.locator("#password-error").innerText().catch(() => null),
    ariaInvalidEmail: await page.locator("#email").getAttribute("aria-invalid"),
    ariaInvalidPassword: await page.locator("#password").getAttribute("aria-invalid"),
    buttonText: await page.getByRole("button", { name: /sign in|signing in/i }).innerText().catch(() => null),
    body: (await page.locator("body").innerText()).split("\n").map(s=>s.trim()).filter(Boolean).slice(0, 12),
  };
  await page.screenshot({ path: path.join(outDir, `login-${name}.png`), fullPage: true });
  console.log("LOGIN", rec);
  return rec;
}

const loginCases = [];
loginCases.push(await loginAttempt("", "", "empty"));
loginCases.push(await loginAttempt("not-an-email", "x", "invalid-email"));
loginCases.push(await loginAttempt("nobody@example.com", "WrongPass123", "unknown-user"));
loginCases.push(await loginAttempt(process.env.TEST_USER_EMAIL || "sales@propcatch.com", process.env.TEST_USER_PASSWORD || "x", "user-no-admin"));

// Forgot password flows
await page.goto(ADMIN_URL + "/forgot-password", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /send reset/i }).click();
await page.waitForTimeout(1500);
const forgotEmpty = {
  url: page.url(),
  alert: await page.getByRole("alert").innerText().catch(() => null),
  emailError: await page.locator("#email-error").innerText().catch(() => null),
  body: (await page.locator("body").innerText()).split("\n").map(s=>s.trim()).filter(Boolean).slice(0, 12),
};
await page.screenshot({ path: path.join(outDir, "forgot-empty.png"), fullPage: true });

await page.goto(ADMIN_URL + "/forgot-password", { waitUntil: "networkidle" });
await page.locator("#email").fill("qa-reset@example.com");
await page.getByRole("button", { name: /send reset/i }).click();
await page.waitForTimeout(2500);
const forgotValid = {
  url: page.url(),
  alert: await page.getByRole("alert").innerText().catch(() => null),
  status: await page.getByRole("status").innerText().catch(() => null),
  body: (await page.locator("body").innerText()).split("\n").map(s=>s.trim()).filter(Boolean).slice(0, 16),
};
await page.screenshot({ path: path.join(outDir, "forgot-valid.png"), fullPage: true });

// Reset password without token
await page.goto(ADMIN_URL + "/reset-password", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const resetNoToken = {
  url: page.url(),
  body: (await page.locator("body").innerText()).split("\n").map(s=>s.trim()).filter(Boolean).slice(0, 16),
  inputs: await page.locator("input").evaluateAll((els) => els.filter(e => e.type !== "hidden").map(e => ({id:e.id,type:e.type,required:e.required,disabled:e.disabled}))),
  buttons: await page.getByRole("button").allInnerTexts(),
};
await page.screenshot({ path: path.join(outDir, "reset-notoken.png"), fullPage: true });

await page.goto(ADMIN_URL + "/reset-password?code=invalid", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const resetBadToken = {
  url: page.url(),
  body: (await page.locator("body").innerText()).split("\n").map(s=>s.trim()).filter(Boolean).slice(0, 16),
};
await page.screenshot({ path: path.join(outDir, "reset-badtoken.png"), fullPage: true });

// redirectTo preserved
await page.goto(ADMIN_URL + "/projects", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const redirectPreserve = page.url();

fs.writeFileSync(path.join(outDir, "08-auth-behaviors.json"), JSON.stringify({
  loginCases, forgotEmpty, forgotValid, resetNoToken, resetBadToken, redirectPreserve,
}, null, 2));

await ctx.close();
await browser.close();
console.log("DONE auth behaviors");
