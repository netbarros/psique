#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const catalogPath = path.join(ROOT, "docs", "stitch", "NON_SCREEN_ROUTES.json");
const apiRoot = path.join(ROOT, "app", "api");

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    if (entry.isFile()) out.push(full);
  }
  return out;
}

function fileToRoute(filePath) {
  const rel = path.relative(apiRoot, filePath).split(path.sep).join("/");
  return `/api/${rel.replace(/\/route\.ts$/, "")}`;
}

async function readMethods(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const methods = [];
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    if (new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`).test(content)) {
      methods.push(method);
    }
  }
  return methods;
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const entries = Array.isArray(catalog.routes) ? catalog.routes : [];
  const errors = [];

  const apiFiles = (await walk(apiRoot)).filter((f) => f.endsWith("route.ts"));
  const runtime = [];
  for (const file of apiFiles) {
    const methods = await readMethods(file);
    runtime.push({ path: fileToRoute(file), methods: methods.sort() });
  }
  runtime.sort((a, b) => a.path.localeCompare(b.path));

  const catalogApi = entries
    .filter((entry) => entry.kind === "api")
    .map((entry) => ({ path: entry.path, methods: [...entry.methods].sort() }))
    .sort((a, b) => a.path.localeCompare(b.path));

  for (const route of runtime) {
    const match = catalogApi.find((item) => item.path === route.path);
    if (!match) {
      errors.push(`missing catalog entry for ${route.path}`);
      continue;
    }
    if (JSON.stringify(match.methods) !== JSON.stringify(route.methods)) {
      errors.push(`method mismatch for ${route.path}: expected ${route.methods.join(",")} got ${match.methods.join(",")}`);
    }
  }

  for (const entry of catalogApi) {
    const found = runtime.find((route) => route.path === entry.path);
    if (!found) {
      errors.push(`catalog has extra API path not in runtime: ${entry.path}`);
    }
  }

  if (!entries.find((entry) => entry.path === "/auth/callback" && entry.kind === "route")) {
    errors.push("missing functional route entry for /auth/callback");
  }

  if (errors.length > 0) {
    console.error("[check-non-screen-routes] failed");
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    process.exit(1);
  }

  console.log(`[check-non-screen-routes] ok (${runtime.length} api paths)`);
}

main().catch((error) => {
  console.error(`[check-non-screen-routes] failed: ${String(error)}`);
  process.exit(1);
});
