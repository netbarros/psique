#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, "docs", "stitch", "CANONICAL_MANIFEST.json");
const outputPath = path.join(ROOT, "e2e", "contracts", "screen-catalog.generated.ts");

const testSpecByScreen = {
  S15: "e2e/auth.spec.ts",
  S16: "e2e/auth.spec.ts",
  S17: "e2e/auth.spec.ts",
  S18: "e2e/auth.spec.ts",
  S26: "e2e/booking.spec.ts",
};

function toExampleRoute(id, routePattern, routeValue) {
  if (id === "S27") return "__component__:app/loading.tsx";
  if (id === "S28") return "/_mf00r_not_found_probe";

  const route = Array.isArray(routeValue) ? routeValue[0] : routeValue;
  const source = routePattern || route;

  return source
    .replace("[slug]", "test-terapeuta")
    .replace("[roomId]", "room-stitch-check")
    .replace("[id]", "11111111-1111-1111-1111-111111111111");
}

function toAliases(routeValue, aliases) {
  if (Array.isArray(aliases) && aliases.length > 0) {
    return aliases;
  }
  if (Array.isArray(routeValue) && routeValue.length > 1) {
    return routeValue.slice(1);
  }
  return [];
}

function toCaptureEvidence(routePattern) {
  if (routePattern.startsWith("__component__")) {
    return `component:${routePattern.replace("__component__:", "")}`;
  }
  return `route:${routePattern}`;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const screens = [...manifest.screens].sort((a, b) => a.id.localeCompare(b.id));

  const rows = screens.map((screen) => {
    const routePattern = screen.routePattern;
    const route = toExampleRoute(screen.id, routePattern, screen.route);
    const aliases = toAliases(screen.route, screen.aliases);
    const capture = {
      capturable: screen.id !== "S27",
      evidenceTarget: toCaptureEvidence(routePattern),
    };

    const testSpec = testSpecByScreen[screen.id] ?? "e2e/screen-contract.spec.ts";
    const requiresAuth = [
      "S01",
      "S03",
      "S04",
      "S05",
      "S06",
      "S07",
      "S08",
      "S09",
      "S10",
      "S19",
      "S20",
      "S21",
      "S22",
      "S23",
      "S24",
      "S25",
    ].includes(screen.id);
    const actor = screen.id.startsWith("S0") || ["S19", "S20", "S21", "S22"].includes(screen.id)
      ? "therapist"
      : ["S10", "S23", "S24", "S25"].includes(screen.id)
        ? "patient"
        : screen.id === "S27"
          ? "system"
          : "public";

    return {
      id: screen.id,
      title: screen.title,
      route,
      routePattern,
      aliases,
      actor,
      requiresAuth,
      theme: screen.theme,
      source: screen.source_type,
      coverageLevel: screen.coverageLevel,
      evidenceRequired: screen.evidenceRequired,
      testSpec,
      capture,
      sourceFile: screen.source_file,
      derivesFrom: screen.derives_from,
    };
  });

  const body = `import type { ScreenContract } from "./screen-contract";\n\n` +
    `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.\n` +
    `// Source: docs/stitch/CANONICAL_MANIFEST.json\n` +
    `export const SCREEN_CONTRACTS: ScreenContract[] = ${JSON.stringify(rows, null, 2)};\n\n` +
    `export const CAPTURABLE_SCREEN_CONTRACTS = SCREEN_CONTRACTS.filter((screen) => screen.capture.capturable);\n`;

  await fs.writeFile(outputPath, body, "utf8");
  console.log(`[generate-screen-catalog] generated ${path.relative(ROOT, outputPath)} with ${rows.length} rows`);
}

main().catch((error) => {
  console.error(`[generate-screen-catalog] failed: ${String(error)}`);
  process.exit(1);
});
