#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "docs", "stitch", "CANONICAL_MANIFEST.json");

const THEME_SET = new Set(["dark_core", "dark_theater", "light_onboard", "light_patient"]);
const COVERAGE_SET = new Set(["L1", "L2", "L3"]);
const EVIDENCE_SET = new Set([
  "route-contract",
  "flow-critical",
  "trace",
  "screenshot",
  "visual-snapshot",
  "api-auth",
  "api-error",
  "rls-check",
]);

function fail(errors) {
  console.error("[check-canonical-manifest] validation failed");
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

function isRouteValueValid(route) {
  if (typeof route === "string" && route.length > 0) return true;
  if (Array.isArray(route) && route.length > 0 && route.every((v) => typeof v === "string" && v.length > 0)) {
    return true;
  }
  return false;
}

async function main() {
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const errors = [];

  if (!manifest || typeof manifest !== "object") {
    fail(["manifest must be an object"]);
  }

  if (!Array.isArray(manifest.screens)) {
    fail(["screens must be an array"]);
  }

  const ids = new Set();
  for (const [index, screen] of manifest.screens.entries()) {
    const id = `screens[${index}]`;
    const required = [
      "id",
      "source_type",
      "title",
      "theme",
      "route",
      "routePattern",
      "aliases",
      "coverageLevel",
      "evidenceRequired",
      "source_file",
      "status",
    ];

    for (const key of required) {
      if (!(key in screen)) {
        errors.push(`${id}.${key} is required`);
      }
    }

    if (!/^S\d{2}$/.test(screen.id ?? "")) {
      errors.push(`${id}.id must match Sxx`);
    }
    if (ids.has(screen.id)) {
      errors.push(`${id}.id duplicated (${screen.id})`);
    }
    ids.add(screen.id);

    if (!THEME_SET.has(screen.theme)) {
      errors.push(`${id}.theme invalid (${screen.theme})`);
    }
    if (!["stitch", "derived"].includes(screen.source_type)) {
      errors.push(`${id}.source_type invalid (${screen.source_type})`);
    }
    if (!isRouteValueValid(screen.route)) {
      errors.push(`${id}.route must be string or non-empty string[]`);
    }
    if (typeof screen.routePattern !== "string" || screen.routePattern.length === 0) {
      errors.push(`${id}.routePattern must be non-empty string`);
    }
    if (!Array.isArray(screen.aliases) || !screen.aliases.every((x) => typeof x === "string")) {
      errors.push(`${id}.aliases must be string[]`);
    }
    if (!COVERAGE_SET.has(screen.coverageLevel)) {
      errors.push(`${id}.coverageLevel invalid (${screen.coverageLevel})`);
    }
    if (
      !Array.isArray(screen.evidenceRequired) ||
      screen.evidenceRequired.length === 0 ||
      !screen.evidenceRequired.every((x) => EVIDENCE_SET.has(x))
    ) {
      errors.push(`${id}.evidenceRequired invalid`);
    }
  }

  const idNumbers = [...ids]
    .map((id) => Number(id.slice(1)))
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b);
  const maxId = idNumbers.length > 0 ? idNumbers[idNumbers.length - 1] : 0;

  if (ids.size < 28) {
    errors.push(`expected at least 28 screens, found ${ids.size}`);
  }

  for (let i = 1; i <= 28; i += 1) {
    const id = `S${String(i).padStart(2, "0")}`;
    if (!ids.has(id)) {
      errors.push(`missing screen ${id}`);
    }
  }

  if (maxId > 28) {
    for (let i = 1; i <= maxId; i += 1) {
      const id = `S${String(i).padStart(2, "0")}`;
      if (!ids.has(id)) {
        errors.push(`missing screen ${id} (gap before max id S${String(maxId).padStart(2, "0")})`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }

  console.log(`[check-canonical-manifest] ok (${ids.size} screens)`);
}

main().catch((error) => {
  console.error(`[check-canonical-manifest] failed: ${String(error)}`);
  process.exit(1);
});
