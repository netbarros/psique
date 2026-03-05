#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const STITCH_DIR = path.join(ROOT, "docs", "stitch");
const FILES_DIR = path.join(ROOT, "files");
const MODE = process.argv.includes("--write") ? "write" : "check";

const MIRROR_ALLOWLIST = [
  "README.md",
  "SCREEN_REGISTRY.md",
  "CANONICAL_MANIFEST.json",
  "DESIGN_TOKENS.md",
  "COMPONENT_LIBRARY.md",
  "LAYOUT_PATTERNS.md",
  "IMPLEMENTATION_BACKLOG.md",
  "NEXT_SESSION_E2E_INPUT.md",
];

function sha(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const drifts = [];

  await fs.mkdir(FILES_DIR, { recursive: true });

  for (const file of MIRROR_ALLOWLIST) {
    const sourcePath = path.join(STITCH_DIR, file);
    const targetPath = path.join(FILES_DIR, file);

    const hasSource = await exists(sourcePath);
    if (!hasSource) {
      drifts.push(`missing-source:${file}`);
      continue;
    }

    const source = await fs.readFile(sourcePath, "utf8");
    const hasTarget = await exists(targetPath);

    if (!hasTarget) {
      drifts.push(`missing-target:${file}`);
      if (MODE === "write") {
        await fs.writeFile(targetPath, source, "utf8");
      }
      continue;
    }

    const target = await fs.readFile(targetPath, "utf8");
    if (sha(source) !== sha(target)) {
      drifts.push(`checksum-mismatch:${file}`);
      if (MODE === "write") {
        await fs.writeFile(targetPath, source, "utf8");
      }
    }
  }

  const filesDirEntries = await fs.readdir(FILES_DIR, { withFileTypes: true });
  for (const entry of filesDirEntries) {
    if (!entry.isFile()) continue;
    if (!MIRROR_ALLOWLIST.includes(entry.name)) {
      drifts.push(`extra-target:${entry.name}`);
      if (MODE === "write") {
        await fs.unlink(path.join(FILES_DIR, entry.name));
      }
    }
  }

  if (drifts.length > 0) {
    console.error(`[sync-stitch-mirror] drift detected (${drifts.length})`);
    for (const item of drifts) {
      console.error(` - ${item}`);
    }
    if (MODE === "check") {
      process.exit(1);
    }
  }

  console.log(`[sync-stitch-mirror] ${MODE} completed with ${drifts.length} drift item(s)`);
}

main().catch((error) => {
  console.error(`[sync-stitch-mirror] failed: ${String(error)}`);
  process.exit(1);
});
