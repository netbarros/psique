#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "docs", "stitch", "NON_SCREEN_ROUTES.json");
const SURFACE_TEST_PATH = path.join(ROOT, "test", "api", "backend-surface-contract.test.ts");
const PREFLIGHT_REPORT_PATH = path.join(
  ROOT,
  "docs",
  "baselines",
  "mf24_supabase_deep",
  "preflight-report.json"
);
const HARDENING_MIGRATION_PATH = path.join(
  ROOT,
  "supabase",
  "migrations",
  "20260305000005_enterprise_supabase_hardening.sql"
);
const REPORT_PATH = path.join(ROOT, "docs", "baselines", "mf23_backend_audit", "report.json");

const args = new Set(process.argv.slice(2));
const writeReport = args.has("--write-report");
const outputJson = args.has("--json");

function makeCheck(id, passed, severity, detail) {
  return { id, passed, severity, detail };
}

async function safeRead(filePath) {
  try {
    const value = await fs.readFile(filePath, "utf8");
    return value;
  } catch {
    return null;
  }
}

function routeToFile(routePath) {
  const rel = routePath.replace(/^\/api\//, "");
  return path.join(ROOT, "app", "api", ...rel.split("/"), "route.ts");
}

function hasMethodExport(source, method) {
  const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
  return regex.test(source);
}

function hasAuthCheck(source) {
  return /\bauth\.getUser\s*\(/.test(source);
}

function checkAuth(route, source) {
  const authModel = route.authModel;

  if (authModel.startsWith("authenticated")) {
    return makeCheck(
      "auth_model_enforced",
      hasAuthCheck(source),
      "critical",
      hasAuthCheck(source)
        ? "Authenticated route checks Supabase user session"
        : "Authenticated route missing supabase.auth.getUser check"
    );
  }

  if (authModel === "secret_header") {
    const passed =
      /headers\.get\s*\(/.test(source) &&
      /(authorization|secret|x-telegram-bot-api-secret-token)/i.test(source);
    return makeCheck(
      "auth_secret_header",
      passed,
      route.criticality === "critical" ? "critical" : "major",
      passed
        ? "Secret header validation detected"
        : "Missing secret/header validation expected by authModel=secret_header"
    );
  }

  if (authModel === "stripe_signature") {
    const passed =
      /stripe-signature/i.test(source) &&
      /(constructWebhookEvent|webhooks\.constructEvent)/.test(source);
    return makeCheck(
      "auth_stripe_signature",
      passed,
      "critical",
      passed
        ? "Stripe signature validation detected"
        : "Missing Stripe webhook signature validation"
    );
  }

  if (authModel === "shared_secret") {
    const passed = /(SUPABASE_WEBHOOK_SECRET|x-webhook-secret)/.test(source);
    return makeCheck(
      "auth_shared_secret",
      passed,
      route.criticality === "critical" ? "critical" : "major",
      passed
        ? "Shared secret validation detected"
        : "Missing shared secret validation expected by authModel=shared_secret"
    );
  }

  return null;
}

function checkValidationHeuristics(route, source) {
  const checks = [];
  const validation = String(route.validation ?? "");
  const severity = route.criticality === "critical" ? "critical" : "major";

  if (/zod/i.test(validation)) {
    const passed = /\bzod\b/i.test(source) && /safeParse|parse\s*\(/.test(source);
    checks.push(
      makeCheck(
        "validation_zod",
        passed,
        severity,
        passed ? "Zod validation detected" : "Expected Zod validation not found"
      )
    );
  }

  if (/rate_limit/i.test(validation)) {
    const passed = /rate.?limit|ratelimit|getAIRatelimiter|getAuthRatelimiter|getApiRatelimiter/i.test(
      source
    );
    checks.push(
      makeCheck(
        "validation_rate_limit",
        passed,
        severity,
        passed ? "Rate limit logic detected" : "Expected rate limit logic not found"
      )
    );
  }

  if (/idempotency/i.test(validation)) {
    const passed = /idempot|telegram_updates|upsert|on conflict/i.test(source);
    checks.push(
      makeCheck(
        "validation_idempotency",
        passed,
        severity,
        passed ? "Idempotency guard detected" : "Expected idempotency guard not found"
      )
    );
  }

  if (/query/i.test(validation)) {
    const passed = /searchParams|new URL\s*\(/.test(source);
    checks.push(
      makeCheck(
        "validation_query_handling",
        passed,
        severity,
        passed ? "Query parsing guard detected" : "Expected query parsing guard not found"
      )
    );
  }

  return checks;
}

async function readCatalog() {
  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const routes = Array.isArray(parsed?.routes) ? parsed.routes : [];
  return routes.filter((route) => route.kind === "api");
}

async function run() {
  const apiRoutes = await readCatalog();
  const routeReports = [];

  for (const route of apiRoutes) {
    const report = {
      id: route.id,
      path: route.path,
      methods: route.methods ?? [],
      authModel: route.authModel,
      validation: route.validation,
      criticality: route.criticality,
      checks: [],
    };

    const routeFile = routeToFile(route.path);
    let source = await safeRead(routeFile);
    const fileExists = source !== null;
    report.checks.push(
      makeCheck(
        "route_file_exists",
        fileExists,
        "critical",
        fileExists ? `Route file present (${path.relative(ROOT, routeFile)})` : "Route file is missing"
      )
    );

    if (source !== null) {
      for (const method of route.methods ?? []) {
        const passed = hasMethodExport(source, method);
        report.checks.push(
          makeCheck(
            `method_${method}_exported`,
            passed,
            "critical",
            passed ? `${method} export found` : `Missing ${method} export`
          )
        );
      }

      const authCheck = checkAuth(route, source);
      if (authCheck) {
        report.checks.push(authCheck);
      }

      report.checks.push(...checkValidationHeuristics(route, source));

      if (route.criticality === "critical") {
        const hasLogger = /logger\.(info|warn|error)/.test(source);
        report.checks.push(
          makeCheck(
            "observability_logger",
            hasLogger,
            "major",
            hasLogger ? "Structured logger usage detected" : "No structured logger usage detected"
          )
        );
      }
    }

    routeReports.push(report);
  }

  const globalChecks = [];

  const surfaceTestSource = await safeRead(SURFACE_TEST_PATH);
  const surfaceTestExists = surfaceTestSource !== null;
  globalChecks.push(
    makeCheck(
      "surface_contract_test_exists",
      surfaceTestExists,
      "critical",
      surfaceTestExists
        ? "Backend surface contract test exists"
        : "Missing test/api/backend-surface-contract.test.ts"
    )
  );

  if (surfaceTestSource !== null) {
    const coupledToCatalog = /NON_SCREEN_ROUTES\.json/.test(surfaceTestSource);
    globalChecks.push(
      makeCheck(
        "surface_contract_coupled_to_catalog",
        coupledToCatalog,
        "critical",
        coupledToCatalog
          ? "Surface contract test consumes NON_SCREEN_ROUTES catalog"
          : "Surface contract test is not coupled to NON_SCREEN_ROUTES catalog"
      )
    );
  }

  const preflightSource = await safeRead(PREFLIGHT_REPORT_PATH);
  globalChecks.push(
    makeCheck(
      "supabase_preflight_report_exists",
      true,
      "major",
      preflightSource !== null
        ? "Supabase preflight report present"
        : "Supabase preflight report not present yet (expected before supabase:preflight:write)"
    )
  );

  if (preflightSource !== null) {
    const parsed = JSON.parse(preflightSource);
    const criticalFailed = Number(parsed?.summary?.criticalFailed ?? 0);
    globalChecks.push(
      makeCheck(
        "supabase_preflight_snapshot_status",
        true,
        "major",
        criticalFailed === 0
          ? "Supabase preflight snapshot has zero critical failures"
          : `Supabase preflight snapshot reports ${criticalFailed} critical failure(s); authoritative enforcement runs in supabase:preflight gate`
      )
    );
  }

  const hardeningSource = await safeRead(HARDENING_MIGRATION_PATH);
  globalChecks.push(
    makeCheck(
      "supabase_hardening_migration_exists",
      hardeningSource !== null,
      "critical",
      hardeningSource !== null
        ? "Enterprise Supabase hardening migration present"
        : "Missing Supabase hardening migration 20260305000005"
    )
  );

  const allChecks = [...routeReports.flatMap((route) => route.checks), ...globalChecks];
  const summary = {
    total: allChecks.length,
    passed: allChecks.filter((check) => check.passed).length,
    failed: allChecks.filter((check) => !check.passed).length,
    criticalFailed: allChecks.filter((check) => !check.passed && check.severity === "critical").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    routeReports,
    globalChecks,
  };

  if (writeReport) {
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `[backend-audit] checks=${summary.total} passed=${summary.passed} failed=${summary.failed} criticalFailed=${summary.criticalFailed}`
    );
    for (const check of allChecks.filter((item) => !item.passed)) {
      console.log(` - [FAIL][${check.severity}] ${check.id}: ${check.detail}`);
    }
    if (writeReport) {
      console.log(`[backend-audit] report written to ${path.relative(ROOT, REPORT_PATH)}`);
    }
  }

  if (summary.criticalFailed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(`[backend-audit] failed: ${String(error)}`);
  process.exit(1);
});
