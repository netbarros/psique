#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "docs", "stitch", "NON_SCREEN_ROUTES.json");
const DOC_PATH = path.join(ROOT, "docs", "backend", "BACKEND-API-SURFACE.md");

function hasArg(flag) {
  return process.argv.includes(flag);
}

function normalizeMethods(methods) {
  return [...methods].map((method) => String(method).toUpperCase()).sort();
}

function toKey(pathname, methods) {
  return `${pathname}::${normalizeMethods(methods).join(",")}`;
}

function parseDocRows(markdown) {
  const rows = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/);
    if (!match) continue;
    const pathname = match[1]?.trim();
    const methods = match[2]
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    if (pathname?.startsWith("/api/") && methods.length > 0) {
      rows.push({ path: pathname, methods: normalizeMethods(methods) });
    }
  }
  return rows;
}

function buildMarkdown(routes, catalogVersion, catalogGeneratedAt) {
  const generatedAt = catalogGeneratedAt ?? "n/a";
  const header = [
    "# Backend API Surface (Canonical)",
    "",
    "Este documento cobre a superfície backend completa de APIs não-visuais.",
    "",
    `- Fonte canônica: \`docs/stitch/NON_SCREEN_ROUTES.json\``,
    `- Total de APIs: \`${routes.length}\``,
    `- Versão do catálogo: \`${catalogVersion}\``,
    `- Gerado em: \`${generatedAt}\``,
    "",
    "## Regras",
    "1. Política de mudança: additive only.",
    "2. Divergência de `path/method` entre este documento e o catálogo canônico deve falhar em CI.",
    "3. O documento `docs/handoffs/BACKEND-CONTRACT-FRONTEND-AGENT.md` é um subconjunto de consumo frontend.",
    "",
    "## Superfície Completa",
    "",
    "| Path | Methods | Auth Model | Criticality | Validation | Notes |",
    "|---|---|---|---|---|---|",
  ];

  const table = routes.map((route) => {
    const methods = normalizeMethods(route.methods).join(", ");
    const authModel = route.authModel ?? "n/a";
    const criticality = route.criticality ?? "n/a";
    const validation = route.validation ?? "n/a";
    const notes = route.notes ?? "";
    return `| \`${route.path}\` | \`${methods}\` | \`${authModel}\` | \`${criticality}\` | \`${validation}\` | ${notes} |`;
  });

  return `${[...header, ...table].join("\n")}\n`;
}

function comparePathAndMethods(catalogRoutes, docRows) {
  const errors = [];

  const catalogByPath = new Map(
    catalogRoutes.map((route) => [route.path, normalizeMethods(route.methods)]),
  );
  const docByPath = new Map(
    docRows.map((row) => [row.path, normalizeMethods(row.methods)]),
  );

  for (const [catalogPath, catalogMethods] of catalogByPath.entries()) {
    const docMethods = docByPath.get(catalogPath);
    if (!docMethods) {
      errors.push(`missing path in BACKEND-API-SURFACE.md: ${catalogPath}`);
      continue;
    }
    if (JSON.stringify(catalogMethods) !== JSON.stringify(docMethods)) {
      errors.push(
        `method mismatch for ${catalogPath}: expected [${catalogMethods.join(", ")}], found [${docMethods.join(", ")}]`,
      );
    }
  }

  for (const [docPath] of docByPath.entries()) {
    if (!catalogByPath.has(docPath)) {
      errors.push(`extra path in BACKEND-API-SURFACE.md not found in catalog: ${docPath}`);
    }
  }

  const catalogSet = new Set(catalogRoutes.map((route) => toKey(route.path, route.methods)));
  const docSet = new Set(docRows.map((row) => toKey(row.path, row.methods)));
  if (catalogSet.size !== docSet.size) {
    errors.push(
      `path/method set size mismatch: catalog=${catalogSet.size}, doc=${docSet.size}`,
    );
  }

  return errors;
}

async function ensureCatalog() {
  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const catalog = JSON.parse(raw);
  const routes = (catalog.routes ?? [])
    .filter((route) => route.kind === "api")
    .sort((a, b) => String(a.path).localeCompare(String(b.path)));
  return {
    catalogVersion: catalog.version ?? "unknown",
    catalogGeneratedAt: catalog.generated_at ?? null,
    routes,
  };
}

async function main() {
  const isWrite = hasArg("--write");
  const isCheck = hasArg("--check");

  if (!isWrite && !isCheck) {
    console.error("[check-backend-api-surface] missing mode. Use --write or --check.");
    process.exit(1);
  }

  const { routes, catalogVersion, catalogGeneratedAt } = await ensureCatalog();
  const markdown = buildMarkdown(routes, catalogVersion, catalogGeneratedAt);

  if (isWrite) {
    await fs.mkdir(path.dirname(DOC_PATH), { recursive: true });
    await fs.writeFile(DOC_PATH, markdown, "utf8");
    console.log(`[check-backend-api-surface] wrote ${DOC_PATH} (${routes.length} api paths)`);
    return;
  }

  let current;
  try {
    current = await fs.readFile(DOC_PATH, "utf8");
  } catch {
    console.error(`[check-backend-api-surface] missing file: ${DOC_PATH}`);
    console.error("Run: npm run backend:surface:write");
    process.exit(1);
  }

  const docRows = parseDocRows(current);
  const errors = comparePathAndMethods(routes, docRows);

  if (errors.length > 0) {
    console.error("[check-backend-api-surface] failed");
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    process.exit(1);
  }

  if (current !== markdown) {
    console.error(
      "[check-backend-api-surface] path/methods are aligned but canonical doc content is stale.",
    );
    console.error("Run: npm run backend:surface:write");
    process.exit(1);
  }

  console.log(`[check-backend-api-surface] ok (${routes.length} api paths)`);
}

main().catch((error) => {
  console.error(`[check-backend-api-surface] failed: ${String(error)}`);
  process.exit(1);
});
