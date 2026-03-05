#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "docs", "stitch", "CANONICAL_MANIFEST.json");

function defaultCoverage(id, sourceType) {
  if (id === "S27" || id === "S28") return "L3";
  if (sourceType === "stitch") return "L2";
  return "L1";
}

function defaultEvidence(coverageLevel) {
  if (coverageLevel === "L3") return ["route-contract", "trace", "screenshot", "visual-snapshot"];
  if (coverageLevel === "L2") return ["route-contract", "flow-critical", "trace", "screenshot"];
  return ["route-contract", "trace", "screenshot"];
}

function resolveRoutePattern(id, route) {
  if (id === "S28") return "/_mf00r_not_found_probe";
  if (Array.isArray(route)) {
    if (route[0]?.startsWith("/")) return route[0];
    return id === "S27" ? "__component__:app/loading.tsx" : route[0] ?? "/";
  }
  return route;
}

function resolveAliases(route, existingAliases = []) {
  if (Array.isArray(existingAliases) && existingAliases.length > 0) return existingAliases;
  if (Array.isArray(route) && route.length > 1 && route[0]?.startsWith("/")) return route.slice(1);
  return [];
}

async function main() {
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);

  manifest.schema_version = "4.0.0";
  manifest.schema_path = "docs/stitch/schema/canonical-manifest.schema.json";

  manifest.screens = manifest.screens.map((screen) => {
    const routePattern = resolveRoutePattern(screen.id, screen.route);
    const coverageLevel = screen.coverageLevel ?? defaultCoverage(screen.id, screen.source_type);

    return {
      ...screen,
      routePattern,
      aliases: resolveAliases(screen.route, screen.aliases),
      coverageLevel,
      evidenceRequired: screen.evidenceRequired ?? defaultEvidence(coverageLevel),
    };
  });

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("[enrich-canonical-manifest-v4] manifest updated");
}

main().catch((error) => {
  console.error(`[enrich-canonical-manifest-v4] failed: ${String(error)}`);
  process.exit(1);
});
