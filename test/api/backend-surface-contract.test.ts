import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, "app", "api");
const NON_SCREEN_ROUTES_PATH = path.join(ROOT, "docs", "stitch", "NON_SCREEN_ROUTES.json");

type CatalogRoute = {
  kind: string;
  path: string;
  methods: string[];
};

function loadApiSurfaceFromCatalog(): Array<{ route: string; methods: string[] }> {
  const raw = fs.readFileSync(NON_SCREEN_ROUTES_PATH, "utf8");
  const parsed = JSON.parse(raw) as { routes?: CatalogRoute[] };

  return (parsed.routes ?? [])
    .filter((route) => route.kind === "api")
    .map((route) => ({ route: route.path, methods: route.methods ?? [] }));
}

function routeToFile(route: string): string {
  const rel = route.replace(/^\/api\//, "");
  return path.join(API_ROOT, ...rel.split("/"), "route.ts");
}

describe("Backend surface contract for frontend/layout agent", () => {
  it("keeps NON_SCREEN_ROUTES API paths and methods stable", () => {
    const apiSurface = loadApiSurfaceFromCatalog();
    expect(apiSurface.length).toBeGreaterThan(0);

    for (const item of apiSurface) {
      const file = routeToFile(item.route);
      expect(fs.existsSync(file), `Missing route file for ${item.route}`).toBe(true);

      const source = fs.readFileSync(file, "utf8");
      for (const method of item.methods) {
        const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`);
        expect(regex.test(source), `Missing ${method} export on ${item.route}`).toBe(true);
      }
    }
  });
});
