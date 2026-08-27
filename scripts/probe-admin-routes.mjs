import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ADMIN_URL = "https://propcatch-admin.vercel.app";
const outDir = path.resolve("scripts/admin-audit");
fs.mkdirSync(outDir, { recursive: true });

const CANDIDATES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/projects",
  "/projects/new",
  "/projects/create",
  "/builders",
  "/builders/new",
  "/builders/create",
  "/users",
  "/users/new",
  "/leads",
  "/settings",
  "/settings/profile",
  "/settings/account",
  "/settings/team",
  "/settings/roles",
  "/account",
  "/team",
  "/roles",
  "/permissions",
  "/staff",
  "/admins",
  "/brokers",
  "/agents",
  "/inventory",
  "/units",
  "/towers",
  "/amenities",
  "/documents",
  "/media",
  "/gallery",
  "/notifications",
  "/messages",
  "/inbox",
  "/reports",
  "/analytics",
  "/cities",
  "/localities",
  "/locations",
  "/configurations",
  "/config",
  "/audit",
  "/activity",
  "/logs",
  "/site-visits",
  "/visits",
  "/callbacks",
  "/enquiries",
  "/inquiries",
  "/shortlists",
  "/compare",
  "/pricing",
  "/approvals",
  "/reviews",
  "/faqs",
  "/cms",
  "/content",
  "/banners",
  "/featured",
  "/logout",
  "/sign-out",
  "/signout",
  "/auth/callback",
  "/auth/confirm",
  "/update-password",
  "/set-password",
  "/change-password",
  "/projects/import",
  "/import",
  "/export",
  "/help",
  "/support",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/onboarding",
  "/invites",
  "/invite",
  "/members",
  "/organizations",
  "/org",
  "/companies",
  "/developer",
  "/developers",
  "/channels",
  "/campaigns",
  "/tasks",
  "/calendar",
  "/map",
  "/search",
  "/saved-searches",
  "/favourites",
  "/favorites",
  "/wishlist",
  "/bookings",
  "/appointments",
  "/requests",
  "/tickets",
  "/feedback",
  "/payments",
  "/billing",
  "/subscriptions",
  "/plans",
  "/coupons",
  "/offers",
  "/promotions",
  "/seo",
  "/tags",
  "/categories",
  "/property-types",
  "/typologies",
  "/floor-plans",
  "/floorplans",
  "/brochures",
  "/rera",
  "/compliance",
  "/verification",
  "/verify",
  "/publish",
  "/drafts",
  "/archived",
  "/trash",
  "/recycle",
  "/contacts",
  "/customers",
  "/buyers",
  "/sellers",
  "/partners",
  "/integrations",
  "/webhooks",
  "/api-keys",
  "/tokens",
  "/sessions",
  "/security",
  "/appearance",
  "/branding",
  "/theme",
  "/notifications/settings",
  "/email",
  "/sms",
  "/whatsapp",
  "/chat",
  "/threads",
  "/pipeline",
  "/kanban",
  "/deals",
  "/opportunities",
  "/follow-ups",
  "/followups",
  "/reminders",
  "/notes",
  "/comments",
  "/attachments",
  "/uploads",
  "/files",
  "/assets",
  "/images",
  "/videos",
  "/tours",
  "/virtual-tours",
  "/amenities/new",
  "/cities/new",
  "/localities/new",
  "/leads/new",
  "/users/invite",
  "/projects/[id]",
  "/p",
  "/b",
  "/u",
  "/admin",
  "/home",
  "/overview",
  "/stats",
  "/metrics",
  "/kpi",
  "/widgets",
  "/master",
  "/masters",
  "/lookup",
  "/lookups",
  "/reference",
  "/status",
  "/health",
  "/maintenance",
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(ADMIN_URL + "/login", { waitUntil: "networkidle" });
const html = await page.content();
fs.writeFileSync(path.join(outDir, "login.html"), html);

const scripts = await page.locator("script[src]").evaluateAll((els) =>
  els.map((e) => e.getAttribute("src")),
);
fs.writeFileSync(path.join(outDir, "login-scripts.json"), JSON.stringify(scripts, null, 2));
console.log("scripts", scripts);

// Download JS chunks and extract route-like strings
const routeHits = new Set();
const chunkDir = path.join(outDir, "chunks");
fs.mkdirSync(chunkDir, { recursive: true });

for (const src of scripts) {
  if (!src) continue;
  const url = src.startsWith("http") ? src : ADMIN_URL + src;
  try {
    const res = await page.request.get(url);
    const text = await res.text();
    const name = src.split("/").pop().slice(0, 80);
    fs.writeFileSync(path.join(chunkDir, name), text);
    const matches = text.match(/["'`](\/[a-zA-Z][a-zA-Z0-9_\-\/\[\]]{1,60})["'`]/g) || [];
    matches.forEach((m) => routeHits.add(m.replace(/["'`]/g, "")));
    const labels = text.match(/["'`](Dashboard|Projects|Builders|Users|Leads|Settings|Enquiries|Visits|Inventory|Reports)["'`]/g) || [];
    if (labels.length) console.log("nav labels in", name, [...new Set(labels)]);
  } catch (e) {
    console.log("chunk fail", src, e.message);
  }
}

// Also try Next.js manifests
const manifests = [
  "/_next/static/chunks/app/layout.js",
  "/_next/static/chunks/app/page.js",
  "/_next/static/chunks/app/dashboard/page.js",
  "/_next/static/chunks/app/(app)/layout.js",
  "/build-manifest.json",
  "/app-build-manifest.json",
];
for (const m of manifests) {
  const res = await page.request.get(ADMIN_URL + m);
  console.log("manifest", m, res.status());
}

fs.writeFileSync(
  path.join(outDir, "js-route-hits.json"),
  JSON.stringify([...routeHits].sort(), null, 2),
);
console.log("route hits sample", [...routeHits].filter((r) => !r.startsWith("/_next")).slice(0, 80));

console.log("===== ROUTE PROBE =====");
const results = [];
for (const route of CANDIDATES) {
  const res = await page.request.get(ADMIN_URL + route, {
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const status = res.status();
  const loc = res.headers()["location"] || "";
  const body = await res.text().catch(() => "");
  const is404 = /This page could not be found|404/i.test(body) && status === 404;
  const isLoginRedirect =
    status === 307 ||
    status === 302 ||
    loc.includes("/login") ||
    /redirectTo=/i.test(body) ||
    /Internal portal sign-in/i.test(body);
  let kind = "unknown";
  if (status === 404 || is404) kind = "404";
  else if (loc.includes("/login") || (status === 200 && /Internal portal sign-in/.test(body) && route !== "/login"))
    kind = "gated";
  else if (status === 200 && !is404) kind = "ok";
  else if ([301, 302, 307, 308].includes(status)) kind = `redirect:${loc}`;
  else kind = `status:${status}`;
  if (kind !== "404") {
    results.push({ route, status, loc, kind, snippet: body.replace(/\s+/g, " ").slice(0, 140) });
    console.log(kind, status, route, loc);
  }
}

fs.writeFileSync(path.join(outDir, "06-route-probe.json"), JSON.stringify(results, null, 2));
console.log("non-404 count", results.length);

await ctx.close();
await browser.close();
