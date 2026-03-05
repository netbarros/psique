#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TRACK_DIRS = [path.join(ROOT, "docs"), path.join(ROOT, "docs", "handoffs")];
const STATE_PATH = path.join(ROOT, "docs", "baselines", "docs_watch", "state.json");
const STATE_PATH_RESOLVED = path.resolve(STATE_PATH);

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const writeState = args.has("--write") || !checkOnly;

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }

  return out;
}

async function collectState() {
  const fileMap = new Map();

  for (const dir of TRACK_DIRS) {
    const files = await walk(dir);
    for (const file of files) {
      if (path.resolve(file) === STATE_PATH_RESOLVED) {
        continue;
      }
      const stat = await fs.stat(file);
      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      fileMap.set(rel, {
        mtimeMs: Math.round(stat.mtimeMs),
        size: stat.size,
      });
    }
  }

  return fileMap;
}

function diff(prev, next) {
  const added = [];
  const changed = [];
  const removed = [];

  for (const [file, meta] of next.entries()) {
    const old = prev.get(file);
    if (!old) {
      added.push({ file, ...meta });
      continue;
    }
    if (old.mtimeMs !== meta.mtimeMs || old.size !== meta.size) {
      changed.push({ file, before: old, after: meta });
    }
  }

  for (const [file, meta] of prev.entries()) {
    if (!next.has(file)) {
      removed.push({ file, ...meta });
    }
  }

  return { added, changed, removed };
}

async function readPreviousState() {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const map = new Map();
    for (const item of parsed.files ?? []) {
      map.set(item.file, { mtimeMs: item.mtimeMs, size: item.size });
    }
    return map;
  } catch {
    return new Map();
  }
}

async function persistState(next, changes) {
  const files = [...next.entries()]
    .map(([file, meta]) => ({ file, ...meta }))
    .sort((a, b) => a.file.localeCompare(b.file));

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      added: changes.added.length,
      changed: changes.changed.length,
      removed: changes.removed.length,
    },
    files,
  };

  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function printSummary(changes, totalFiles) {
  console.log(
    `[track-docs-updates] files=${totalFiles} added=${changes.added.length} changed=${changes.changed.length} removed=${changes.removed.length}`
  );

  const preview = [
    ...changes.added.slice(0, 10).map((item) => ` + ${item.file}`),
    ...changes.changed.slice(0, 10).map((item) => ` * ${item.file}`),
    ...changes.removed.slice(0, 10).map((item) => ` - ${item.file}`),
  ];

  for (const line of preview) {
    console.log(line);
  }
}

async function main() {
  const previous = await readPreviousState();
  const current = await collectState();
  const changes = diff(previous, current);

  printSummary(changes, current.size);

  if (writeState) {
    await persistState(current, changes);
    console.log(`[track-docs-updates] state written: ${path.relative(ROOT, STATE_PATH)}`);
  }

  if (checkOnly && (changes.added.length > 0 || changes.changed.length > 0 || changes.removed.length > 0)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[track-docs-updates] failed: ${String(error)}`);
  process.exit(1);
});
