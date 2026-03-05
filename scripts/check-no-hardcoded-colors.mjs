#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ALLOWLIST_FILE = path.join(ROOT, ".config", "hardcoded-color-allowlist.json");
const MODE = process.argv.includes("--write-baseline") ? "write" : "check";
const TARGET_DIRS = [path.join(ROOT, "app"), path.join(ROOT, "components")];
const FILE_RE = /\.(tsx|ts|jsx|js)$/;
const COLOR_RE = /(text|bg|border)-\[#([0-9a-fA-F]{3,8})\]/g;

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

function rel(p) {
  return path.relative(ROOT, p).replaceAll("\\\\", "/");
}

async function collect() {
  const matches = [];
  for (const target of TARGET_DIRS) {
    const files = (await walk(target)).filter((f) => FILE_RE.test(f));
    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      for (const match of content.matchAll(COLOR_RE)) {
        matches.push(`${rel(file)}::${match[0]}`);
      }
    }
  }
  return [...new Set(matches)].sort();
}

async function main() {
  const current = await collect();

  if (MODE === "write") {
    await fs.mkdir(path.dirname(ALLOWLIST_FILE), { recursive: true });
    await fs.writeFile(
      ALLOWLIST_FILE,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          policy: "No new hardcoded hex color utility classes outside allowlist baseline.",
          allowlist: current,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`[check-no-hardcoded-colors] baseline saved (${current.length} items)`);
    return;
  }

  const allowlistRaw = await fs.readFile(ALLOWLIST_FILE, "utf8");
  const allowlistJson = JSON.parse(allowlistRaw);
  const allowset = new Set(allowlistJson.allowlist ?? []);

  const violations = current.filter((item) => !allowset.has(item));
  if (violations.length > 0) {
    console.error(`[check-no-hardcoded-colors] ${violations.length} violation(s)`);
    for (const violation of violations.slice(0, 50)) {
      console.error(` - ${violation}`);
    }
    process.exit(1);
  }

  console.log(`[check-no-hardcoded-colors] ok (${current.length} allowlisted occurrences)`);
}

main().catch((error) => {
  console.error(`[check-no-hardcoded-colors] failed: ${String(error)}`);
  process.exit(1);
});
