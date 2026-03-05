#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";
const THERAPIST_EMAIL = process.env.E2E_THERAPIST_EMAIL ?? "e2e.therapist@psique.local";
const THERAPIST_PASSWORD = process.env.E2E_THERAPIST_PASSWORD ?? "E2E_Psique_123!";
const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "e2e.patient@psique.local";
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD ?? "E2E_Psique_123!";

const ROOT = process.cwd();
const BASELINE_DIR = (() => {
  if (process.env.MF_BASELINE_DIR) return process.env.MF_BASELINE_DIR;
  return path.join(ROOT, "docs", "baselines", "mf00r");
})();
const SCOPE_FILE = (() => {
  if (process.env.MF_SCOPE_FILE) return process.env.MF_SCOPE_FILE;
  const v3Scope = path.join(BASELINE_DIR, "route-scope-v3.json");
  return v3Scope;
})();
const OUTPUT_DIR = BASELINE_DIR;
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "baseline-visual.json");

function fileSafe(value) {
  return value
    .replace(/^\/+/, "")
    .replace(/[\/:?&#=]+/g, "__")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^$/, "root");
}

async function ensureDir(pathname) {
  await fs.mkdir(pathname, { recursive: true });
}

async function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  let content = "";
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/\r/g, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function loginAs(context, actor) {
  if (actor === "public") return;

  const credentials =
    actor === "therapist"
      ? { email: THERAPIST_EMAIL, password: THERAPIST_PASSWORD, expectedPath: "/dashboard" }
      : { email: PATIENT_EMAIL, password: PATIENT_PASSWORD, expectedPath: "/portal" };

  const page = await context.newPage();
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "domcontentloaded" });

  if (actor === "patient") {
    await page.getByRole("button", { name: /Paciente/i }).click();
  } else {
    await page.getByRole("button", { name: /Psicanalista/i }).click();
  }

  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: /Entrar/i }).click();

  try {
    await page.waitForURL(new RegExp(credentials.expectedPath), { timeout: 20000 });
  } catch {
    // Fallback for client-side auth race: navigate explicitly once cookies are set.
    await page.waitForTimeout(1500);
    await page.goto(`${BASE_URL}${credentials.expectedPath}`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(new RegExp(credentials.expectedPath), { timeout: 20000 });
  }

  await page.close();
}

async function captureRoute(page, routeEntry, viewportName) {
  const errors = [];

  const onPageError = (error) => errors.push(`pageerror: ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  let status = null;
  let finalUrl = null;
  let overflow = null;

  try {
    const response = await page.goto(`${BASE_URL}${routeEntry.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    status = response?.status() ?? null;
    try {
      await page.waitForLoadState("networkidle", { timeout: 7000 });
    } catch {
      // Intentional best effort for dynamic pages.
    }
    finalUrl = page.url();
    overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
  } catch (error) {
    errors.push(`navigation: ${error.message}`);
    finalUrl = page.url();
  }

  const screenshotPath = path.join(
    SCREENSHOT_DIR,
    viewportName,
    routeEntry.actor,
    `${routeEntry.id}__${fileSafe(routeEntry.route)}.png`
  );
  await ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  page.off("pageerror", onPageError);
  page.off("console", onConsole);

  return {
    id: routeEntry.id,
    route: routeEntry.route,
    actor: routeEntry.actor,
    stitchId: routeEntry.stitchId,
    sourceFile: routeEntry.sourceFile,
    viewport: viewportName,
    status,
    finalUrl,
    hasHorizontalOverflow: overflow,
    errors,
    screenshotPath: path.relative(ROOT, screenshotPath),
    capturedAt: new Date().toISOString(),
  };
}

async function main() {
  await loadDotEnvLocal();
  const scopeRaw = await fs.readFile(SCOPE_FILE, "utf8");
  const scope = JSON.parse(scopeRaw);
  const capturableRoutes = scope.routes.filter((route) => route.capturable);

  await ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of scope.viewports) {
      for (const actor of ["public", "therapist", "patient"]) {
        const actorRoutes = capturableRoutes.filter((route) => route.actor === actor);
        if (actorRoutes.length === 0) continue;

        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          locale: "pt-BR",
          timezoneId: "America/Sao_Paulo",
          baseURL: BASE_URL,
        });

        try {
          await loginAs(context, actor);
          const page = await context.newPage();
          for (const route of actorRoutes) {
            const row = await captureRoute(page, route, viewport.name);
            results.push(row);
          }
          await page.close();
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totals: {
      routes: capturableRoutes.length,
      viewports: scope.viewports.length,
      captures: results.length,
      withErrors: results.filter((row) => row.errors.length > 0).length,
      withOverflow: results.filter((row) => row.hasHorizontalOverflow === true).length,
    },
    results,
  };

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  process.stdout.write(
    `MF-00 baseline visual capture complete\n` +
      `Captures: ${payload.totals.captures}\n` +
      `Errors: ${payload.totals.withErrors}\n` +
      `Overflow: ${payload.totals.withOverflow}\n` +
      `Output: ${path.relative(ROOT, OUTPUT_JSON)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`MF-00 baseline visual capture failed: ${error.message}\n`);
  process.exit(1);
});
