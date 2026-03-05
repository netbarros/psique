#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "baselines", "mf21_reconcile");

const TARGETS = [
  { key: "docs_stitch", globRoot: path.join(ROOT, "docs", "stitch") },
  { key: "files", globRoot: path.join(ROOT, "files") },
  { key: "e2e_contracts", globRoot: path.join(ROOT, "e2e", "contracts") },
  { key: "app_pages", globRoot: path.join(ROOT, "app"), endsWith: "page.tsx" },
  { key: "api_routes", globRoot: path.join(ROOT, "app", "api"), endsWith: "route.ts" },
];

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
      continue;
    }
    if (entry.isFile()) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replaceAll("\\\\", "/");
}

function digest(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function collectGroup(target) {
  const exists = await fs
    .access(target.globRoot)
    .then(() => true)
    .catch(() => false);
  if (!exists) return [];

  const files = await walk(target.globRoot);
  return files
    .filter((file) => (target.endsWith ? file.endsWith(target.endsWith) : true))
    .sort()
    .map(async (file) => {
      const content = await fs.readFile(file);
      return {
        group: target.key,
        file: rel(file),
        checksum: digest(content),
      };
    });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const rows = [];
  for (const target of TARGETS) {
    const collected = await collectGroup(target);
    rows.push(...(await Promise.all(collected)));
  }

  const mirrorDrifts = [];
  const stitchRows = rows.filter((r) => r.group === "docs_stitch");
  for (const stitch of stitchRows) {
    const name = path.basename(stitch.file);
    const mirror = rows.find((r) => r.group === "files" && path.basename(r.file) === name);
    if (!mirror) {
      mirrorDrifts.push({
        id: `mirror_missing_${name}`,
        severity: "critical",
        category: "docs_mirror",
        description: `Missing mirrored file in files/: ${name}`,
        expected: stitch.file,
        actual: null,
      });
      continue;
    }
    if (stitch.checksum !== mirror.checksum) {
      mirrorDrifts.push({
        id: `mirror_checksum_${name}`,
        severity: "critical",
        category: "docs_mirror",
        description: `Checksum mismatch between docs/stitch and files for ${name}`,
        expected: stitch.file,
        actual: mirror.file,
      });
    }
  }

  const gapRegister = {
    generatedAt: new Date().toISOString(),
    baseline: "mf21_reconcile",
    totalFindings: mirrorDrifts.length,
    findings: mirrorDrifts,
  };

  const inventory = {
    generatedAt: new Date().toISOString(),
    totals: {
      docs_stitch: rows.filter((r) => r.group === "docs_stitch").length,
      files: rows.filter((r) => r.group === "files").length,
      e2e_contracts: rows.filter((r) => r.group === "e2e_contracts").length,
      app_pages: rows.filter((r) => r.group === "app_pages").length,
      api_routes: rows.filter((r) => r.group === "api_routes").length,
    },
  };

  await fs.writeFile(path.join(OUT_DIR, "checksums.json"), JSON.stringify(rows, null, 2), "utf8");
  await fs.writeFile(path.join(OUT_DIR, "inventory.json"), JSON.stringify(inventory, null, 2), "utf8");
  await fs.writeFile(path.join(OUT_DIR, "gap-register.json"), JSON.stringify(gapRegister, null, 2), "utf8");

  console.log(`[mf21-freeze-baseline] inventory written to ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`[mf21-freeze-baseline] findings: ${mirrorDrifts.length}`);
}

main().catch((error) => {
  console.error(`[mf21-freeze-baseline] failed: ${String(error)}`);
  process.exit(1);
});
